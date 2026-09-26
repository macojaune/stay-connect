import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { mock } from 'node:test'
import { DateTime } from 'luxon'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import SessionMiddleware from '@adonisjs/session/session_middleware'
import mail from '@adonisjs/mail/services/main'
import env from '#start/env'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'
import AccountService from '#services/account_service'
import PasswordResetService from '#services/password_reset_service'
import AuthRateLimiter from '#services/auth_rate_limiter'
import { enforceSessionVersion, startUserSession } from '#services/auth_session'
import PasswordResetEmailJob from '#jobs/password_reset_email_job'
import PasswordResetMail from '#mails/password_reset_mail'

const originalPassword = 'OriginalFixturePassword1!'
const changedPassword = 'ChangedFixturePassword2!'

async function fixtureUser() {
  const id = randomUUID()
  return User.create({
    fullName: 'Authentication fixture',
    username: `auth_${id.replaceAll('-', '')}`,
    email: `auth-${id}@example.test`,
    password: originalPassword,
    authVersion: 0,
  })
}

async function postAuth(path: string, data: Record<string, string>) {
  const origin = `http://127.0.0.1:${env.get('PORT')}`
  const page = await fetch(`${origin}${path}`)
  await page.text()
  const cookies = page.headers.getSetCookie().map((cookie) => cookie.split(';')[0])
  const xsrf = cookies
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
    ?.slice('XSRF-TOKEN='.length)
  if (!xsrf) throw new Error('Fixture page did not provide its CSRF cookie')
  const response = await fetch(`${origin}${path}`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Cookie': cookies.join('; '),
      'Content-Type': 'application/json',
      'Accept': 'text/html',
      'X-Inertia': 'true',
      'X-XSRF-TOKEN': decodeURIComponent(xsrf),
    },
    body: JSON.stringify(data),
  })
  await response.text()
  return response
}

