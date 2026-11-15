import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

// Only fields consumed by StayConnect are retained. Types are inferred from the
// validators so external JSON cannot bypass the contract with a type assertion.
// https://developer.spotify.com/documentation/web-api/reference/get-an-artist
const imageSchema = vine.object({
  url: vine.string().url(),
  height: vine.number({ strict: true }).min(0).nullable(),
  width: vine.number({ strict: true }).min(0).nullable(),
})

const externalUrlsSchema = vine.record(vine.string().url())
const artistCreditSchema = vine.object({
  id: vine.string(),
  name: vine.string(),
})

const artistSchema = vine.object({
  ...artistCreditSchema.getProperties(),
  // Deprecated metadata may be absent; absence is not an empty classification.
  genres: vine.array(vine.string()).optional(),
  images: vine.array(imageSchema.clone()),
  // Removed from Development Mode responses in February 2026.
  // https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
  followers: vine
    .object({ total: vine.number({ strict: true }).withoutDecimals().min(0) })
    .nullable()
    .optional(),
  external_urls: externalUrlsSchema.clone(),
  popularity: vine.number({ strict: true }).min(0).max(100).optional(),
})

// Artist-album lists and a track's album do not contain the album's tracks.
// https://developer.spotify.com/documentation/web-api/reference/get-an-artists-albums
const albumSummarySchema = vine.object({
  id: vine.string(),
  name: vine.string(),
  release_date: vine.string(),
  release_date_precision: vine.enum(['day', 'month', 'year']),
  album_type: vine.enum(['album', 'single', 'compilation']),
  images: vine.array(imageSchema.clone()),
  artists: vine.array(artistCreditSchema.clone()),
  external_urls: externalUrlsSchema.clone(),
})

const trackSummarySchema = vine.object({
  id: vine.string(),
  name: vine.string(),
  duration_ms: vine.number({ strict: true }).min(0),
  preview_url: vine.string().url().nullable().optional(),
  track_number: vine.number({ strict: true }).withoutDecimals().min(1),
  artists: vine.array(artistCreditSchema.clone()),
  explicit: vine.boolean(),
  type: vine.literal('track'),
  external_urls: externalUrlsSchema.clone(),
})

export const spotifyArtistValidator = vine.compile(artistSchema.clone())
export const spotifyArtistsImportValidator = vine.compile(
  vine.object({ items: vine.array(artistSchema.clone()) })
)
export const spotifyArtistSearchValidator = vine.compile(
  vine.object({ artists: vine.object({ items: vine.array(artistSchema.clone()) }) })
)
export const spotifyArtistAlbumsValidator = vine.compile(
  vine.object({
    items: vine.array(albumSummarySchema.clone()),
    next: vine.string().url().nullable(),
  })
)
export const spotifyAlbumValidator = vine.compile(
  vine.object({
    ...albumSummarySchema.getProperties(),
    tracks: vine.object({ items: vine.array(trackSummarySchema.clone()) }),
  })
)
export const spotifyTrackValidator = vine.compile(
  vine.object({ ...trackSummarySchema.getProperties(), album: albumSummarySchema.clone() })
)
export const spotifyTokenValidator = vine.compile(
  vine.object({
    access_token: vine.string(),
    token_type: vine.string(),
    expires_in: vine.number({ strict: true }).min(1),
  })
)

export type SpotifyArtist = Infer<typeof spotifyArtistValidator>
export type SpotifyAlbumSummary = Infer<typeof albumSummarySchema>
export type SpotifyAlbum = Infer<typeof spotifyAlbumValidator>
export type SpotifyTrack = Infer<typeof spotifyTrackValidator>
export type SpotifyTokenResponse = Infer<typeof spotifyTokenValidator>
export type SpotifyAlbumGroup = SpotifyAlbumSummary['album_type'] | 'appears_on'

export type SpotifySearchResult = Pick<SpotifyArtist, 'id' | 'name' | 'genres' | 'images'> & {
  followers?: number
  socials: SpotifyArtist['external_urls']
  spotifyUrl: string
}

export interface CreateArtistOptions {
  description?: string
  socials?: Record<string, string>
  categories?: string[]
}
