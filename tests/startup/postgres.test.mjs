import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import net from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { after, before, test } from 'node:test'
import { fileURLToPath } from 'node:url'

// Run after `node ace build`. Uses native PostgreSQL, never a configured app DB.
const root = fileURLToPath(new URL('../../', import.meta.url))
const require = createRequire(path.join(root, 'package.json'))
const { Client } = require('pg')
const pgBin = process.env.PG_BIN ?? '/opt/homebrew/opt/postgresql@14/bin'
const fixture = await mkdtemp(path.join(tmpdir(), 'stayconnect-migrations-'))
const pgData = path.join(fixture, 'postgres')
const children = new Set()
let port
let admin
let started = false
let nextDatabase = 0

async function freePort() {
  const server = net.createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const available = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return available
}

function pgCommand(command, args) {
  const result = spawnSync(path.join(pgBin, command), args, { encoding: 'utf8', timeout: 15000 })
  assert.equal(result.status, 0, `${command}: ${result.stderr || result.stdout}`)
}

before(async () => {
  port = await freePort()
  pgCommand('initdb', [
    '-D',
    pgData,
    '-A',
    'trust',
    '-U',
    'fixture',
    '--no-locale',
    '--encoding=UTF8',
  ])
  pgCommand('pg_ctl', [
    '-D',
    pgData,
    '-l',
    path.join(fixture, 'postgres.log'),
    '-o',
    `-h 127.0.0.1 -p ${port} -k ${fixture}`,
    '-w',
    'start',
  ])
  started = true
  admin = new Client({ host: '127.0.0.1', port, user: 'fixture', database: 'postgres' })
  await admin.connect()
})

after(async () => {
  for (const child of children) {
    try {
      process.kill(-child.pid, 'SIGKILL')
    } catch (error) {
      if (error.code !== 'ESRCH') throw error
    }
  }
  await admin?.end()
  if (started) pgCommand('pg_ctl', ['-D', pgData, '-m', 'immediate', '-w', 'stop'])
  await rm(fixture, { recursive: true, force: true })
})

async function application(migration) {
  const database = `scenario_${++nextDatabase}`
  await admin.query(`CREATE DATABASE ${database}`)
  const directory = path.join(fixture, database)
  await cp(path.join(root, 'build'), directory, { recursive: true })
  await symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir')
  await mkdir(path.join(directory, 'scripts'), { recursive: true })
  await cp(
    path.join(root, 'scripts/start-container.sh'),
    path.join(directory, 'scripts/start-container.sh')
  )
  await mkdir(path.join(directory, 'shim'))
  // Ace and the database are real. Only the final service launch is observed.
  await writeFile(
    path.join(directory, 'shim/node'),
    `#!/bin/sh\nif [ "$1" = ace.js ]; then exec "$REAL_NODE" "$@"; fi\nprintf 'SERVICE:%s\\n' "$*"\n`,
    { mode: 0o700 }
  )
  if (migration !== undefined) {
    await rm(path.join(directory, 'database/migrations'), { recursive: true, force: true })
    await mkdir(path.join(directory, 'database/migrations'), { recursive: true })
    await writeFile(
      path.join(directory, 'database/migrations/1000000000000_fixture.js'),
      `import { BaseSchema } from '@adonisjs/lucid/schema'\nexport default class extends BaseSchema { ${migration} }\n`
    )
  }
  const env = {
    PATH: `${directory}/shim:/usr/bin:/bin`,
    REAL_NODE: process.execPath,
    NODE_ENV: 'production',
    PORT: '3333',
    HOST: '127.0.0.1',
    APP_URL: 'http://127.0.0.1:3333',
    APP_KEY: 'synthetic-startup-test-key-only-000000000000',
    LOG_LEVEL: 'fatal',
    SESSION_DRIVER: 'memory',
    DB_HOST: '127.0.0.1',
    DB_PORT: String(port),
    DB_USER: 'fixture',
    DB_DATABASE: database,
    BREVO_API_KEY: 'synthetic-no-provider',
    BREVO_CONTACT_LIST_ID: '1',
    MAIL_FROM_ADDRESS: 'qa@example.invalid',
    MAIL_FROM_NAME: 'Fixture',
    SPOTIFY_CLIENT_ID: 'synthetic',
    SPOTIFY_CLIENT_SECRET: 'synthetic',
    QUEUE_ENABLED: 'false',
    QUEUE_REDIS_HOST: '127.0.0.1',
    QUEUE_REDIS_PORT: '1',
    RUN_MIGRATIONS_ONCE: 'true',
  }
  return { database, directory, env }
}

