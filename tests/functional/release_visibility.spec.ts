import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import env from '#start/env'
import User from '#models/user'
import Release from '#models/release'
import Vote from '#models/vote'

const password = 'VisibilityFixturePassword1!'

function isInertiaPage(value: unknown): value is { component: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'component' in value &&
    typeof value.component === 'string'
  )
}

async function readInertiaPage(response: Response) {
  const page: unknown = await response.json()
  if (!isInertiaPage(page)) throw new Error('Expected an Inertia page response')
  return page
}

async function fixtureUser() {
  const id = randomUUID()
  return User.create({
    fullName: 'Visibility fixture',
    username: `visibility_${id.replaceAll('-', '')}`,
    email: `visibility-${id}@example.test`,
    password,
    authVersion: 0,
  })
}

async function fixtureRelease(isSecret: boolean) {
  return Release.create({
    title: `Visibility fixture ${randomUUID()}`,
    description: 'Isolated release visibility fixture',
    date: DateTime.utc().minus({ days: 1 }),
    type: 'single',
    urls: [],
    isSecret,
    isAutomated: false,
    voteCount: 0,
    artistId: null,
  })
}

async function fixtureClient(user?: User) {
  const origin = `http://127.0.0.1:${env.get('PORT')}`
  const cookies = new Map<string, string>()
  const request = async (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: Record<string, string>
  ) => {
    const headers: Record<string, string> = {
      Cookie: Array.from(cookies, ([name, value]) => `${name}=${value}`).join('; '),
      Accept: 'text/html',
    }
    if (method !== 'GET') {
      headers['X-Inertia'] = 'true'
      headers['X-XSRF-TOKEN'] = decodeURIComponent(cookies.get('XSRF-TOKEN') ?? '')
      headers['Content-Type'] = 'application/json'
    }
    const response = await fetch(`${origin}${path}`, {
      method,
      redirect: 'manual',
      headers,
      ...(data ? { body: JSON.stringify(data) } : {}),
    })
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';')[0]
      const separator = pair.indexOf('=')
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1))
    }
    return response
  }

  const loginPage = await request('GET', '/login')
  await loginPage.text()
  if (!cookies.has('XSRF-TOKEN')) throw new Error('Fixture client did not receive a CSRF cookie')
  if (user) {
    const response = await request('POST', '/login', { email: user.email, password })
    await response.text()
    if (![302, 303].includes(response.status)) {
      throw new Error(`Fixture login failed with status ${response.status}`)
    }
  }
  return { request }
}

