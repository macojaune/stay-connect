import Release from '#models/release'
import Category from '#models/category'
import { ReleaseValidator } from '../validators/release'

export default class ReleaseService {
  /**
   * Create a new release
   */
  async createRelease(data: any, artistId: string) {
    const validatedData = await ReleaseValidator.validate(data)
    const release = await Release.create({
      ...validatedData,
      artistId,
      voteCount: 0,
    })

    if (data.categories && Array.isArray(data.categories)) {
      await release.related('categories').attach(data.categories)
    }

    await release.load((loader) => {
      loader.load('categories').load('artist')
    })

    return release
  }

  /**
   * Update release details
   */
  async updateRelease(release: Release, data: any) {
    const validatedData = await ReleaseValidator.validate(data)
    await release.merge(validatedData).save()

    if (data.categories && Array.isArray(data.categories)) {
      await release.related('categories').sync(data.categories)
    }

    await release.load((loader) => {
      loader.load('categories').load('artist').load('votes')
    })

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
