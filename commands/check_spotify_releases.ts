import SpotifyService from '#services/spotify_service'
import { args, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class CheckSpotifyReleases extends BaseCommand {
  static commandName = 'spotify:check-releases'
  static description = 'Check for new releases from artists with Spotify IDs'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @args.string({ description: 'Artist id to check releases for (optional)', required: false })
  declare artistId?: string

  async run() {
    this.logger.info('Starting Spotify release check...')

    try {
      const spotifyService = new SpotifyService()
      const stats = await spotifyService.checkForNewReleases(this.artistId)

      this.logger.info('Spotify release check completed successfully')
      this.logger.info(
        `Statistics: Processed ${stats.processed} artists, Found ${stats.newReleases} new releases, ${stats.errors} errors`
      )

      if (stats.errors > 0) {
        this.logger.warning(
          `${stats.errors} errors occurred during the check. See logs for details.`
        )
      }
    } catch (error) {
      this.logger.error('Failed to check Spotify releases: ' + error.message)
      this.exitCode = 1
    }
  }
}
