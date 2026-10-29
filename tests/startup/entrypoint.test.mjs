import assert from 'node:assert/strict'
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const command = JSON.parse(
  (await readFile(path.join(root, 'Dockerfile'), 'utf8')).match(/^CMD (.+)$/m)[1]
)

async function runStartup(role, extra = {}, signal) {
  const fixture = await mkdtemp(path.join(tmpdir(), 'stayconnect-startup-'))
  try {
    await mkdir(path.join(fixture, 'bin'))
    await mkdir(path.join(fixture, 'scripts'))
    try {
      await copyFile(
        path.join(root, 'scripts/start-container.sh'),
        path.join(fixture, 'scripts/start-container.sh')
      )
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    await writeFile(
      path.join(fixture, 'bin/node'),
      `#!/bin/sh
printf '%s|%s|%s\\n' "$*" "\${QUEUE_ENABLED-unset}" "\${DB_MIGRATION_SINGLE_CONNECTION-unset}" >> "$EVENTS_FILE"
if [ "$1" = ace.js ] && [ "\${MIGRATION_WAIT:-false}" = true ]; then
  exec "$REAL_NODE" -e 'process.on("SIGTERM", () => process.exit(0)); console.log("FIXTURE:READY"); setInterval(() => {}, 1000)'
fi
case "$1" in ace.js) exit "\${MIGRATION_EXIT_CODE:-0}" ;; esac
`,
      { mode: 0o700 }
    )
    const events = path.join(fixture, 'events')
    const child = spawn(command[0], command.slice(1), {
      cwd: fixture,
      env: {
        PATH: `${fixture}/bin:/usr/bin:/bin`,
        APP_ROLE: role,
        RUN_MIGRATIONS_ONCE: 'true',
        QUEUE_ENABLED: 'true',
        EVENTS_FILE: events,
        REAL_NODE: process.execPath,
        ...extra,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    const stderr = []
    child.stderr.on('data', (data) => stderr.push(data))
    child.stdout.on('data', (data) => {
      if (signal && data.toString().includes('FIXTURE:READY')) child.kill(signal)
    })
    const exit = await new Promise((resolve, reject) => {
      child.once('error', reject)
      child.once('exit', (code, signal) => resolve({ code, signal }))
    })
    let calls = []
    try {
      calls = (await readFile(events, 'utf8')).trim().split('\n')
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    return { ...exit, calls, stderr: Buffer.concat(stderr).toString() }
  } finally {
    await rm(fixture, { recursive: true, force: true })
  }
}

for (const [signal, code] of [
  ['SIGTERM', 143],
  ['SIGINT', 130],
]) {
  test(
    `${signal} prevents startup even when the interrupted migration exits zero`,
    { timeout: 5000 },
    async () => {
      const result = await runStartup('web', { MIGRATION_WAIT: 'true' }, signal)
      assert.equal(result.code, code, result.stderr)
      assert.deepEqual(result.calls, ['ace.js migration:run --force|false|true'])
    }
  )
}

test('worker starts only after a successful locked migration', async () => {
  const result = await runStartup('worker')
  assert.equal(result.code, 0, result.stderr)
  assert.deepEqual(result.calls, [
    'ace.js migration:run --force|false|true',
    'bin/console.js queue:listen|true|unset',
  ])
})

for (const role of ['web', 'worker']) {
  test(`${role} does not start after a migration error`, async () => {
    const result = await runStartup(role, { MIGRATION_EXIT_CODE: '42' })
    assert.equal(result.code, 42, result.stderr)
    assert.deepEqual(result.calls, ['ace.js migration:run --force|false|true'])
  })
  test(`${role} keeps its environment after migration`, async () => {
    const result = await runStartup(role, { DB_MIGRATION_SINGLE_CONNECTION: 'false' })
    assert.equal(result.code, 0, result.stderr)
    assert.equal(result.calls.length, 2)
    assert.equal(result.calls[0], 'ace.js migration:run --force|false|true')
    assert.equal(
      result.calls[1],
      `${role === 'web' ? 'bin/server.js' : 'bin/console.js queue:listen'}|true|false`
    )
  })
  test(`${role} preserves explicitly disabled migrations`, async () => {
    const result = await runStartup(role, { RUN_MIGRATIONS_ONCE: 'false' })
    assert.equal(result.code, 0, result.stderr)
    assert.deepEqual(result.calls, [
      `${role === 'web' ? 'bin/server.js' : 'bin/console.js queue:listen'}|true|unset`,
    ])
  })
}
