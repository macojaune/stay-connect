import { errorDetails } from '#exceptions/error_details'
import type { HttpContext } from '@adonisjs/core/http'
import SpotifyService from '#services/spotify_service'
import logger from '@adonisjs/core/services/logger'
import vine from '@vinejs/vine'

const searchValidator = vine.compile(
  vine.object({
    query: vine.string().trim().minLength(1),
    limit: vine.number().withoutDecimals().min(1).optional(),
  })
)

const createOptions = {
  description: vine.string().optional(),
  categories: vine.array(vine.string()).optional(),
  socials: vine.record(vine.string().url()).optional(),
}
const createValidator = vine.compile(vine.object({ spotifyId: vine.string(), ...createOptions }))
const searchAndCreateValidator = vine.compile(
  vine.object({
    query: vine.string().trim().minLength(1),
    spotifyId: vine.string().optional(),
    description: createOptions.description.clone(),
    categories: createOptions.categories.clone(),
    socials: createOptions.socials.clone(),
    limit: vine.number().withoutDecimals().min(1).optional(),
  })
)

export default class SpotifyArtistsController {
  private spotifyService: SpotifyService

  constructor() {
    this.spotifyService = new SpotifyService()
  }

  /**
   * Search for artists on Spotify
   * GET /api/spotify/artists/search
   */
  async search({ request, response }: HttpContext) {
    const { query, limit = 10 } = await request.validateUsing(searchValidator)

    try {
      const results = await this.spotifyService.searchArtistsFormatted(query, limit)

      return response.json({
        success: true,
        data: {
          query,
          results,
          count: results.length,
        },
      })
    } catch (error: unknown) {
      logger.error('Spotify artist search failed:', errorDetails(error).message)
      return response.internalServerError({
        error: 'Search failed',
        message: errorDetails(error).message,
      })
    }
  }

  /**
   * Create an artist from Spotify data
   * POST /api/spotify/artists/create
   */
  async create({ request, response }: HttpContext) {
    const { spotifyId, description, categories, socials } =
      await request.validateUsing(createValidator)

    try {
      // Check if artist already exists
      const existingArtist = await this.spotifyService.findExistingArtistBySpotifyId(spotifyId)
      if (existingArtist) {
        return response.conflict({
          error: 'Artist already exists',
          message: `Artist already exists in database: ${existingArtist.name}`,
          data: {
            existingArtist: {
              id: existingArtist.id,
              name: existingArtist.name,
              spotifyId: existingArtist.spotifyId,
            },
          },
        })
      }

      // Get artist details from Spotify
      const spotifyArtist = await this.spotifyService.getArtistDetails(spotifyId)

      // Create the artist
      const artist = await this.spotifyService.createArtistFromSpotify(spotifyArtist, {
        description,
        categories,
        socials,
      })

      // Load related data
      await artist.load('categories')

      return response.created({
        success: true,
        message: 'Artist created successfully',
        data: {
          artist,
        },
      })
    } catch (error: unknown) {
      logger.error('Failed to create artist from Spotify:', errorDetails(error).message)
      return response.internalServerError({
        error: 'Artist creation failed',
        message: errorDetails(error).message,
      })
    }
  }

  /**
   * Search and create artist in one operation
   * POST /api/spotify/artists/search-and-create
   */
  async searchAndCreate({ request, response }: HttpContext) {
    const {
      query,
      spotifyId,
      description,
      categories,
      socials,
      limit = 10,
    } = await request.validateUsing(searchAndCreateValidator)

    try {
      const result = await this.spotifyService.searchAndCreate(query, spotifyId, {
        description,
        categories,
        socials,
        limit,
      })

      if (result.error) {
        return response.badRequest({
          error: 'Operation failed',
          message: result.error,
          data: {
            searchResults: result.searchResults,
          },
        })
      }

      if (result.createdArtist) {
        await result.createdArtist.load('categories')
      }

      return response.json({
        success: true,
        message: result.createdArtist
          ? 'Artist found and created successfully'
          : 'Search completed successfully',
        data: {
          query,
          searchResults: result.searchResults,
          searchCount: result.searchResults.length,
          ...(result.createdArtist ? { createdArtist: result.createdArtist } : {}),
        },
      })
    } catch (error: unknown) {
      logger.error('Search and create operation failed:', errorDetails(error).message)
      return response.internalServerError({
        error: 'Operation failed',
        message: errorDetails(error).message,
      })
    }
  }

  /**
   * Get artist details from Spotify by ID
   * GET /api/spotify/artists/:spotifyId/details
   */
  async getDetails({ params, response }: HttpContext) {
    try {
      const spotifyId: unknown = params.spotifyId

      if (typeof spotifyId !== 'string' || !spotifyId) {
        return response.badRequest({
          error: 'Spotify ID is required',
          message: 'Please provide a valid Spotify artist ID',
        })
      }

      const artistDetails = await this.spotifyService.getArtistDetails(spotifyId)

      // Check if artist exists in our database
      const existingArtist = await this.spotifyService.findExistingArtistBySpotifyId(spotifyId)

      return response.json({
        success: true,
        data: {
          spotifyDetails: artistDetails,
          existsInDatabase: !!existingArtist,
          databaseArtist: existingArtist
            ? {
                id: existingArtist.id,
                name: existingArtist.name,
                description: existingArtist.description,
                profilePicture: existingArtist.profilePicture,
                isVerified: existingArtist.isVerified,
                createdAt: existingArtist.createdAt,
              }
            : null,
        },
      })
    } catch (error: unknown) {
      logger.error('Failed to get artist details:', errorDetails(error).message)
      return response.internalServerError({
        error: 'Failed to get artist details',
        message: errorDetails(error).message,
      })
    }
  }

  /**
   * Sync existing artist with Spotify data
   * POST /api/spotify/artists/:id/sync
   */
  async sync({ params, response }: HttpContext) {
    try {
      const id: unknown = params.id
      if (typeof id !== 'string' || !id) {
        return response.badRequest({ error: 'Artist ID is required' })
      }

      const artist = await this.spotifyService.syncExistingArtist(id)
      await artist.load('categories')

      return response.json({
        success: true,
        message: 'Artist synced successfully',
        data: {
          artist,
        },
      })
    } catch (error: unknown) {
      logger.error('Failed to sync artist:', errorDetails(error).message)
      return response.internalServerError({
        error: 'Sync failed',
        message: errorDetails(error).message,
      })
    }
  }

  /**
   * Check if an artist exists by Spotify ID
   * GET /api/spotify/artists/:spotifyId/exists
   */
  async checkExists({ params, response }: HttpContext) {
    try {
      const spotifyId: unknown = params.spotifyId
      if (typeof spotifyId !== 'string' || !spotifyId) {
        return response.badRequest({ error: 'Spotify ID is required' })
      }

      const existingArtist = await this.spotifyService.findExistingArtistBySpotifyId(spotifyId)

      return response.json({
        success: true,
        data: {
          exists: !!existingArtist,
          artist: existingArtist
            ? {
                id: existingArtist.id,
                name: existingArtist.name,
                description: existingArtist.description,
                profilePicture: existingArtist.profilePicture,
                isVerified: existingArtist.isVerified,
                spotifyId: existingArtist.spotifyId,
                createdAt: existingArtist.createdAt,
              }
            : null,
        },
      })
    } catch (error: unknown) {
      logger.error('Failed to check artist existence:', errorDetails(error).message)
      return response.internalServerError({
        error: 'Check failed',
        message: errorDetails(error).message,
      })
    }
  }
}
