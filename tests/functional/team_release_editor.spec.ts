import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import env from '#start/env'
import Artist from '#models/artist'
import Category from '#models/category'
import Release from '#models/release'
import User from '#models/user'

const password = 'TeamEditorFixturePassword1!'

async function memberFixture() {
  const key = randomUUID().replaceAll('-', '')
  return User.create({
    fullName: `Editor fixture ${key}`,
    username: `editor_${key}`,
    email: `editor-${key}@example.test`,
    password,
    authVersion: 0,
  })
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
      if (!xsrf) throw new Error('Initialize the fixture session before submitting')
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

function releaseInput(title: string, artistId?: string): Record<string, unknown> {
  return {
    title,
    description: 'Sortie de validation isolée',
    date: '2026-09-26',
    type: 'single',
    cover: 'https://example.test/cover.jpg',
    urls: ['https://example.test/listen'],
    artistId: artistId ?? null,
    categoryIds: [],
    isSecret: true,
    isAutomated: true,
  }
}

test.group('Team release editor authorization and publication', (group) => {
  group.setup(() => {
    if (
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('DB_HOST')) ||
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('QUEUE_REDIS_HOST')) ||
      !/(test|relaunch)/i.test(env.get('DB_DATABASE'))
    )
      throw new Error('Team editor tests require isolated local PostgreSQL and Redis')
  })

  test('guest and ordinary member cannot open or submit the editor', async ({
    assert,
    cleanup,
  }) => {
    const previous = env.get('STAYCONNECT_EDITOR_USER_IDS') ?? ''
    env.set('STAYCONNECT_EDITOR_USER_IDS', '')
    cleanup(() => env.set('STAYCONNECT_EDITOR_USER_IDS', previous))
    const guest = new LocalSessionClient()
    await guest.request('/login')
    for (const [path, method] of [
      ['/equipe/sorties/nouvelle', 'GET'],
      [`/equipe/sorties/${randomUUID()}/modifier`, 'GET'],
      ['/equipe/sorties', 'POST'],
      [`/equipe/sorties/${randomUUID()}`, 'PATCH'],
    ]) {
      const result = await guest.request(
        path,
        method,
        method === 'GET' ? undefined : releaseInput('Guest forged release')
      )
      assert.oneOf(result.response.status, [302, 303])
      assert.isTrue(result.response.headers.get('location')?.startsWith('/login') ?? false)
    }

    const user = await memberFixture()
    cleanup(() => user.delete())
    const member = new LocalSessionClient()
    await member.login(user)
    for (const [path, method] of [
      ['/equipe/sorties/nouvelle', 'GET'],
      [`/equipe/sorties/${randomUUID()}/modifier`, 'GET'],
      ['/equipe/sorties', 'POST'],
      [`/equipe/sorties/${randomUUID()}`, 'PATCH'],
    ]) {
      const result = await member.request(
        path,
        method,
        method === 'GET' ? undefined : releaseInput('Member forged release')
      )
      assert.equal(result.response.status, 403)
    }
    assert.isNull(await Release.query().where('title', 'Member forged release').first())
  })

  test('listed editor creates and corrects a public release without client control of provenance', async ({
    assert,
    cleanup,
  }) => {
    const user = await memberFixture()
    cleanup(() => user.delete())
    const previous = env.get('STAYCONNECT_EDITOR_USER_IDS') ?? ''
    env.set('STAYCONNECT_EDITOR_USER_IDS', user.id)
    cleanup(() => env.set('STAYCONNECT_EDITOR_USER_IDS', previous))

    const key = randomUUID()
    const title = `Editor release ${key}`
    const artistName = `Editor artist ${key}`
    const categoryName = `Editor category ${key}`
    cleanup(async () => {
      const release = await Release.query().where('title', title).first()
      if (release) await release.delete()
      const artist = await Artist.query().where('name', artistName).first()
      if (artist) await artist.delete()
      const category = await Category.query().where('name', categoryName).first()
      if (category) await category.delete()
    })

    const client = new LocalSessionClient()
    await client.login(user)
    const form = await client.request('/equipe/sorties/nouvelle')
    assert.equal(form.response.status, 200)
    assert.equal(form.response.headers.get('cache-control'), 'no-store')

    const created = await client.request('/equipe/sorties', 'POST', {
      ...releaseInput(title),
      newArtistName: artistName,
      newCategoryName: categoryName,
    })
    assert.oneOf(created.response.status, [302, 303])
    const release = await Release.query().where('title', title).preload('categories').firstOrFail()
    assert.equal(release.isSecret, false)
    assert.equal(release.isAutomated, false)
    assert.equal(release.categories.length, 1)
    assert.equal(release.categories[0].name, categoryName)
    const linkedArtistId = release.artistId
    if (!linkedArtistId) throw new Error('Fixture release has no artist')
    const linkedArtist = await Artist.findOrFail(linkedArtistId)
    assert.equal(release.artistId, linkedArtist.id)
    assert.include(release.slug, 'editor-artist')
    assert.equal(created.response.headers.get('location'), `/sorties/${release.slug}`)
    const publicPage = await client.request(`/sorties/${release.slug}`)
    assert.equal(publicPage.response.status, 200)

    const duplicate = await client.request('/equipe/sorties', 'POST', {
      ...releaseInput(`  ${title.toUpperCase()}  `),
      artistId: linkedArtistId,
    })
    assert.oneOf(duplicate.response.status, [302, 303])
    assert.equal(duplicate.response.headers.get('location'), '/equipe/sorties/nouvelle')
    const copies = await Release.query().where('artistId', linkedArtistId)
    assert.equal(copies.length, 1)

    const removeLastLink = await client.request(`/equipe/sorties/${release.id}`, 'PATCH', {
      ...releaseInput(title),
      artistId: linkedArtistId,
      urls: [],
    })
    assert.oneOf(removeLastLink.response.status, [302, 303])
    assert.equal(
      removeLastLink.response.headers.get('location'),
      `/equipe/sorties/${release.id}/modifier`
    )
    await release.refresh()
    assert.include(String(release.urls), 'https://example.test/listen')

    // A correction to an imported release must retain its source metadata.
    release.isAutomated = true
    await release.save()
    const originalId = release.id
    const updated = await client.request(`/equipe/sorties/${release.id}`, 'PATCH', {
      ...releaseInput(title),
      artistId: release.artistId,
      description: 'Description corrigée',
      categoryIds: release.categories.map((category) => category.id),
      isAutomated: false,
    })
    assert.oneOf(updated.response.status, [302, 303])
    await release.refresh()
    assert.equal(release.id, originalId)
    assert.equal(release.description, 'Description corrigée')
    assert.equal(release.isSecret, false)
    assert.equal(release.isAutomated, true)
  })

  test('invalid relation rolls back a new artist and release', async ({ assert, cleanup }) => {
    const user = await memberFixture()
    cleanup(() => user.delete())
    const previous = env.get('STAYCONNECT_EDITOR_USER_IDS') ?? ''
    env.set('STAYCONNECT_EDITOR_USER_IDS', user.id)
    cleanup(() => env.set('STAYCONNECT_EDITOR_USER_IDS', previous))
    const key = randomUUID()
    const title = `Rollback release ${key}`
    const artistName = `Rollback artist ${key}`
    const client = new LocalSessionClient()
    await client.login(user)
    const result = await client.request('/equipe/sorties', 'POST', {
      ...releaseInput(title),
      newArtistName: artistName,
      categoryIds: [randomUUID()],
    })
    assert.oneOf(result.response.status, [302, 303])
    assert.equal(result.response.headers.get('location'), '/equipe/sorties/nouvelle')
    assert.isNull(await Artist.query().where('name', artistName).first())
    assert.isNull(await Release.query().where('title', title).first())
  })

  test('corrects a legacy release without links or a remote cover', async ({ assert, cleanup }) => {
    const user = await memberFixture()
    cleanup(() => user.delete())
    const previous = env.get('STAYCONNECT_EDITOR_USER_IDS') ?? ''
    env.set('STAYCONNECT_EDITOR_USER_IDS', user.id)
    cleanup(() => env.set('STAYCONNECT_EDITOR_USER_IDS', previous))

    const key = randomUUID()
    const artist = await Artist.create({
      name: `Legacy artist ${key}`,
      description: null,
      isVerified: false,
      spotifyId: null,
    })
    cleanup(() => artist.delete())
    const release = await Release.create({
      title: `Legacy release ${key}`,
      description: '',
      date: DateTime.fromISO('2026-09-26'),
      type: 'single',
      cover: '/demo/cover-1.jpg',
      urls: [],
      artistId: artist.id,
      isSecret: false,
      isAutomated: false,
      voteCount: 0,
    })
    cleanup(() => release.delete())

    const client = new LocalSessionClient()
    await client.login(user)
    const payload = releaseInput(release.title, artist.id)
    delete payload.cover
    payload.urls = []
    payload.description = 'Correction sans lien historique'
    const updated = await client.request(`/equipe/sorties/${release.id}`, 'PATCH', payload)
    assert.oneOf(updated.response.status, [302, 303])
    assert.equal(updated.response.headers.get('location'), `/sorties/${release.slug}`)
    await release.refresh()
    assert.equal(release.cover, '/demo/cover-1.jpg')
    assert.equal(release.description, 'Correction sans lien historique')
    assert.deepEqual(release.urls, [])
  })
})
