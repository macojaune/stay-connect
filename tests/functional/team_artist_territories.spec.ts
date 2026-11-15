import { test } from '@japa/runner'
import { randomUUID } from 'node:crypto'
import { DateTime } from 'luxon'
import env from '#start/env'
import Artist from '#models/artist'
import ArtistTerritory from '#models/artist_territory'
import Feature from '#models/feature'
import Release from '#models/release'
import User from '#models/user'

const password = 'TerritoryFixturePassword1!'

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
    if (result.response.status !== 302) throw new Error('Fixture login failed')
  }
}

test.group('Team artist affiliations', (group) => {
  group.setup(() => {
    if (
      !['127.0.0.1', 'localhost', '::1'].includes(env.get('DB_HOST')) ||
      !/(test|relaunch)/i.test(env.get('DB_DATABASE'))
    ) {
      throw new Error('Territory tests require isolated local PostgreSQL')
    }
  })

  test('denies non-editors, records evidence and publishes linked credits only', async ({
    assert,
    cleanup,
  }) => {
    const suffix = randomUUID().replaceAll('-', '')
    const user = await User.create({
      fullName: `Territory fixture ${suffix}`,
      username: `territory_${suffix}`,
      email: `territory-${suffix}@example.test`,
      password,
      authVersion: 0,
    })
    const main = await Artist.create({ name: `Main ${suffix}`, isVerified: false })
    const guest = await Artist.create({ name: `Guest ${suffix}`, isVerified: false })
    const release = await Release.create({
      title: `Affiliation ${suffix}`,
      description: '',
      date: DateTime.now(),
      type: 'single',
      cover: null,
      urls: [],
      artistId: main.id,
      isSecret: false,
      isAutomated: true,
      voteCount: 0,
    })
    const linkedFeature = await Feature.create({ releaseId: release.id, artistId: guest.id })
    const unlinkedFeature = await Feature.create({
      releaseId: release.id,
      artistId: null,
      artistName: 'Invité non lié',
      spotifyArtistId: null,
    })
    const previous = env.get('STAYCONNECT_EDITOR_USER_IDS') ?? ''
    cleanup(async () => {
      env.set('STAYCONNECT_EDITOR_USER_IDS', previous)
      await unlinkedFeature.delete()
      await linkedFeature.delete()
      await release.delete()
      await main.delete()
      await guest.delete()
      await user.delete()
    })

    const path = `/equipe/artistes/${main.id}/territoires`
    const publicSource = (code: string) => ({
      territoryCode: code,
      sourceKind: 'public_source',
      sourceReference: 'https://example.test/interview',
      sourceNote: 'L’artiste décrit son affiliation musicale dans cet entretien.',
    })
    const guestClient = new LocalSessionClient()
    await guestClient.request('/login')
    const guestPage = await guestClient.request(path)
    assert.oneOf(guestPage.response.status, [302, 303])
    const guestSave = await guestClient.request(path, 'PUT', {
      reviewConfirmed: true,
      territories: [publicSource('GP')],
    })
    assert.oneOf(guestSave.response.status, [302, 303])

    const editor = new LocalSessionClient()
    await editor.login(user)
    const deniedPage = await editor.request(path)
    assert.equal(deniedPage.response.status, 403)
    const deniedSave = await editor.request(path, 'PUT', {
      reviewConfirmed: true,
      territories: [publicSource('GP')],
    })
    assert.equal(deniedSave.response.status, 403)
    assert.equal(
      await ArtistTerritory.query()
        .where('artist_id', main.id)
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      0
    )

    env.set('STAYCONNECT_EDITOR_USER_IDS', user.id)
    const editorPage = await editor.request(path)
    assert.equal(editorPage.response.status, 200)
    assert.equal(editorPage.response.headers.get('cache-control'), 'no-store')

    const invalid = await editor.request(path, 'PUT', {
      reviewConfirmed: true,
      territories: [publicSource('GP'), publicSource('GP')],
    })
    assert.oneOf(invalid.response.status, [302, 303])
    assert.equal(
      await ArtistTerritory.query()
        .where('artist_id', main.id)
        .count('* as total')
        .then((rows) => Number(rows[0].$extras.total)),
      0
    )

    const savedMain = await editor.request(path, 'PUT', {
      reviewConfirmed: true,
      territories: [publicSource('GP')],
    })
    assert.oneOf(savedMain.response.status, [302, 303])
    const savedGuest = await editor.request(`/equipe/artistes/${guest.id}/territoires`, 'PUT', {
      reviewConfirmed: true,
      territories: [publicSource('MQ')],
    })
    assert.oneOf(savedGuest.response.status, [302, 303])
    const evidence = await ArtistTerritory.query().where('artist_id', main.id).firstOrFail()
    assert.equal(evidence.verifiedByUserId, user.id)
    assert.equal(evidence.sourceReference, 'https://example.test/interview')

    const show = await guestClient.request(`/sorties/${release.slug}`)
    assert.equal(show.response.status, 200)
    assert.include(JSON.stringify(show.body), '"territories":["GP","MQ"]')
    const home = await guestClient.request('/')
    assert.equal(home.response.status, 200)
    assert.include(JSON.stringify(home.body), '"territories":["GP","MQ"]')

    const removed = await editor.request(`/equipe/artistes/${guest.id}/territoires`, 'PUT', {
      reviewConfirmed: true,
      territories: [],
    })
    assert.oneOf(removed.response.status, [302, 303])
    assert.isNull(await ArtistTerritory.query().where('artist_id', guest.id).first())
    const updatedShow = await guestClient.request(`/sorties/${release.slug}`)
    assert.include(JSON.stringify(updatedShow.body), '"territories":["GP"]')
  })
})
