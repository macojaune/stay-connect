import Artist from '#models/artist'
import Category from '#models/category'
import { artistValidator, type ArtistInput } from '#validators/artist'
import logger from '@adonisjs/core/services/logger'

export default class ArtistService {
  /**
   * Create a new artist
   */
  async createArtist(data: unknown) {
    try {
      const validatedData = await artistValidator.validate(data)

      const artist = await Artist.create(this.artistAttributes(validatedData))

      if (validatedData.categories) {
        await artist.related('categories').attach(validatedData.categories)
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
  async updateArtist(artist: Artist, data: unknown) {
    const validatedData = await artistValidator.validate(data)
    await artist.merge(this.artistAttributes(validatedData)).save()

    if (validatedData.categories) {
      await artist.related('categories').sync(validatedData.categories)
    }

    await artist.load((loader) => {
      loader.load('categories').load('releases', (releaseQuery) => {
        releaseQuery.preload('categories').withCount('votes')
      })
    })

    return artist
  }

  private artistAttributes(data: ArtistInput) {
    return {
      name: data.name,
      isVerified: data.isVerified,
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.spotifyId !== undefined ? { spotifyId: data.spotifyId } : {}),
      ...(data.socials !== undefined ? { socials: data.socials } : {}),
      ...(data.followers !== undefined ? { followers: data.followers } : {}),
      ...(data.profilePicture !== undefined ? { profilePicture: data.profilePicture } : {}),
    }
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
