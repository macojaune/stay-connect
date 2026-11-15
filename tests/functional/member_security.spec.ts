import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { mock } from 'node:test'
import { DateTime } from 'luxon'
import queue from '@rlanz/bull-queue/services/main'
import env from '#start/env'
import User from '#models/user'
import Release from '#models/release'
import Vote from '#models/vote'
import ArtistSuggestion from '#models/artist_suggestion'
import PasswordResetEmailJob from '#jobs/password_reset_email_job'

const password = 'MemberFixturePassword1!'

async function memberFixture() {
  const key = randomUUID().replaceAll('-', '')
  return User.create({
    fullName: `Listener ${key}`,
    username: `member_${key}`,
    email: `member-${key}@example.test`,
    password,
    authVersion: 0,
  })
}

async function releaseFixture(isSecret = false) {
  return Release.create({
    title: `Member fixture ${randomUUID()}`,
    description: 'Isolated member test fixture',
    date: DateTime.utc().minus({ days: 1 }),
    type: 'single',
    urls: [],
    isSecret,
    isAutomated: false,
    voteCount: 1,
    artistId: null,
  })
}

function pageProps(body: unknown): Record<string, unknown> {
  if (typeof body !== 'object' || body === null || !('props' in body))
    throw new Error('Expected Inertia page')
  const props = body.props
  if (typeof props !== 'object' || props === null) throw new Error('Expected Inertia props')
  return Object.fromEntries(Object.entries(props))
}

function nestedValue(value: unknown, path: string): unknown {
  let current: unknown = value
  for (const key of path.split('.')) {
    if (typeof current !== 'object' || current === null)
      throw new Error(`Missing response field: ${path}`)
    const entries: Record<string, unknown> = Object.fromEntries(Object.entries(current))
    if (!Object.hasOwn(entries, key)) throw new Error(`Missing response field: ${path}`)
    current = entries[key]
  }
  return current
}

class LocalSessionClient {
  private readonly cookies = new Map<string, string>()
  private version = ''

  async request(path: string, method = 'GET', data?: Record<string, unknown>) {
    const headers: Record<string, string> = {
      'Accept': 'text/html',
      'X-Inertia': 'true',
      'X-Inertia-Version': this.version,
      'Cookie': Array.from(this.cookies.values()).join('; '),
    }
    if (data !== undefined) {
      headers['Content-Type'] = 'application/json'
      const xsrf = this.cookies.get('XSRF-TOKEN')?.slice('XSRF-TOKEN='.length)
      if (!xsrf) throw new Error('Initialize the fixture session before submitting a form')
      headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf)
    }
    const response = await fetch(`http://127.0.0.1:${env.get('PORT')}${path}`, {
      method,
      redirect: 'manual',
      headers,
      ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
    })
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0]
      this.cookies.set(pair.slice(0, pair.indexOf('=')), pair)
    }
    const text = await response.text()
    const body: unknown = response.headers.get('content-type')?.includes('application/json')
      ? JSON.parse(text)
      : text
    if (
      typeof body === 'object' &&
      body !== null &&
      'version' in body &&
      (typeof body.version === 'string' || typeof body.version === 'number')
    ) {
      this.version = String(body.version)
    }
    return { response, body }
  }

  async login(user: User) {
    await this.request('/login')
    const result = await this.request('/login', 'POST', {
      email: user.email,
      password,
      returnTo: '/mon-espace',
    })
    if (result.response.status !== 302)
      throw new Error(`Fixture login failed (${result.response.status})`)
  }
}

