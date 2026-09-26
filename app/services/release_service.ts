import Release from '#models/release'
import Category from '#models/category'
import SonglinkService from '#services/songlink_service'
import { releaseValidator, type ReleaseInput } from '#validators/release'
import { DateTime } from 'luxon'

function releaseAttributes(data: ReleaseInput) {
  const { streamingLinks } = data
  const urls = streamingLinks
    ? [
        streamingLinks.spotify,
        streamingLinks.appleMusic,
        streamingLinks.soundcloud,
        streamingLinks.youtube,
        streamingLinks.bandcamp,
        ...(streamingLinks.other?.map((link) => link.url) ?? []),
      ].filter((url): url is string => url !== undefined)
    : undefined

  return {
    title: data.title,
    date: DateTime.fromJSDate(data.releaseDate),
    type: data.type,
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.coverArt !== undefined ? { cover: data.coverArt } : {}),
    ...(urls !== undefined ? { urls } : {}),
  }
}

export default class ReleaseService {
  private songlinkService = new SonglinkService()

  /**
   * Create a new release
   */
  async createRelease(data: unknown, artistId: string) {
    const validatedData = await releaseValidator.validate(data, { meta: { artistId } })
    const attributes = releaseAttributes(validatedData)
    const release = await Release.create({
      ...attributes,
      description: attributes.description ?? '',
      urls: attributes.urls ?? [],
      artistId,
      voteCount: 0,
    })

    if (validatedData.categories) {
      await release.related('categories').attach(validatedData.categories)
    }

    await release.load((loader) => {
      loader.load('categories').load('artist')
    })

    await this.songlinkService.syncReleaseLinks(release)

    return release
  }

  /**
   * Update release details
   */
  async updateRelease(release: Release, data: unknown) {
    const validatedData = await releaseValidator.validate(data, {
      meta: { artistId: release.artistId, releaseId: release.id },
    })
    await release.merge(releaseAttributes(validatedData)).save()

    if (validatedData.categories) {
      await release.related('categories').sync(validatedData.categories)
    }

    await release.load((loader) => {
      loader.load('categories').load('artist').load('votes')
    })

    if (validatedData.streamingLinks) {
      await this.songlinkService.syncReleaseLinks(release)
    }

    return release
  }

  /**
   * Delete a release and cleanup related data
   */
  async deleteRelease(release: Release) {
    // Remove category associations
    await release.related('categories').detach()

    // Delete votes
    await release.related('votes').query().delete()

    // Delete the release
    await release.delete()
  }

  /**
   * Add categories to a release
   */
  async addCategories(release: Release, categoryIds: string[]) {
    // Verify categories exist
    await Category.query().whereIn('id', categoryIds).firstOrFail()

    await release.related('categories').attach(categoryIds)
    await release.load('categories')
    return release
  }

  /**
   * Remove categories from a release
   */
  async removeCategories(release: Release, categoryIds: string[]) {
    await release.related('categories').detach(categoryIds)
    await release.load('categories')
    return release
  }

  /**
   * Get release details with related data
   */
  async getReleaseDetails(release: Release) {
    await release.load((loader) => {
      loader
        .load('categories')
        .load('artist', (artistQuery) => {
          artistQuery.preload('categories')
        })
        .load('votes', (voteQuery) => {
          voteQuery.preload('user')
        })
    })

    return release
  }

  /**
   * Get trending releases based on vote count
   */
  async getTrendingReleases(limit: number = 10) {
    const releases = await Release.query()
      .orderBy('voteCount', 'desc')
      .limit(limit)
      .preload('artist')
      .preload('categories')

    return releases
  }
}
