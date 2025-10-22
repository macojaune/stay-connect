import { DateTime } from 'luxon'
import Release from '#models/release'
import type { ReleaseHighlight, WeeklyRecapEmailPayload } from '#contracts/email'
import env from '#start/env'
import ReleaseExcerptService from '#services/release_excerpt_service'

type WeeklyRecapDataset = {
  periodStart: DateTime
  periodEnd: DateTime
  totalNewReleases: number
  releases: ReleaseHighlight[]
}

const FALLBACK_COVER = 'https://cdn.stayconnect.fm/assets/img/music-default-cover.png'

type RecipientInfo = {
  email: string
  fullName?: string | null
  username?: string | null
}

/**
 * Aggregates data for the weekly recap email.
 * The dataset is computed once and reused for all recipients.
 */
export default class WeeklyRecapService {
  constructor(
    private readonly appBaseUrl: string = env.get('APP_URL'),
    private readonly excerptService: ReleaseExcerptService = new ReleaseExcerptService()
  ) { }

  /**
   * Prepare the recap dataset for the most recent 7-day window.
   */
  async buildDataset(reference: DateTime = DateTime.now()): Promise<WeeklyRecapDataset> {
    const previousWeekReference = reference.minus({ weeks: 1 })
    const periodStart = previousWeekReference.startOf('week')
    const periodEnd = previousWeekReference.endOf('week')

    const releaseExcerpt = await this.excerptService.generate({
      period: 'week',
      referenceDate: previousWeekReference,
      number: 5,
      sort: 'date_desc',
      includeLinks: true,
      linkBaseUrl: this.appBaseUrl,
    })

    let releases = releaseExcerpt.releases.map((release) => this.mapRelease(release))

    if (releases.length === 0) {
      releases = await this.fetchReleasesAddedWithin(periodStart, periodEnd, 5)
    }

    return {
      periodStart,
      periodEnd,
      totalNewReleases: await this.fetchReleaseCountForPeriod(periodStart, periodEnd),
      releases,
    }
  }

  /**
   * Build the email payload for a specific user using a pre-computed dataset.
   */
  buildPayload(user: RecipientInfo, dataset: WeeklyRecapDataset): WeeklyRecapEmailPayload {
    const recipientName = user.fullName || user.username || null

    return {
      user: {
        email: user.email,
        fullName: recipientName,
      },
      period: {
        startIso: dataset.periodStart.toISO(),
        endIso: dataset.periodEnd.toISO(),
        label: `${dataset.periodStart.toFormat('dd LLL')} → ${dataset.periodEnd.toFormat('dd LLL yyyy')}`,
      },
      summary: {
        totalNewReleases: dataset.totalNewReleases,
      },
      releases: dataset.releases,
    }
  }

  private async fetchReleasesAddedWithin(
    from: DateTime,
    to: DateTime,
    limit: number = 10
  ): Promise<ReleaseHighlight[]> {
    const releases = await Release.query()
      .where('is_secret', false)
      .where('created_at', '>=', from.toSQL())
      .where('created_at', '<=', to.toSQL())
      .orderBy('created_at', 'desc')
      .preload('artist')
      .preload('categories')
      .limit(limit)

    return releases.map((release) => this.mapRelease(release))
  }

  private async fetchReleaseCountForPeriod(from: DateTime, to: DateTime): Promise<number> {
    const response = await Release.query()
      .where('is_secret', false)
      .where('date', '>=', from.toISO())
      .where('date', '<=', to.toISO())
      .count('* as total')

    const total = response[0]?.$extras?.total
    return typeof total === 'number' ? total : Number(total ?? 0)
  }

  private mapRelease(release: Release): ReleaseHighlight {
    const urls = this.normalizeUrls(release.urls)

    return {
      id: release.id,
      title: release.title,
      slug: release.slug,
      artistName: release.artist?.name ?? null,
      type: this.formatReleaseType(release.type),
      releaseDate: release.date?.toISODate() ?? null,
      releaseDateLabel: release.date ? release.date.setLocale('fr').toFormat('dd LLL yyyy') : null,
      detailUrl: this.getReleaseUrl(release.slug),
      coverUrl: release.cover ?? FALLBACK_COVER,
      categories: release.categories?.map((category) => category.name) ?? [],
      primaryUrl: urls[0] ?? null,
    }
  }

  private normalizeUrls(value: Release['urls']): string[] {
    if (Array.isArray(value)) {
      return value
    }

    if (!value) {
      return []
    }

    try {
      return JSON.parse(String(value))
    } catch {
      return []
    }
  }

  private formatReleaseType(type: string | null): string | null {
    if (!type) {
      return null
    }

    const mapping: Record<string, string> = {
      single: 'Single',
      album: 'Album',
      event: 'Événement',
      ep: 'EP',
    }

    return mapping[type.toLowerCase()] ?? type
  }

  getReleaseUrl(slug: string): string {
    const base = this.appBaseUrl.replace(/\/$/, '')
    return `${base}/releases/${slug}`
  }
}