test.group('Public release visibility and pull-up access', (group) => {
  group.setup(() => {
    if (
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('DB_HOST')) ||
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('QUEUE_REDIS_HOST')) ||
      !/(test|relaunch)/i.test(env.get('DB_DATABASE'))
    ) {
      throw new Error('Release integration tests require an isolated local test database')
    }
  })

  test('secret releases stay hidden by slug and UUID while a public release is readable', async ({
    assert,
    cleanup,
  }) => {
    const secret = await fixtureRelease(true)
    cleanup(() => secret.delete())
    const published = await fixtureRelease(false)
    cleanup(() => published.delete())
    const client = await fixtureClient()

    for (const identifier of [secret.slug, secret.id]) {
      const response = await client.request('GET', `/sorties/${identifier}`)
      const body = await response.text()
      assert.equal(response.status, 404)
      assert.include(response.headers.get('content-type') ?? '', 'text/html')
      assert.notInclude(body, secret.title)
      assert.include(body, 'Voir les sorties')
    }

    const publicResponse = await client.request('GET', `/sorties/${published.slug}`)
    assert.equal(publicResponse.status, 200)
    assert.include(await publicResponse.text(), published.title)
  })

  test('malformed release identifiers return a web 404 for every pull-up action', async ({
    assert,
    cleanup,
  }) => {
    const user = await fixtureUser()
    cleanup(() => user.delete())
    const client = await fixtureClient(user)

    for (const method of ['POST', 'PUT', 'DELETE'] as const) {
      const response = await client.request(method, '/sorties/not-a-uuid/avis', {
        comment: 'Fixture',
      })
      assert.equal(response.status, 404)
      assert.equal(response.headers.get('X-Inertia'), 'true')
      const page = await readInertiaPage(response)
      assert.equal(page.component, 'errors/not_found')
      assert.notInclude(JSON.stringify(page), '22P02')
    }
  })

  test('a member cannot create, change or remove a pull-up on a secret release', async ({
    assert,
    cleanup,
  }) => {
    const user = await fixtureUser()
    cleanup(() => user.delete())
    const secret = await fixtureRelease(true)
    cleanup(() => secret.delete())
    const existing = await Vote.create({
      releaseId: secret.id,
      userId: user.id,
      vote: 1,
      comment: 'Original secret comment',
    })
    await secret.merge({ voteCount: 1 }).save()
    const client = await fixtureClient(user)

    for (const method of ['POST', 'PUT', 'DELETE'] as const) {
      const response = await client.request(method, `/sorties/${secret.id}/avis`, {
        comment: 'Changed secret comment',
      })
      assert.equal(response.status, 404)
      const page = await readInertiaPage(response)
      assert.equal(page.component, 'errors/not_found')
    }

    await existing.refresh()
    await secret.refresh()
    assert.equal(existing.comment, 'Original secret comment')
    assert.equal(secret.voteCount, 1)
    assert.lengthOf(await Vote.query().where('release_id', secret.id), 1)
  })

  test('pull-up changes use the signed-in member and reject another member ownership', async ({
    assert,
    cleanup,
  }) => {
    const owner = await fixtureUser()
    cleanup(() => owner.delete())
    const actor = await fixtureUser()
    cleanup(() => actor.delete())
    const published = await fixtureRelease(false)
    cleanup(() => published.delete())
    const existing = await Vote.create({
      releaseId: published.id,
      userId: owner.id,
      vote: 1,
      comment: 'Owner comment',
    })
    await published.merge({ voteCount: 1 }).save()
    const anonymous = await fixtureClient()
    const denied = await anonymous.request('POST', `/sorties/${published.id}/avis`, {
      comment: 'Anonymous',
    })
    await denied.text()
    assert.oneOf(denied.status, [302, 303])
    assert.equal(
      denied.headers.get('location'),
      `/login?returnTo=${encodeURIComponent(`/sorties/${published.id}#soutenir`)}`
    )

    const client = await fixtureClient(actor)
    for (const method of ['PUT', 'DELETE'] as const) {
      const response = await client.request(method, `/sorties/${published.id}/avis`, {
        userId: owner.id,
        comment: 'Spoofed owner comment',
      })
      assert.equal(response.status, 404)
      const page = await readInertiaPage(response)
      assert.equal(page.component, 'errors/not_found')
    }
    await existing.refresh()
    assert.equal(existing.comment, 'Owner comment')

    const created = await client.request('POST', `/sorties/${published.id}/avis`, {
      userId: owner.id,
      comment: 'Actor comment',
    })
    await created.text()
    assert.oneOf(created.status, [302, 303])
    const ownVote = await Vote.query()
      .where('release_id', published.id)
      .where('user_id', actor.id)
      .firstOrFail()
    assert.equal(ownVote.comment, 'Actor comment')
    await existing.refresh()
    assert.equal(existing.comment, 'Owner comment')
    await published.refresh()
    assert.equal(published.voteCount, 2)

    const updated = await client.request('PUT', `/sorties/${published.id}/avis`, {
      userId: owner.id,
      comment: 'Actor updated comment',
    })
    await updated.text()
    assert.oneOf(updated.status, [302, 303])
    await ownVote.refresh()
    assert.equal(ownVote.comment, 'Actor updated comment')

    const removed = await client.request('DELETE', `/sorties/${published.id}/avis`, {
      userId: owner.id,
    })
    await removed.text()
    assert.oneOf(removed.status, [302, 303])
    assert.isNull(await Vote.find(ownVote.id))
    await existing.refresh()
    assert.equal(existing.comment, 'Owner comment')
    await published.refresh()
    assert.equal(published.voteCount, 1)
  })
})
