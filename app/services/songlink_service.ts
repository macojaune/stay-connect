import SonglinkCache from '#models/songlink_cache'
import Release from '#models/release'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'

type SonglinkPlatformEntry = {
  entityUniqueId?: string
  url?: string
  platform?: string
}

type SonglinkResponse = {
  linksByPlatform?: Record<string, SonglinkPlatformEntry>
  entitiesByUniqueId?: Record<string, unknown>
  entityUniqueId?: string
}

const SONG_LINK_API = 'https://api.song.link/v1-alpha.1/links'
const CACHE_TTL_HOURS = 24 * 7 // 1 week

type SyncOptions = {
  force?: boolean
}

type SyncResult = {
  fetched: boolean
  updated: boolean
}

export default class SonglinkService {
  /**
   * Fetches multiplatform links for a release and updates its URLs.
   * Errors are logged but do not bubble up to avoid breaking release flows.
   */
  public async syncReleaseLinks(release: Release, options: SyncOptions = {}): Promise<SyncResult> {
    const { force = false } = options
    try {
      const canonicalUrl = this.getCanonicalUrl(release)
      if (!canonicalUrl) {
        logger.debug('[songlink] No canonical URL for release %s, skipping.', release.id)
        return { fetched: false, updated: false }
      }

      const linksResult = await this.getLinksWithCache(canonicalUrl, release.type, force)
      if (!linksResult || linksResult.links.length === 0) {
        logger.debug('[songlink] No links returned for %s', canonicalUrl)
        return { fetched: linksResult?.fetchedFromNetwork ?? false, updated: false }
      }

      const { links, fetchedFromNetwork } = linksResult

      const existingLinks = this.normalizeUrlList(release.urls)
      const mergedLinks = Array.from(new Set([...existingLinks, ...links]))

      if (mergedLinks.length === existingLinks.length) {
        return { fetched: fetchedFromNetwork, updated: false }
      }

      await release.merge({ urls: mergedLinks }).save()
      logger.info('[songlink] Updated %d streaming links for release %s', mergedLinks.length, release.id)
      return { fetched: fetchedFromNetwork, updated: true }
    } catch (error) {
      logger.warn(
        '[songlink] Failed to synchronize links for release %s: %s',
        release.id,
        (error as Error).message
      )
      return { fetched: false, updated: false }
    }
  }

  public getCanonicalUrl(release: Release): string | null {
    const existingUrls = this.normalizeUrlList(release.urls)
    if (existingUrls.length > 0) {
      return existingUrls[0]
    }

    if (release.spotifyId) {
      const spotifyType = this.mapReleaseTypeToSpotify(release.type)
      return `https://open.spotify.com/${spotifyType}/${release.spotifyId}`
    }

    return null
  }

  private normalizeUrlList(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((url): url is string => typeof url === 'string' && url.length > 0)
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed.filter((url): url is string => typeof url === 'string' && url.length > 0)
        }
      } catch {
        if (value.length > 0) {
          return [value]
        }
      }
    }

    return []
  }

  private mapReleaseTypeToSpotify(releaseType?: string | null): string {
    switch ((releaseType ?? '').toLowerCase()) {
      case 'album':
      case 'lp':
      case 'ep':
        return 'album'
      case 'playlist':
        return 'playlist'
      case 'podcast':
      case 'episode':
        return 'episode'
      default:
        return 'track'
    }
  }

  private async getLinksWithCache(
    canonicalUrl: string,
    releaseType: string | null | undefined,
    force: boolean
  ): Promise<{ links: string[]; fetchedFromNetwork: boolean } | null> {
    const existingCache = await SonglinkCache.findBy('sourceUrl', canonicalUrl)
    if (!force && existingCache && existingCache.fetchedAt) {
      const staleBefore = DateTime.now().minus({ hours: CACHE_TTL_HOURS })
      if (existingCache.fetchedAt > staleBefore) {
        return {
          links: this.extractLinks(existingCache.payload),
          fetchedFromNetwork: false,
        }
      }
    }

    const freshLinks = await this.fetchFromSonglink(canonicalUrl, releaseType)
    if (!freshLinks) {
      return null
    }

    await SonglinkCache.updateOrCreate(
      { sourceUrl: canonicalUrl },
      {
        sourceUrl: canonicalUrl,
        payload: freshLinks.rawResponse,
        fetchedAt: DateTime.now(),
      }
    )

    return { links: freshLinks.links, fetchedFromNetwork: true }
  }

  private async fetchFromSonglink(
    canonicalUrl: string,
    releaseType?: string | null
  ): Promise<{ links: string[]; rawResponse: SonglinkResponse } | null> {
    const endpoint = new URL(SONG_LINK_API)
    endpoint.searchParams.set('url', canonicalUrl)
    endpoint.searchParams.set('userCountry', 'FR')

    const response = await fetch(endpoint.toString(), {
      headers: {
        'User-Agent': '#StayConnect/1.0 (+https://stayconnect)',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const text = await response.text()
      logger.warn('[songlink] API returned %s for %s: %s', response.status, canonicalUrl, text)
      return null
    }

    const data = (await response.json()) as SonglinkResponse
    const links = this.extractLinks(data)

    if (!links || links.length === 0) {
      // fallback: use spotify url if present and we have an ID
      if (canonicalUrl.includes('open.spotify.com')) {
        const segments = canonicalUrl.split('?')[0]?.split('/').filter(Boolean) ?? []
        const id = segments.pop()
        if (id) {
          const type = segments.pop() ?? this.mapReleaseTypeToSpotify(releaseType)
          return {
            links: [`https://open.spotify.com/${type}/${id}`],
            rawResponse: data,
          }
        }
      }
      return null
    }

    return { links, rawResponse: data }
  }

  private extractLinks(payload: SonglinkResponse | Record<string, unknown> | null): string[] {
    if (!payload) {
      return []
    }

    const casted = payload as SonglinkResponse
    const entries = casted.linksByPlatform
    if (!entries) {
      return []
    }

    const urls = Object.values(entries)
      .map((entry) => entry?.url)
      .filter((url): url is string => typeof url === 'string' && url.length > 0)

    return Array.from(new Set(urls))
  }
}
