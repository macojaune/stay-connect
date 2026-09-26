import { test } from '@japa/runner'
import { mock } from 'node:test'
import { DateTime } from 'luxon'
import Artist from '#models/artist'
import Release from '#models/release'
import User from '#models/user'
import ArtistService from '#services/artist_service'
import ReleaseService from '#services/release_service'
import UserService from '#services/user_service'
import { releaseValidator, type ReleaseInput } from '#validators/release'

test.group('Service updates preserve omitted fields', () => {
  test('artist updates keep existing links and profile values out of the persistence diff', async ({
    assert,
  }) => {
    const artist = new Artist()
    artist.fill({
      name: 'Original artist',
      isVerified: false,
      followers: { spotify: 24 },
      description: 'Original description',
      spotifyId: 'original-spotify-id',
      socials: { spotify: 'https://open.spotify.com/artist/original' },
      profilePicture: 'https://example.test/artist.jpg',
    })
    artist.$hydrateOriginals()
    artist.$isPersisted = true
    const save = mock.method(artist, 'save', async () => artist)
    const load = mock.method(artist, 'load', async () => artist)

    try {
      await new ArtistService().updateArtist(artist, {
        name: 'Updated artist',
        isVerified: false,
      })

      assert.deepEqual(artist.$dirty, { name: 'Updated artist' })
      assert.deepEqual(artist.socials, { spotify: 'https://open.spotify.com/artist/original' })
      assert.equal(artist.profilePicture, 'https://example.test/artist.jpg')
      assert.equal(artist.description, 'Original description')
      assert.equal(artist.spotifyId, 'original-spotify-id')
      assert.deepEqual(artist.followers, { spotify: 24 })
    } finally {
      save.mock.restore()
      load.mock.restore()
    }
  })

  test('release updates keep omitted links, artwork and description', async ({ assert }) => {
    const date = new Date('2026-09-26T12:00:00.000Z')
    const release = new Release()
    release.fill({
      title: 'Original release',
      date: DateTime.fromJSDate(date),
      type: 'single',
      description: 'Original description',
      cover: 'https://example.test/cover.jpg',
      urls: ['https://example.test/listen'],
    })
    release.$hydrateOriginals()
    release.$isPersisted = true
    const save = mock.method(release, 'save', async () => release)
    const load = mock.method(release, 'load', async () => release)
    // The uniqueness rule queries the database. Its validated output is supplied here
    // so this regression test exercises the service mapping and Lucid merge in isolation.
    const validated: ReleaseInput = { title: 'Updated release', releaseDate: date, type: 'single' }
    const validate = mock.method(releaseValidator, 'validate', async () => validated)

    try {
      await new ReleaseService().updateRelease(release, {
        title: 'Updated release',
        releaseDate: date.toISOString(),
        type: 'single',
      })

      assert.deepEqual(release.$dirty, { title: 'Updated release' })
      assert.deepEqual(release.urls, ['https://example.test/listen'])
      assert.equal(release.cover, 'https://example.test/cover.jpg')
      assert.equal(release.description, 'Original description')
    } finally {
      validate.mock.restore()
      save.mock.restore()
      load.mock.restore()
    }
  })

  test('a name-only user update preserves username and password', async ({ assert }) => {
    const user = new User()
    user.fill({
      id: 'b50bf42a-fb66-4a5d-afda-8e1a8c73135e',
      username: 'original_username',
      password: 'existing-password-hash',
      fullName: 'Original name',
    })
    user.$hydrateOriginals()
    user.$isPersisted = true
    const save = mock.method(user, 'save', async () => user)

    try {
      await new UserService().updateUser(user, { name: 'Updated name' })

      assert.deepEqual(user.$dirty, { fullName: 'Updated name' })
      assert.equal(user.username, 'original_username')
      assert.equal(user.password, 'existing-password-hash')
    } finally {
      save.mock.restore()
    }
  })
})
