import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import SpotifyService from '#services/spotify_service'
import Artist from '#models/artist'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

export default class SyncSpotifyArtists extends BaseCommand {
  static commandName = 'spotify:sync-artists'
  static description = 'Sync artist information from Spotify API'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @args.string({ description: 'Specific artist ID to sync (optional)' })
  declare artistId?: string

  @flags.boolean({ description: 'Force sync even if recently updated' })
  declare force: boolean

  @flags.number({ description: 'Batch size for processing artists', default: 10 })
  declare batchSize: number

  async run() {
    this.logger.info('Starting Spotify artist sync...')

    try {
      if (this.artistId) {
        await this.syncSingleArtist(this.artistId)
      } else {
        await this.syncAllArtists()
      }

      this.logger.info('Spotify artist sync completed successfully')
    } catch (error) {
      this.logger.error('Failed to sync Spotify artists: ' + error.message)
      this.exitCode = 1
    }
  }

  private async syncSingleArtist(artistId: string) {
    const artist = await Artist.find(artistId)

    if (!artist) {
      this.logger.error(`Artist with ID ${artistId} not found`)
      this.exitCode = 1
      return
    }

    if (!artist.spotifyId) {
      this.logger.warning(`Artist ${artist.name} does not have a Spotify ID`)
      return
    }

    this.logger.info(`Syncing artist: ${artist.name}`)
    const spotifyService = new SpotifyService()
    await spotifyService.updateArtistFromSpotify(artist)

    // Update last check timestamp
    artist.lastSpotifyCheck = DateTime.now()
    await artist.save()

    this.logger.info(`Successfully synced artist: ${artist.name}`)
  }

  private async syncAllArtists() {
    let query = Artist.query().whereNotNull('spotifyId')

    // If not forcing, only sync artists that haven't been checked in the last 24 hours
    if (!this.force) {
      const yesterday = DateTime.now().minus({ hours: 24 })
      query = query.where((builder) => {
        builder.whereNull('lastSpotifyCheck').orWhere('lastSpotifyCheck', '<', yesterday)
      })
    }

    const artists = await query

    if (artists.length === 0) {
      this.logger.info('No artists need syncing')
      return
    }

    this.logger.info(`Found ${artists.length} artists to sync`)

    let processed = 0
    let errors = 0

    // Process in batches to avoid overwhelming the API
    for (let i = 0; i < artists.length; i += this.batchSize) {
      const batch = artists.slice(i, i + this.batchSize)

      this.logger.info(
        `Processing batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(artists.length / this.batchSize)}`
      )

      for (const artist of batch) {
        try {
          this.logger.info(`Syncing artist: ${artist.name}`)
          const spotifyService = new SpotifyService()
          await spotifyService.updateArtistFromSpotify(artist)

          // Update last check timestamp
          artist.lastSpotifyCheck = DateTime.now()
          await artist.save()

          processed++

          // Rate limiting delay
          await new Promise((resolve) => setTimeout(resolve, 200))
        } catch (error) {
          this.logger.error(`Failed to sync artist ${artist.name}:  ${error.message}`)
          errors++
        }
      }

      // Longer delay between batches
      if (i + this.batchSize < artists.length) {
        this.logger.info('Waiting between batches...')
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    this.logger.info(`Sync completed. Processed: ${processed}, Errors: ${errors}`)
  }
}
