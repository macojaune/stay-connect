import { Job } from '@rlanz/bull-queue'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import Artist from '#models/artist'
import SpotifyService from '#services/spotify_service'

export interface SpotifySyncArtistsPayload {
  artistId?: string
  force?: boolean
  batchSize?: number
}

export default class SpotifySyncArtistsJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async handle(payload: SpotifySyncArtistsPayload = {}) {
    const force = payload.force ?? false
    const batchSize = payload.batchSize ?? 10

    logger.info(
      `[queue] Starting Spotify artist sync${payload.artistId ? ` for artist ${payload.artistId}` : ''} (force=${force}, batchSize=${batchSize})`
    )

    if (payload.artistId) {
      await this.syncSingleArtist(payload.artistId)
    } else {
      await this.syncAllArtists({ force, batchSize })
    }

    logger.info('[queue] Spotify artist sync finished successfully')
  }

  async rescue(payload: SpotifySyncArtistsPayload, error: Error) {
    logger.error(
      error,
      `[queue] Spotify artist sync failed permanently${payload.artistId ? ` for artist ${payload.artistId}` : ''}`
    )
  }

  private async syncSingleArtist(artistId: string) {
    const artist = await Artist.find(artistId)
    if (!artist) {
      logger.error(`[queue] Artist with ID ${artistId} not found`)
      return
    }

    if (!artist.spotifyId) {
      logger.warn(`[queue] Artist ${artist.name} does not have a Spotify ID`)
      return
    }

    logger.info(`[queue] Syncing artist ${artist.name} (${artist.id})`)

    const spotifyService = new SpotifyService()
    await spotifyService.updateArtistFromSpotify(artist)

    artist.lastSpotifyCheck = DateTime.now()
    await artist.save()
  }

  private async syncAllArtists({
    force,
    batchSize,
  }: {
    force: boolean
    batchSize: number
  }) {
    let query = Artist.query().whereNotNull('spotifyId')

    if (!force) {
      const yesterday = DateTime.now().minus({ hours: 24 })
      query = query.where((builder) => {
        builder.whereNull('lastSpotifyCheck').orWhere('lastSpotifyCheck', '<', yesterday.toSQL())
      })
    }

    const artists = await query

    if (artists.length === 0) {
      logger.info('[queue] No artists require syncing')
      return
    }

    logger.info(`[queue] Found ${artists.length} artists to sync`)

    const spotifyService = new SpotifyService()
    let processed = 0
    let errors = 0

    for (let i = 0; i < artists.length; i += batchSize) {
      const batch = artists.slice(i, i + batchSize)
      logger.info(
        `[queue] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(artists.length / batchSize)}`
      )

      for (const artist of batch) {
        try {
          logger.info(`[queue] Syncing artist ${artist.name} (${artist.id})`)
          await spotifyService.updateArtistFromSpotify(artist)

          artist.lastSpotifyCheck = DateTime.now()
          await artist.save()
          processed++

          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (error) {
          errors++
          logger.error(
            error,
            `[queue] Failed to sync artist ${artist.name} (${artist.id}).`
          )
        }
      }

      if (i + batchSize < artists.length) {
        logger.info('[queue] Waiting between batches...')
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    logger.info(
      `[queue] Spotify artist sync stats: processed=${processed}, errors=${errors}`
    )
  }
}
