import { Job } from '@rlanz/bull-queue'
import logger from '@adonisjs/core/services/logger'
import SpotifyService from '#services/spotify_service'

export interface SpotifyCheckReleasesPayload {
  artistId?: string
  nbDays?: number
}

export default class SpotifyCheckReleasesJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  /**
   * Fetch newly released tracks from Spotify and update the database.
   */
  async handle(payload: SpotifyCheckReleasesPayload = {}) {
    const spotifyService = new SpotifyService()
    const nbDays = payload.nbDays ?? 4

    logger.info(
      `[queue] Starting Spotify release check${payload.artistId ? ` for artist ${payload.artistId}` : ''}`
    )

    const stats = await spotifyService.checkForNewReleases(payload.artistId, nbDays)

    logger.info(
      `[queue] Spotify release check finished: processed=${stats.processed}, new=${stats.newReleases}, errors=${stats.errors}`
    )

    if (stats.errors > 0) {
      logger.warn(`[queue] Spotify release check encountered ${stats.errors} errors.`)
    }
  }

  /**
   * Called when the job exceeds its retry attempts.
   */
  async rescue(payload: SpotifyCheckReleasesPayload, error: Error) {
    logger.error(
      error,
      `[queue] Spotify release check failed permanently${payload.artistId ? ` for artist ${payload.artistId}` : ''}`
    )
  }
}
