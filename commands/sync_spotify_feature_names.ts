import Release from '#models/release'
import SpotifyService from '#services/spotify_service'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class SyncSpotifyFeatureNames extends BaseCommand {
  public static commandName = 'spotify:sync-feature-names'
  public static description = 'Backfill featured artist display names from Spotify release credits'

  public static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @flags.string({
    description: 'Only process a single release by ID or slug',
  })
  declare release?: string

  @flags.number({
    description:
      'Delay (ms) between Spotify API calls when processing multiple releases (default 250)',
  })
  declare delay?: number

  private readonly spotifyService = new SpotifyService()

  public async run() {
    const releases = await this.resolveReleases()
    if (releases.length === 0) {
      this.logger.info('No Spotify releases to process.')
      return
    }

    const delayMs = this.delay ?? 250
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const [index, release] of releases.entries()) {
      try {
        const result = await this.spotifyService.syncFeaturedArtistsForRelease(release)
        created += result.created
        updated += result.updated
        skipped += result.skipped

        this.logger.info(
          `${release.title}: created=${result.created}, updated=${result.updated}, skipped=${result.skipped}`
        )
      } catch (error) {
        errors += 1
        this.logger.error(`Failed to sync ${release.title} (${release.id}): ${error.message}`)
      }

      if (delayMs > 0 && index < releases.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    this.logger.success(
      `Feature name sync complete. Releases=${releases.length}, created=${created}, updated=${updated}, skipped=${skipped}, errors=${errors}.`
    )

    if (errors > 0) {
      this.exitCode = 1
    }
  }

  private async resolveReleases(): Promise<Release[]> {
    const query = Release.query()
      .whereNotNull('spotify_id')
      .preload('artist')
      .orderBy('created_at', 'desc')

    if (!this.release) {
      return query
    }

    const release = await query
      .where((releaseQuery) => {
        releaseQuery.where('id', this.release!).orWhere('slug', this.release!)
      })
      .first()

    if (!release) {
      this.logger.error(`Release ${this.release} not found or has no Spotify ID.`)
      this.exitCode = 1
      return []
    }

    return [release]
  }
}
