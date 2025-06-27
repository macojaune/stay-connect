import Artist from '#models/artist'
import Category from '#models/category'
import { artistValidator } from '#validators/artist'
import logger from '@adonisjs/core/services/logger'

export default class ArtistService {
  /**
   * Create a new artist
   */
  async createArtist(data) {
    try {
      const validatedData = await artistValidator.validate(data)

      const artist = await Artist.create({
        ...validatedData,
      })

      if (data.categories && Array.isArray(data.categories)) {
        await artist.related('categories').attach(data.categories)
      }

      await artist.load('categories')
      return artist
    } catch (error) {
      logger.error(error, 'createArtist error from ArtistService')
    }
  }

  /**
   * Update artist details
   */
  async updateArtist(artist: Artist, data: any) {
    const validatedData = await artistValidator.validate(data)
    await artist.merge(validatedData).save()

    if (data.categories && Array.isArray(data.categories)) {
      await artist.related('categories').sync(data.categories)
    }

    await artist.load((loader) => {
      loader.load('categories').load('releases', (releaseQuery) => {
        releaseQuery.preload('categories').withCount('votes')
      })
    })

    return artist
  }

  /**
   * Delete an artist and cleanup related data
   */
  async deleteArtist(artist: Artist) {
    // Remove category associations
    await artist.related('categories').detach()

    // Delete releases and their associations
    const releases = await artist.related('releases').query()
    for (const release of releases) {
      await release.related('categories').detach()
      await release.related('votes').query().delete()
      await release.delete()
    }

    await artist.delete()
  }

  /**
   * Add categories to an artist
   */
  async addCategories(artist: Artist, categoryIds: string[]) {
    // Verify categories exist
    await Category.query().whereIn('id', categoryIds).firstOrFail()

    await artist.related('categories').attach(categoryIds)
    await artist.load('categories')
    return artist
  }

  /**
   * Remove categories from an artist
   */
  async removeCategories(artist: Artist, categoryIds: string[]) {
    await artist.related('categories').detach(categoryIds)
    await artist.load('categories')
    return artist
  }

  /**
   * Get artist profile with related data
   */
  async getArtistProfile(artist: Artist) {
    await artist.load((loader) => {
      loader
        .load('categories')
        .load('releases', (releaseQuery) => {
          releaseQuery.preload('categories').withCount('votes')
        })
        .load('user')
    })

    return artist
  }
}