function start(app, role = 'web', realService = false) {
  const env = { ...app.env, APP_ROLE: role }
  if (realService) env.PATH = `${path.dirname(process.execPath)}:/usr/bin:/bin`
  const child = spawn('sh', ['scripts/start-container.sh'], {
    cwd: app.directory,
    env,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  children.add(child)
  let output = ''
  child.stdout.on('data', (chunk) => {
    output += chunk
  })
  child.stderr.on('data', (chunk) => {
    output += chunk
  })
  const done = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => {
      children.delete(child)
      resolve({ code, signal, output })
    })
  })
  return { child, done, output: () => output }
}

async function until(check, message, timeout = 10000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await check()) return
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  throw new Error(message)
}

async function sql(app, query) {
  const client = new Client({ host: '127.0.0.1', port, user: 'fixture', database: app.database })
  await client.connect()
  try {
    return await client.query(query)
  } finally {
    await client.end()
  }
}

test(
  'loss of the advisory-lock session blocks further DDL and service launch',
  { timeout: 20000 },
  async () => {
    const app = await application(`
    static disableTransactions = true
    async up() {
      console.log('FIXTURE:GAP')
      await new Promise(resolve => setTimeout(resolve, 1500))
      await this.db.rawQuery('CREATE TABLE must_not_exist (id integer)')
    }
  `)
    const run = start(app)
    await until(() => run.output().includes('FIXTURE:GAP'), 'migration did not reach the gap')
    const lock = await admin.query(
      "SELECT l.pid FROM pg_locks l JOIN pg_database d ON d.oid=l.database WHERE l.locktype='advisory' AND l.granted AND d.datname=$1",
      [app.database]
    )
    assert.equal(lock.rowCount, 1)
    await admin.query('SELECT pg_terminate_backend($1)', [lock.rows[0].pid])
    const result = await run.done
    assert.notEqual(result.code, 0, result.output)
    assert.doesNotMatch(result.output, /SERVICE:/)
    assert.equal(
      (await sql(app, "SELECT to_regclass('public.must_not_exist') AS relation")).rows[0].relation,
      null,
      'DDL ran after loss of the lock session'
    )
    assert.equal(
      (
        await admin.query('SELECT count(*)::integer AS n FROM pg_stat_activity WHERE datname=$1', [
          app.database,
        ])
      ).rows[0].n,
      0
    )
  }
)

test(
  'two starts cannot migrate concurrently; the losing start retries idempotently',
  { timeout: 25000 },
  async () => {
    const app = await application(`
    async up() {
      console.log('FIXTURE:LOCKED')
      await this.db.rawQuery('SELECT pg_sleep(3)')
      await this.db.rawQuery('CREATE TABLE migration_result (id integer PRIMARY KEY)')
      await this.db.rawQuery('INSERT INTO migration_result VALUES (1)')
    }
  `)
    const first = start(app)
    await until(() => first.output().includes('FIXTURE:LOCKED'), 'migration did not hold the lock')
    const second = await start(app, 'worker').done
    assert.notEqual(second.code, 0, second.output)
    assert.doesNotMatch(second.output, /SERVICE:/)
    assert.match(second.output, /lock/i)
    const winner = await first.done
    assert.equal(winner.code, 0, winner.output)
    assert.match(winner.output, /SERVICE:bin\/server.js/)
    const before = (await sql(app, 'SELECT * FROM adonis_schema ORDER BY id')).rows
    const retry = await start(app, 'worker').done
    assert.equal(retry.code, 0, retry.output)
    assert.match(retry.output, /SERVICE:bin\/console.js queue:listen/)
    assert.deepEqual((await sql(app, 'SELECT * FROM adonis_schema ORDER BY id')).rows, before)
    assert.deepEqual((await sql(app, 'SELECT * FROM migration_result')).rows, [{ id: 1 }])
  }
)