test.group('Member account isolation', (group) => {
  group.setup(() => {
    if (
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('DB_HOST')) ||
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('QUEUE_REDIS_HOST')) ||
      !/(test|relaunch)/i.test(env.get('DB_DATABASE'))
    )
      throw new Error('Member integration tests require isolated local PostgreSQL and Redis')
  })

  test('guests cannot read member data or submit member actions', async ({ assert }) => {
    const client = new LocalSessionClient()
    await client.request('/login')
    for (const path of ['/mon-espace', '/mon-compte', '/mon-espace/propositions']) {
      const result = await client.request(path)
      assert.equal(result.response.status, 302)
      assert.equal(
        result.response.headers.get('location'),
        `/login?returnTo=${encodeURIComponent(path)}`
      )
    }
    for (const [path, method] of [
      ['/mon-compte', 'PATCH'],
      ['/mon-espace/propositions', 'POST'],
      ['/mon-compte/mot-de-passe', 'POST'],
    ]) {
      const result = await client.request(path, method, { name: 'Unauthorized fixture' })
      assert.oneOf(result.response.status, [302, 303])
      assert.isTrue(result.response.headers.get('location')?.startsWith('/login') ?? false)
    }
  })

  test('dashboard and suggestions only expose owned public activity, never email-matched history', async ({
    assert,
    cleanup,
  }) => {
    const user = await memberFixture()
    const other = await memberFixture()
    cleanup(() => user.delete())
    cleanup(() => other.delete())
    const release = await releaseFixture()
    const secret = await releaseFixture(true)
    cleanup(() => release.delete())
    cleanup(() => secret.delete())
    await Vote.create({
      userId: user.id,
      releaseId: release.id,
      vote: 1,
      comment: 'My member fixture comment',
    })
    await Vote.create({
      userId: other.id,
      releaseId: release.id,
      vote: 1,
      comment: 'Another listener private fixture comment',
    })
    await Vote.create({
      userId: user.id,
      releaseId: secret.id,
      vote: 1,
      comment: 'Secret member fixture comment',
    })
    const ownSuggestion = await ArtistSuggestion.create({
      userId: user.id,
      email: user.email,
      name: 'Owned fixture proposal',
      sourceUrl: 'https://example.test/artist',
      message: null,
      status: 'pending',
    })
    const otherSuggestion = await ArtistSuggestion.create({
      userId: other.id,
      email: other.email,
      name: 'Other listener private proposal',
      sourceUrl: 'https://example.test/other',
      message: null,
      status: 'pending',
    })
    const historical = await ArtistSuggestion.create({
      userId: null,
      email: user.email,
      name: 'Unowned email-matched proposal',
      sourceUrl: null,
      message: null,
      status: 'pending',
    })
    cleanup(() => ownSuggestion.delete())
    cleanup(() => otherSuggestion.delete())
    cleanup(() => historical.delete())
    const client = new LocalSessionClient()
    await client.login(user)
    const dashboard = await client.request('/mon-espace')
    assert.equal(dashboard.response.status, 200)
    assert.equal(dashboard.response.headers.get('cache-control'), 'no-store')
    const props = pageProps(dashboard.body)
    assert.equal(nestedValue(props, 'stats.pullUps'), 1)
    assert.equal(nestedValue(props, 'stats.comments'), 1)
    assert.equal(nestedValue(props, 'stats.suggestions'), 1)
    assert.equal(nestedValue(props, 'pullUps.0.comment'), 'My member fixture comment')
    assert.notInclude(JSON.stringify(props), 'Another listener private fixture comment')
    assert.notInclude(JSON.stringify(props), 'Secret member fixture comment')
    assert.notInclude(JSON.stringify(props), secret.id)
    assert.notInclude(JSON.stringify(props), 'Other listener private proposal')
    assert.notInclude(JSON.stringify(props), 'Unowned email-matched proposal')
    const suggestions = await client.request(`/mon-espace/propositions?userId=${other.id}`)
    assert.equal(suggestions.response.status, 200)
    assert.equal(nestedValue(pageProps(suggestions.body), 'pagination.total'), 1)
    assert.equal(nestedValue(pageProps(suggestions.body), 'suggestions.0.id'), ownSuggestion.id)
  })

  test('profile update cannot alter another user or mass-assign account credentials', async ({
    assert,
    cleanup,
  }) => {
    const user = await memberFixture()
    const other = await memberFixture()
    cleanup(() => user.delete())
    cleanup(() => other.delete())
    const originalEmail = user.email
    const originalUsername = user.username
    const otherName = other.fullName
    const client = new LocalSessionClient()
    await client.login(user)
    const updated = await client.request('/mon-compte', 'PATCH', {
      name: 'Updated public fixture name',
      id: other.id,
      userId: other.id,
      email: other.email,
      username: 'hijacked',
      password: 'BypassedPassword!',
      authVersion: 999,
      isLoxymore: true,
    })
    assert.equal(updated.response.status, 303)
    await user.refresh()
    await other.refresh()
    assert.equal(user.fullName, 'Updated public fixture name')
    assert.equal(user.email, originalEmail)
    assert.equal(user.username, originalUsername)
    assert.equal(user.authVersion, 0)
    assert.isFalse(user.isLoxymore)
    assert.isTrue(await user.verifyPassword(password))
    assert.equal(other.fullName, otherName)
    const account = await client.request('/mon-compte')
    assert.equal(nestedValue(pageProps(account.body), 'status'), 'updated')
  })

  test('new member and public suggestions assign ownership only from the session', async ({
    assert,
    cleanup,
  }) => {
    const user = await memberFixture()
    const other = await memberFixture()
    cleanup(() => user.delete())
    cleanup(() => other.delete())
    const name = `Member proposal ${randomUUID()}`
    const publicName = `Public proposal ${randomUUID()}`
    cleanup(async () => {
      await ArtistSuggestion.query().whereIn('name', [name, publicName]).delete()
    })
    const client = new LocalSessionClient()
    await client.login(user)
    const memberResult = await client.request('/mon-espace/propositions', 'POST', {
      name,
      sourceUrl: 'https://example.test/artist',
      message: 'A local fixture',
      email: other.email,
      userId: other.id,
      status: 'accepted',
    })
    assert.equal(memberResult.response.status, 302)
    const proposal = await ArtistSuggestion.findByOrFail('name', name)
    assert.equal(proposal.userId, user.id)
    assert.equal(proposal.email, user.email)
    assert.equal(proposal.status, 'pending')
    const memberPage = await client.request('/mon-espace/propositions')
    assert.equal(nestedValue(pageProps(memberPage.body), 'status'), 'submitted')
    const guest = new LocalSessionClient()
    await guest.request('/login')
    const publicResult = await guest.request('/artistes/suggestions', 'POST', {
      name: publicName,
      email: user.email,
      sourceUrl: 'https://example.test/public',
      userId: user.id,
      status: 'accepted',
    })
    assert.equal(publicResult.response.status, 409)
    const publicProposal = await ArtistSuggestion.findByOrFail('name', publicName)
    assert.isNull(publicProposal.userId)
    assert.equal(publicProposal.status, 'pending')
    const memberList = await client.request('/mon-espace/propositions')
    assert.equal(nestedValue(pageProps(memberList.body), 'pagination.total'), 1)
    assert.notInclude(JSON.stringify(memberList.body), publicName)
  })

  test('password recovery from an account always targets the authenticated email', async ({
    assert,
    cleanup,
  }) => {
    const user = await memberFixture()
    cleanup(() => user.delete())
    let captured: unknown
    let delayedJob: Awaited<ReturnType<typeof queue.dispatch>> | undefined
    const originalDispatch = queue.dispatch.bind(queue)
    const dispatch = mock.method(queue, 'dispatch', async (_job: unknown, payload: unknown) => {
      captured = payload
      delayedJob = await originalDispatch(
        PasswordResetEmailJob,
        {
          email: `never-existing-${randomUUID()}@example.test`,
          returnTo: '/',
        },
        { delay: 600000, removeOnComplete: true, removeOnFail: true }
      )
      return delayedJob
    })
    cleanup(async () => {
      dispatch.mock.restore()
      await delayedJob?.remove()
    })
    const client = new LocalSessionClient()
    await client.login(user)
    const response = await client.request('/mon-compte/mot-de-passe', 'POST', {
      email: 'someone-else@example.test',
      userId: randomUUID(),
      returnTo: 'https://evil.example',
    })
    assert.equal(response.response.status, 302)
    assert.deepEqual(captured, { email: user.email, returnTo: '/mon-espace' })
    const account = await client.request('/mon-compte')
    assert.equal(nestedValue(pageProps(account.body), 'status'), 'reset-link-sent')
    assert.equal(nestedValue(pageProps(account.body), 'profile.email'), user.email)
  })
})
