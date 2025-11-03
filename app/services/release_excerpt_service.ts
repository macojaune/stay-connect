import Release from '#models/release'
import { DateTime } from 'luxon'

export type ExcerptPeriod = 'day' | 'week'
export type ExcerptSort = 'random' | 'date_desc'

export interface ReleaseExcerptOptions {
  period?: ExcerptPeriod
  referenceDate?: DateTime
  number?: number
  sort?: ExcerptSort
  includeLinks?: boolean
  linkBaseUrl?: string
}

export interface ReleaseExcerptResult {
  html: string
  releases: Release[]
}

/**
 * Generates HTML excerpts showcasing a list of releases.
 * Extracted from the generate_release_list command so it can be reused
 * by other features (weekly recap emails, admin previews, etc.).
 */
export default class ReleaseExcerptService {
  async generate(options: ReleaseExcerptOptions = {}): Promise<ReleaseExcerptResult> {
    const {
      period = 'week',
      referenceDate = DateTime.now(),
      number = 3,
      sort = 'random',
      includeLinks = false,
      linkBaseUrl,
    } = options

    const { from, to } = this.resolvePeriod(period, referenceDate)

    const releasesQuery = Release.query()
      .where('is_secret', false)
      .whereBetween('date', [from.toJSDate(), to.toJSDate()])
      .preload('artist')
      .preload('categories')
      .limit(number)

    if (sort === 'random') {
      releasesQuery.orderByRaw('RANDOM()')
    } else {
      releasesQuery.orderBy('date', 'desc')
    }

    const releases = await releasesQuery

    const html = releases.length
      ? this.htmlBlock(releases, includeLinks, linkBaseUrl)
      : this.htmlEmptyBlock()

    return {
      html,
      releases,
    }
  }

  private resolvePeriod(period: ExcerptPeriod, reference: DateTime) {
    if (period === 'day') {
      return {
        from: reference.startOf('day'),
        to: reference.endOf('day'),
      }
    }

    return {
      from: reference.startOf('week'),
      to: reference.endOf('week'),
    }
  }

  /**
   * Bloc HTML principal (liste de cartes release)
   */
  private htmlBlock(releases: Release[], includeLinks: boolean, linkBaseUrl?: string): string {
    return `
<div style="max-width:630px;margin:auto;font-family:system-ui,sans-serif;">
  <h2 style="font-size:1.25em;color:#da2a63;text-align:center;font-weight:700;margin-bottom:24px;margin-top:0;">
    ${releases.length > 1 ? 'Sorties à ne pas rater :' : 'Sortie à ne pas rater'}
  </h2>
  <div style="display:flex;flex-direction:column;gap:18px;">
    ${releases.map((release) => this.htmlCard(release, includeLinks, linkBaseUrl)).join('')}
  </div>
</div>
`.trim()
  }

  /**
   * Carte HTML pour une sortie unique
   */
  private htmlCard(release: Release, includeLinks: boolean, linkBaseUrl?: string): string {
    const artist = release.artist?.name || 'Artiste inconnu'
    const cover =
      release.cover || 'https://cdn.stayconnect.fm/assets/img/music-default-cover.png'
    const type =
      release.type === 'single'
        ? 'Single'
        : release.type === 'album'
          ? 'Album'
          : release.type === 'event'
            ? 'Évent'
            : 'Autre'
    const date =
      typeof release.date?.toFormat === 'function' ? release.date.toFormat('dd/MM/yyyy') : ''
    const categories = (release.categories || [])
      .map((category) => category.name)
      .filter(Boolean)
      .join(', ')

    const baseUrl = linkBaseUrl ? linkBaseUrl.replace(/\/$/, '') : undefined
    const detailUrl = baseUrl ? `${baseUrl}/sorties/${release.slug}` : undefined

    const titleContent = detailUrl
      ? `<a href="${detailUrl}" style="color:inherit;text-decoration:none;">${artist} <span style="font-weight:normal;color:#aaa;">–</span> ${release.title}</a>`
      : `${artist} <span style="font-weight:normal;color:#aaa;">–</span> ${release.title}`

    const coverContent = detailUrl
      ? `<a href="${detailUrl}" style="display:block;width:100%;height:100%;"><img src="${cover}" alt="${release.title}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"/></a>`
      : `<img src="${cover}" alt="${release.title}" style="width:100%;height:100%;object-fit:cover;"/>`

    return `
  <div style="background:#fff;border:1px solid #eee;border-radius:11px;padding:16px;display:flex;gap:15px;align-items:center;box-shadow:0 2px 12px #0001;">
    <div style="min-width:58px;width:58px;height:58px;border-radius:8px;overflow:hidden;box-shadow:0 1px 7px #0001;background:#f5f5f5;">
      ${coverContent}
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:1.09em;font-weight:bold;color:#23222d;line-height:1.2;margin-bottom:6px;">
        ${titleContent}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        <span style="background:#ffeaf1;color:#da2a63;font-size:.90em;padding:.15em .75em;border-radius:99px;">${type}</span>
        ${categories
        ? `<span style="background:#f3eafc;color:#8120a3;font-size:.87em;padding:.13em .7em;border-radius:99px;">${categories}</span>`
        : ''
      }
      </div>
      <div style="margin-top:5px;font-size:.89em;color:#8F8A98;">
        Sortie le ${date}
      </div>
      ${includeLinks && detailUrl
        ? `<div style="margin-top:12px;"><a href="${detailUrl}" style="display:inline-block;background:#da2a63;color:#fff;font-size:.88em;font-weight:600;padding:.45em 1.25em;border-radius:999px;text-decoration:none;">Écouter</a></div>`
        : ''
      }
    </div>
  </div>
    `.trim()
  }

  /**
   * Bloc si aucune sortie trouvée
   */
  private htmlEmptyBlock(): string {
    return `
<div style="max-width:630px;margin:auto;text-align:center;font-family:system-ui,sans-serif;">
  <h2 style="font-size:1.10em;color:#da2a63;font-weight:700;margin-bottom:8px;">Aucune nouveauté cette période 🎧</h2>
  <div style="color:#8f8a98;">Sois le premier ou la première à soumettre une sortie sur stayconnect.fm !</div>
</div>
    `.trim()
  }
}
