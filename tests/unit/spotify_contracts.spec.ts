import { test } from '@japa/runner'
import {
  spotifyAlbumValidator,
  spotifyArtistAlbumsValidator,
  spotifyArtistSearchValidator,
  spotifyArtistValidator,
  spotifyArtistsImportValidator,
  spotifyTokenValidator,
  spotifyTrackValidator,
} from '#contracts/spotify'
import type { SpotifyArtist } from '#contracts/spotify'
import Artist from '#models/artist'
import SpotifyService from '#services/spotify_service'

// Fictional API payloads. These tests do not call Spotify or write to a database.
const artist = {
  id: 'artist-fixture',
  name: 'Fixture artist',
  genres: ['zouk'],
  images: [{ url: 'https://example.test/artist.jpg', height: null, width: null }],
  followers: { total: 12 },
  external_urls: { spotify: 'https://open.spotify.com/artist/fixture' },
}
const album = {
  id: 'album-fixture',
  name: 'Fixture album',
  release_date: '2026-09-26',
  album_type: 'single',
  images: [],
  artists: [{ id: artist.id, name: artist.name }],
  external_urls: { spotify: 'https://open.spotify.com/album/fixture' },
}
const track = {
  id: 'track-fixture',
  name: 'Fixture track',
  duration_ms: 180000,
  preview_url: null,
  track_number: 1,
  artists: album.artists,
  explicit: false,
  type: 'track',
  external_urls: { spotify: 'https://open.spotify.com/track/fixture' },
}

// Only persistence and the external fetch are replaced. The service's actual
// merge path runs against a Lucid model, without accessing either dependency.
class InMemoryArtist extends Artist {
  saveCount = 0

  override async save() {
    this.saveCount++
    return this
  }
}

class FixtureSpotifyService extends SpotifyService {
  constructor(private readonly fixture: SpotifyArtist) {
    super()
  }

  override async getArtist() {
    return this.fixture
  }

  override async searchArtists() {
    return { artists: { items: [this.fixture] } }
  }
}

test.group('Spotify JSON contracts', () => {
  test('accepts unknown image dimensions without inventing zero values', async ({ assert }) => {
    const result = await spotifyArtistsImportValidator.validate({ items: [artist] })

    assert.deepEqual(result.items[0].images[0], artist.images[0])
    assert.equal(result.items[0].followers?.total, 12)
  })

  test('accepts development-mode artists without removed or deprecated metadata', async ({
    assert,
  }) => {
    const developmentArtist = {
      id: artist.id,
      name: artist.name,
      images: artist.images,
      external_urls: artist.external_urls,
    }
    const fixture = await spotifyArtistValidator.validate(developmentArtist)
    const search = await spotifyArtistSearchValidator.validate({
      artists: { items: [developmentArtist] },
    })
    const imported = await spotifyArtistsImportValidator.validate({ items: [developmentArtist] })
    assert.isUndefined(fixture.followers)
    assert.isUndefined(fixture.popularity)
    assert.isUndefined(fixture.genres)
    assert.isUndefined(search.artists.items[0].followers)
    assert.isUndefined(imported.items[0].followers)

    const service = new FixtureSpotifyService(fixture)
    const details = await service.getArtistDetails(artist.id)
    const results = await service.searchArtistsFormatted(artist.name)
    assert.isUndefined(details.followers)
    assert.isUndefined(details.genres)
    assert.isUndefined(results[0].followers)
    assert.isUndefined(results[0].genres)
  })

  test('preserves historical followers and their timestamp when Spotify omits them', async ({
    assert,
  }) => {
    for (const followers of [undefined, null]) {
      const fixture = await spotifyArtistValidator.validate({ ...artist, followers })
      const model = new InMemoryArtist()
      const historicalFollowers = {
        spotify: 42,
        lastUpdated: '2025-12-01T12:00:00.000Z',
        instagram: 7,
      }
      model.merge({
        name: artist.name,
        spotifyId: artist.id,
        followers: historicalFollowers,
        profilePicture: null,
      })

      await new FixtureSpotifyService(fixture).updateArtistFromSpotify(model)

      assert.strictEqual(model.followers, historicalFollowers)
      assert.equal(model.profilePicture, artist.images[0].url)
      assert.equal(model.saveCount, 1)
    }
  })

  test('updates a known zero follower count while retaining other network metadata', async ({
    assert,
  }) => {
    const fixture = await spotifyArtistValidator.validate({ ...artist, followers: { total: 0 } })
    const model = new InMemoryArtist()
    model.merge({
      name: artist.name,
      spotifyId: artist.id,
      followers: {
        spotify: 42,
        lastUpdated: '2025-12-01T12:00:00.000Z',
        instagram: { total: 7 },
      },
    })

    await new FixtureSpotifyService(fixture).updateArtistFromSpotify(model)

    assert.equal(model.followers?.spotify, 0)
    assert.deepEqual(model.followers?.instagram, { total: 7 })
    assert.notEqual(model.followers?.lastUpdated, '2025-12-01T12:00:00.000Z')
  })

  test('rejects a malformed imported artist before processing the batch', async ({ assert }) => {
    const invalidArtists: unknown[] = [
      { ...artist, id: 123 },
      { ...artist, genres: [42] },
      { ...artist, followers: { total: '12' } },
      { ...artist, followers: { total: -1 } },
      { ...artist, images: [{ url: 'not-a-url', height: 320, width: 320 }] },
    ]

    for (const invalidArtist of invalidArtists) {
      const [error, result] = await spotifyArtistsImportValidator.tryValidate({
        items: [artist, invalidArtist],
      })
      assert.isNotNull(error)
      assert.isNull(result)
    }
  })

  test('accepts album summaries without tracks but requires tracks on album detail', async ({
    assert,
  }) => {
    const result = await spotifyArtistAlbumsValidator.validate({ items: [album] })
    assert.equal(result.items[0].id, album.id)

    const [error] = await spotifyAlbumValidator.tryValidate(album)
    assert.isNotNull(error)

    const detail = await spotifyAlbumValidator.validate({ ...album, tracks: { items: [track] } })
    assert.isNull(detail.tracks.items[0].preview_url)
  })

  test('distinguishes track details from an album and accepts absent previews', async ({
    assert,
  }) => {
    const result = await spotifyTrackValidator.validate({
      ...track,
      preview_url: undefined,
      album,
    })
    assert.equal(result.album.id, album.id)
    assert.isUndefined(result.preview_url)

    const [error] = await spotifyTrackValidator.tryValidate(album)
    assert.isNotNull(error)
  })

  test('rejects invalid token expiration rather than caching unusable credentials', async ({
    assert,
  }) => {
    for (const expiresIn of [undefined, '3600', 0, -1]) {
      const [error] = await spotifyTokenValidator.tryValidate({
        access_token: 'fixture-token',
        token_type: 'Bearer',
        expires_in: expiresIn,
      })
      assert.isNotNull(error)
    }
  })
})