test.group('Authentication security against local PostgreSQL and Redis', (group) => {
  group.setup(() => {
    if (
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('DB_HOST')) ||
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('QUEUE_REDIS_HOST')) ||
      !/(test|relaunch)/i.test(env.get('DB_DATABASE'))
    ) {
      throw new Error('Authentication integration tests require an isolated local test database')
    }
  })

  test('stores only a digest, replaces previous links, and rejects expired tokens', async ({
    assert,
    cleanup,
  }) => {
    const user = await fixtureUser()
    cleanup(() => user.delete())
    const passwords = new PasswordResetService()
    const firstToken = await passwords.issue(user)
    const firstRecord = await PasswordResetToken.findOrFail(user.id)
    assert.match(firstRecord.tokenHash, /^[a-f0-9]{64}$/)
    assert.notEqual(firstRecord.tokenHash, firstToken)
    assert.closeTo(firstRecord.expiresAt.diff(firstRecord.createdAt, 'minutes').minutes, 30, 0.02)
    const nextToken = await passwords.issue(user)
    assert.isFalse(await passwords.isValid(firstToken))
    assert.isTrue(await passwords.isValid(nextToken))
    assert.isFalse(await passwords.consume(firstToken, changedPassword))
    const current = await PasswordResetToken.findOrFail(user.id)
    current.expiresAt = DateTime.utc().minus({ seconds: 1 })
    await current.save()
    assert.isFalse(await passwords.consume(nextToken, changedPassword))
    await user.refresh()
    assert.isTrue(await user.verifyPassword(originalPassword))
    assert.equal(user.authVersion, 0)
  })

  test('only one concurrent reset succeeds and older authenticated sessions are revoked', async ({
    assert,
    cleanup,
  }) => {
    const user = await fixtureUser()
    cleanup(() => user.delete())
    const passwords = new PasswordResetService()
    const token = await passwords.issue(user)
    const ctx = await testUtils.createHttpContext()
    const sessions = await app.container.make(SessionMiddleware)
    await sessions.handle(ctx, async () => {
      const auth = await app.container.make('auth.manager')
      ctx.auth = auth.createAuthenticator(ctx)
      await startUserSession(ctx, user)
      const results = await Promise.all([
        passwords.consume(token, changedPassword),
        passwords.consume(token, 'OtherFixturePassword3!'),
      ])
      assert.equal(results.filter(Boolean).length, 1)
      await user.refresh()
      assert.equal(user.authVersion, 1)
      assert.isFalse(await user.verifyPassword(originalPassword))
      assert.isTrue(
        await user.verifyPassword(results[0] ? changedPassword : 'OtherFixturePassword3!')
      )
      assert.isFalse(await passwords.isValid(token))
      assert.isFalse(await passwords.consume(token, originalPassword))
      await enforceSessionVersion(ctx)
      assert.isUndefined(ctx.auth.use('web').user)
      assert.isFalse(ctx.session.has('auth_web'))
    })
  })

  test('a failed password save rolls back token consumption and session revocation', async ({
    assert,
    cleanup,
  }) => {
    const user = await fixtureUser()
    cleanup(() => user.delete())
    const passwords = new PasswordResetService()
    const token = await passwords.issue(user)
    const save = mock.method(User.prototype, 'save', async () => {
      throw new Error('Fixture persistence failure')
    })
    try {
      await assert.rejects(async () => {
        await passwords.consume(token, changedPassword)
      }, /Fixture persistence failure/)
    } finally {
      save.mock.restore()
    }
    assert.isTrue(await passwords.isValid(token))
    await user.refresh()
    assert.equal(user.authVersion, 0)
    assert.isTrue(await user.verifyPassword(originalPassword))
  })

  test('concurrent registration cannot create case variants of the same email', async ({
    assert,
    cleanup,
  }) => {
    const email = `signup-${randomUUID()}@example.test`
    cleanup(async () => {
      await User.query().whereRaw('LOWER(email) = ?', [email]).delete()
    })
    const accounts = new AccountService()
    const results = await Promise.allSettled([
      accounts.register({ name: 'Registration fixture', email, password: originalPassword }),
      accounts.register({
        name: 'Registration fixture',
        email: email.toUpperCase(),
        password: originalPassword,
      }),
    ])
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1)
    const users = await User.query().whereRaw('LOWER(email) = ?', [email])
    assert.lengthOf(users, 1)
    const authenticated = await accounts.verifyCredentials(email.toUpperCase(), originalPassword)
    assert.equal(authenticated.id, users[0].id)
  })

  test('atomically limits reset requests even for an unknown address', async ({ assert }) => {
    const limiter = new AuthRateLimiter()
    const identity = `unknown-${randomUUID()}@example.test`
    const ip = `fixture-${randomUUID()}`
    const results = await Promise.all(
      Array.from({ length: 6 }, () => limiter.consume('forgot-password', ip, identity))
    )
    assert.equal(results.filter((result) => result === 0).length, 3)
    assert.equal(results.filter((result) => result > 0).length, 3)
  })

  test('different username bases cannot collide during concurrent signup', async ({
    assert,
    cleanup,
  }) => {
    const id = randomUUID().replaceAll('-', '').slice(0, 12)
    const base = `fixture${id}`
    const suffix = `@${id}.example.test`
    cleanup(async () => {
      await User.query().where('email', 'like', `%${suffix}`).delete()
    })
    const accounts = new AccountService()
    await accounts.register({ name: base, email: `existing${suffix}`, password: originalPassword })
    const users = await Promise.all([
      accounts.register({ name: base, email: `first${suffix}`, password: originalPassword }),
      accounts.register({ name: `${base}1`, email: `second${suffix}`, password: originalPassword }),
    ])
    assert.notEqual(users[0].username, users[1].username)
    assert.lengthOf(await User.query().where('email', 'like', `%${suffix}`), 3)
  })

  test('the reset worker sends a usable link only to an unambiguous existing account', async ({
    assert,
    cleanup,
  }) => {
    const user = await fixtureUser()
    cleanup(() => user.delete())
    const { mails } = mail.fake()
    cleanup(() => mail.restore())
    const job = new PasswordResetEmailJob()
    await job.handle({ email: `unknown-${randomUUID()}@example.test`, returnTo: '/' })
    mails.assertSentCount(0)
    await job.handle({ email: user.email.toUpperCase(), returnTo: '/sorties/fixture#soutenir' })
    mails.assertSentCount(1)
    let resetToken = ''
    mails.assertSent(PasswordResetMail, (sent) => {
      const link = new URL(sent.payload.resetUrl)
      resetToken = link.searchParams.get('token') ?? ''
      return (
        sent.payload.email === user.email &&
        link.searchParams.get('returnTo') === '/sorties/fixture#soutenir'
      )
    })
    assert.isTrue(await new PasswordResetService().isValid(resetToken))
  })

  test('HTTP validation returns to the auth form without a Referer header', async ({ assert }) => {
    const returnTo = '/sorties/fixture#soutenir'
    const cases: { path: string; data: Record<string, string>; expected: string }[] = [
      {
        path: '/register',
        data: {
          name: 'Fixture listener',
          email: `invalid-${randomUUID()}@example.test`,
          password: originalPassword,
          password_confirmation: 'different',
          returnTo,
        },
        expected: `/register?returnTo=${encodeURIComponent(returnTo)}`,
      },
      {
        path: '/reset-password',
        data: {
          token: 'a'.repeat(43),
          password: originalPassword,
          password_confirmation: 'different',
          returnTo,
        },
        expected: `/reset-password?${new URLSearchParams({ returnTo, token: 'a'.repeat(43) })}`,
      },
    ]
    for (const scenario of cases) {
      const response = await postAuth(scenario.path, scenario.data)
      assert.oneOf(response.status, [302, 303])
      assert.equal(response.headers.get('location'), scenario.expected)
    }
  })

  test('HTTP login preserves the support anchor in its Inertia navigation', async ({
    assert,
    cleanup,
  }) => {
    const user = await fixtureUser()
    cleanup(() => user.delete())
    const response = await postAuth('/login', {
      email: user.email,
      password: originalPassword,
      returnTo: '/sorties/fixture#soutenir',
    })
    assert.equal(response.status, 409)
    assert.equal(response.headers.get('X-Inertia-Location'), '/sorties/fixture#soutenir')
  })

  test('forgot-password confirmation survives an Inertia asset version reload', async ({
    assert,
  }) => {
    const origin = `http://127.0.0.1:${env.get('PORT')}`
    const response = await postAuth('/forgot-password', {
      email: `queued-unknown-${randomUUID()}@example.test`,
      returnTo: '/sorties/fixture#soutenir',
    })
    assert.oneOf(response.status, [302, 303])
    const location = response.headers.get('location')
    if (!location) throw new Error('Reset request did not redirect')
    const cookieJar = new Map<string, string>()
    const rememberCookies = (headers: Headers) => {
      for (const cookie of headers.getSetCookie()) {
        const pair = cookie.split(';')[0]
        cookieJar.set(pair.slice(0, pair.indexOf('=')), pair)
      }
    }
    rememberCookies(response.headers)
    const stale = await fetch(`${origin}${location}`, {
      redirect: 'manual',
      headers: {
        'Cookie': Array.from(cookieJar.values()).join('; '),
        'X-Inertia': 'true',
        'X-Inertia-Version': 'obsolete-fixture-version',
      },
    })
    await stale.text()
    assert.equal(stale.status, 409)
    assert.equal(stale.headers.get('X-Inertia-Location'), location)
    rememberCookies(stale.headers)
    const fresh = await fetch(`${origin}${location}`, {
      headers: { Cookie: Array.from(cookieJar.values()).join('; ') },
    })
    assert.equal(fresh.status, 200)
    assert.include(await fresh.text(), 'Regarde tes emails')
  })

  test('an auth asset reload keeps the reset token and destination in its URL', async ({
    assert,
  }) => {
    const query = new URLSearchParams({
      token: 'b'.repeat(43),
      returnTo: '/sorties/fixture#soutenir',
    })
    const path = `/reset-password?${query}`
    const response = await fetch(`http://127.0.0.1:${env.get('PORT')}${path}`, {
      redirect: 'manual',
      headers: { 'X-Inertia': 'true', 'X-Inertia-Version': 'obsolete-fixture-version' },
    })
    await response.text()
    assert.equal(response.status, 409)
    assert.equal(response.headers.get('X-Inertia-Location'), path)
  })
})
