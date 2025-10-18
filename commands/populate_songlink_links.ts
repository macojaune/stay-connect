import Release from '#models/release'
import SonglinkCache from '#models/songlink_cache'
import SonglinkService from '#services/songlink_service'
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class PopulateSonglinkLinks extends BaseCommand {
  public static commandName = 'songlink:populate'
  public static description = 'Fetch and cache multiplatform links for releases via Songlink'

  public static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @flags.string({
    description: 'Only process a single release by ID or slug',
  })
  declare release?: string

  @flags.boolean({
    description: 'Force refresh from Songlink even when cached',
    alias: 'f',
  })
  declare force?: boolean

  @flags.number({
    description: 'Delay (ms) between Songlink API calls when hitting the network (default 6500)',
  })
  declare delay?: number

  private readonly songlinkService = new SonglinkService()

  public async run() {
    const releases = await this.resolveReleases()
    if (releases.length === 0) {
      this.logger.info('No releases to process.')
      return
    }

    const delayMs = this.delay ?? 6500
    const force = Boolean(this.force)

    let processed = 0
    let updated = 0
    let fetchedFromNetwork = 0
    let skipped = 0

    for (const release of releases) {
      processed += 1

      const canonicalBefore = this.songlinkService.getCanonicalUrl(release)
      if (!canonicalBefore) {
        this.logger.debug(
          `Skipping ${release.id} (${release.title}) — no canonical URL could be determined.`
        )
        skipped += 1
        continue
      }

      const hadCache = await SonglinkCache.findBy('sourceUrl', canonicalBefore)

      const result = await this.songlinkService.syncReleaseLinks(release, { force })
      if (result.updated) {
        updated += 1
      }
      if (result.fetched) {
        fetchedFromNetwork += 1
      }

      this.logger.info(
        `Release ${release.title} — updated: ${result.updated ? 'yes' : 'no'}, source: ${
          result.fetched ? 'songlink API' : 'cache'
        }`
      )

      const shouldDelay =
        (force || !hadCache || result.fetched) && delayMs > 0 && processed < releases.length

      if (shouldDelay) {
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }

    this.logger.success(
      `Songlink sync complete. Processed ${processed}, updated ${updated}, network fetches ${fetchedFromNetwork}, skipped ${skipped}.`
    )
  }

  private async resolveReleases(): Promise<Release[]> {
    if (!this.release) {
      return Release.query().orderBy('created_at', 'desc')
    }

    const release = await Release.query()
      .where('id', this.release)
      .orWhere('slug', this.release)
      .first()

    if (!release) {
      this.logger.error(`Release ${this.release} not found.`)
      this.exitCode = 1
      return []
    }

    return [release]
  }
}
