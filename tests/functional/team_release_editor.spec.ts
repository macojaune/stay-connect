import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { readdir, rm } from 'node:fs/promises'
import { DateTime } from 'luxon'
import env from '#start/env'
import Artist from '#models/artist'
import Category from '#models/category'
import Release from '#models/release'
import User from '#models/user'
import CoverStorage from '#services/cover_storage'
import TeamReleaseService, { TeamReleaseInputError } from '#services/team_release_service'

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

  async request(path: string, method = 'GET', data?: Record<string, unknown> | FormData) {
    const headers: Record<string, string> = {
      'Accept': 'text/html',
      'X-Inertia': 'true',
      'X-Inertia-Version': this.version,
      'Cookie': Array.from(this.cookies.values()).join('; '),
      'Referer': `http://127.0.0.1:${env.get('PORT')}/equipe/sorties/nouvelle`,
    }
    if (data !== undefined) {
      if (!(data instanceof FormData)) headers['Content-Type'] = 'application/json'
      const xsrf = this.cookies.get('XSRF-TOKEN')?.slice('XSRF-TOKEN='.length)
      if (!xsrf) throw new Error('Initialize the fixture session before submitting')
      headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf)
    }
    const response = await fetch(`http://127.0.0.1:${env.get('PORT')}${path}`, {
      method,
      redirect: 'manual',
      headers,
      ...(data !== undefined
        ? { body: data instanceof FormData ? data : JSON.stringify(data) }
        : {}),
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
  test('rejects a thirteenth category atomically but permits a duplicate selected name', async ({
    assert,
    cleanup,
  }) => {
    const key = randomUUID()
    const artist = await Artist.create({ name: 'Category cap ' + key })
    cleanup(() => artist.delete())
    const categories: Category[] = []
    for (let index = 0; index < 12; index++) {
      const category = await Category.create({ name: 'Cap ' + key + ' ' + index, description: '' })
      categories.push(category)
      cleanup(() => category.delete())
    }
    const service = new TeamReleaseService()
    const data = {
      title: 'Cap release ' + key,
      description: '',
      date: DateTime.utc(),
      type: 'single' as const,
      urls: ['https://example.test/listen'],
      artistId: artist.id,
      categoryIds: categories.map((category) => category.id),
    }
    try {
      await service.create({ ...data, newCategoryName: 'Thirteenth ' + key })
      assert.fail('Expected category cap rejection')
    } catch (error) {
      assert.instanceOf(error, TeamReleaseInputError)
      assert.equal((error as TeamReleaseInputError).field, 'newCategoryName')
    }
    assert.isNull(
      await Category.query()
        .where('name', 'Thirteenth ' + key)
        .first()
    )
    assert.isNull(await Release.query().where('title', data.title).first())
    const release = await service.create({ ...data, newCategoryName: categories[0].name })
    cleanup(() => release.delete())
    await release.load('categories')
    assert.lengthOf(release.categories, 12)
  })

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
      assert.equal((result.body as { component: string }).component, 'errors/forbidden')
      assert.equal(result.response.headers.get('cache-control'), 'no-store')
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
    let releaseId: string | null = null
    cleanup(async () => {
      const release = releaseId ? await Release.find(releaseId) : null
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
    releaseId = release.id
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

    const missingCategories = releaseInput(title, linkedArtistId)
    delete missingCategories.categoryIds
    const ignoredMissingCategories = await client.request(
      `/equipe/sorties/${release.id}`,
      'PATCH',
      missingCategories
    )
    assert.oneOf(ignoredMissingCategories.response.status, [302, 303, 422])
    await release.load('categories')
    assert.equal(release.categories.length, 1)

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

    const originalSlug = release.slug
    const titleCorrection = await client.request(`/equipe/sorties/${release.id}`, 'PATCH', {
      ...releaseInput(`${title} corrigée`, linkedArtistId),
      categoryIds: release.categories.map((category) => category.id),
    })
    assert.oneOf(titleCorrection.response.status, [302, 303])
    await release.refresh()
    assert.equal(release.slug, originalSlug)
    assert.equal(release.title, `${title} corrigée`)
    const oldPublicLink = await client.request(`/sorties/${originalSlug}`)
    assert.equal(oldPublicLink.response.status, 200)
  })

  test('category slug collision returns a field error instead of a server error', async ({
    assert,
    cleanup,
  }) => {
    const user = await memberFixture()
    cleanup(() => user.delete())
    const previous = env.get('STAYCONNECT_EDITOR_USER_IDS') ?? ''
    env.set('STAYCONNECT_EDITOR_USER_IDS', user.id)
    cleanup(() => env.set('STAYCONNECT_EDITOR_USER_IDS', previous))
    const suffix = randomUUID().slice(0, 8)
    const existingName = `Rap Créole ${suffix}`
    const collidingName = `Rap Creole ${suffix}`
    const existing = await Category.create({ name: existingName, description: '' })
    cleanup(() => existing.delete())

    const client = new LocalSessionClient()
    await client.login(user)
    const result = await client.request('/equipe/sorties', 'POST', {
      ...releaseInput(`Collision ${randomUUID()}`),
      newArtistName: `Collision artist ${randomUUID()}`,
      newCategoryName: collidingName,
    })
    assert.oneOf(result.response.status, [302, 303])
    assert.equal(result.response.headers.get('location'), '/equipe/sorties/nouvelle')
    assert.isNull(await Category.query().where('name', collidingName).first())
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

  test('validates and serves an uploaded cover, and removes a failed upload', async ({
    assert,
    cleanup,
  }) => {
    const user = await memberFixture()
    cleanup(() => user.delete())
    const previous = env.get('STAYCONNECT_EDITOR_USER_IDS') ?? ''
    env.set('STAYCONNECT_EDITOR_USER_IDS', user.id)
    cleanup(() => env.set('STAYCONNECT_EDITOR_USER_IDS', previous))
    const artist = await Artist.create({
      name: `Cover artist ${randomUUID()}`,
      description: null,
      isVerified: false,
      spotifyId: null,
    })
    cleanup(() => artist.delete())
    const client = new LocalSessionClient()
    await client.login(user)
    const title = `Cover release ${randomUUID()}`
    let releaseId: string | undefined
    cleanup(async () => {
      if (releaseId) {
        const release = await Release.find(releaseId)
        await release?.delete()
      }
    })
    const image = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLttAAAAABJRU5ErkJggg==',
      'base64'
    )
    const form = (name: string, bytes: Buffer, filename: string) => {
      const data = new FormData()
      data.set('title', name)
      data.set('description', '')
      data.set('date', '2026-09-26')
      data.set('type', 'single')
      data.set('artistId', artist.id)
      data.set('urls[0]', 'https://example.test/listen')
      data.set('coverFile', new Blob([bytes], { type: 'image/png' }), filename)
      return data
    }

    const invalid = await client.request(
      '/equipe/sorties',
      'POST',
      form(title, Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'cover.png')
    )
    assert.oneOf(invalid.response.status, [302, 303])
    assert.equal(invalid.response.headers.get('location'), '/equipe/sorties/nouvelle')
    assert.isNull(await Release.query().where('title', title).first())

    const conflicting = form(title, image, 'cover.png')
    conflicting.set('cover', 'https://example.test/cover.png')
    const both = await client.request('/equipe/sorties', 'POST', conflicting)
    assert.oneOf(both.response.status, [302, 303])
    assert.equal(both.response.headers.get('location'), '/equipe/sorties/nouvelle')
    assert.isNull(await Release.query().where('title', title).first())

    const created = await client.request('/equipe/sorties', 'POST', form(title, image, 'cover.png'))
    assert.oneOf(created.response.status, [302, 303])
    const release = await Release.query().where('title', title).firstOrFail()
    releaseId = release.id
    assert.match(release.cover ?? '', /^https?:\/\/[^/]+\/covers\/[0-9a-f-]+\.png$/)
    const name = new URL(release.cover!).pathname.split('/').at(-1)!
    cleanup(() => rm(CoverStorage.pathFor(name)!, { force: true }))
    const served = await client.request(`/covers/${name}`)
    assert.equal(served.response.status, 200)
    assert.equal(served.response.headers.get('content-type'), 'image/png')
    assert.equal(served.response.headers.get('x-content-type-options'), 'nosniff')
    const publicResponse = await fetch(`http://127.0.0.1:${env.get('PORT')}/covers/${name}`)
    const publicBytes = await publicResponse.arrayBuffer()
    assert.equal(publicBytes.byteLength, image.length)

    const before = await readdir(CoverStorage.directory())
    const duplicate = await client.request(
      '/equipe/sorties',
      'POST',
      form(title, image, 'cover.png')
    )
    assert.oneOf(duplicate.response.status, [302, 303])
    assert.deepEqual(await readdir(CoverStorage.directory()), before)

    const traversal = await client.request('/covers/..%2F..%2F.env')
    assert.equal(traversal.response.status, 404)
  })
})