test('a failed real migration rolls back and neither role starts', { timeout: 25000 }, async () => {
  const app = await application(`
    async up() {
      await this.db.rawQuery('CREATE TABLE failed_change (id integer)')
      throw new Error('Synthetic migration failure')
    }
  `)
  for (const role of ['web', 'worker']) {
    const result = await start(app, role).done
    assert.notEqual(result.code, 0, result.output)
    assert.match(result.output, /Synthetic migration failure/)
    assert.doesNotMatch(result.output, /SERVICE:/)
    assert.equal(
      (await sql(app, "SELECT to_regclass('public.failed_change') AS relation")).rows[0].relation,
      null
    )
    assert.equal((await sql(app, 'SELECT count(*)::integer AS n FROM adonis_schema')).rows[0].n, 0)
  }
})

test(
  'the application migrations finish before either role and a second pass is unchanged',
  { timeout: 25000 },
  async () => {
    const app = await application()
    const first = await start(app).done
    assert.equal(first.code, 0, first.output)
    assert.match(first.output, /SERVICE:bin\/server.js/)
    const before = (await sql(app, 'SELECT * FROM adonis_schema ORDER BY id')).rows
    assert.equal(before.length, 23)
    const second = await start(app, 'worker').done
    assert.equal(second.code, 0, second.output)
    assert.match(second.output, /SERVICE:bin\/console.js queue:listen/)
    assert.deepEqual((await sql(app, 'SELECT * FROM adonis_schema ORDER BY id')).rows, before)
    app.env.PORT = String(await freePort())
    app.env.APP_URL = `http://127.0.0.1:${app.env.PORT}`
    const web = start(app, 'web', true)
    try {
      let response
      await until(async () => {
        try {
          response = await fetch(`${app.env.APP_URL}/artistes`, {
            signal: AbortSignal.timeout(1000),
          })
          return true
        } catch {
          return false
        }
      }, `compiled web did not start: ${web.output()}`)
      assert.equal(response.status, 200)
      assert.match(response.headers.get('content-type'), /text\/html/)
      const html = await response.text()
      assert.match(html, /<title inertia>Les artistes<\/title>/)
      assert.match(html, /Le répertoire attend ses artistes\./)
    } finally {
      web.child.kill('SIGTERM')
      await web.done
    }
  }
)

test(
  'SIGTERM during migration reaches the child and never starts the service',
  { timeout: 20000 },
  async () => {
    const app = await application(`
    async up() {
      console.log('FIXTURE:WAITING')
      await this.db.rawQuery('SELECT pg_sleep(3)')
      await this.db.rawQuery('CREATE TABLE after_stop (id integer)')
    }
  `)
    const run = start(app)
    await until(() => run.output().includes('FIXTURE:WAITING'), 'migration did not start')
    run.child.kill('SIGTERM')
    const result = await run.done
    assert.notEqual(result.code, 0, result.output)
    assert.doesNotMatch(result.output, /SERVICE:/)
    await until(
      async () =>
        (
          await admin.query(
            'SELECT count(*)::integer AS n FROM pg_stat_activity WHERE datname=$1',
            [app.database]
          )
        ).rows[0].n === 0,
      'migration backend remained after SIGTERM'
    )
    assert.equal(
      (await sql(app, "SELECT to_regclass('public.after_stop') AS relation")).rows[0].relation,
      null,
      'migration continued after the container stop request'
    )
    assert.equal(
      (
        await admin.query('SELECT count(*)::integer AS n FROM pg_stat_activity WHERE datname=$1', [
          app.database,
        ])
      ).rows[0].n,
      0
    )
  }
)
