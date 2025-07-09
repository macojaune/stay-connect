import type { HttpContext } from '@adonisjs/core/http'
import SpotifyService from '#services/spotify_service'
import logger from '@adonisjs/core/services/logger'

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
    try {
      const { query, limit = 10 } = request.qs()

      if (!query) {
        return response.badRequest({
          error: 'Query parameter is required',
          message: 'Please provide a search query',
        })
      }

      const results = await this.spotifyService.searchArtistsFormatted(
        query,
        Number.parseInt(limit)
      )

      return response.json({
        success: true,
        data: {
          query,
          results,
          count: results.length,
        },
      })
    } catch (error) {
      logger.error('Spotify artist search failed:', error.message)
      return response.internalServerError({
        error: 'Search failed',
        message: error.message,
      })
    }
  }

  /**
   * Create an artist from Spotify data
   * POST /api/spotify/artists/create
   */
  async create({ request, response, auth }: HttpContext) {
    try {
      const { spotifyId, description, categories, socials } = request.only([
        'spotifyId',
        'description',
        'categories',
        'socials',
      ])

      if (!spotifyId) {
        return response.badRequest({
          error: 'Spotify ID is required',
          message: 'Please provide a valid Spotify artist ID',
        })
      }

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
    } catch (error) {
      logger.error('Failed to create artist from Spotify:', error.message)
      return response.internalServerError({
        error: 'Artist creation failed',
        message: error.message,
      })
    }
  }

  /**
   * Search and create artist in one operation
   * POST /api/spotify/artists/search-and-create
   */
  async searchAndCreate({ request, response, auth }: HttpContext) {
    try {
      const {
        query,
        spotifyId,
        description,
        categories,
        socials,
        limit = 10,
      } = request.only(['query', 'spotifyId', 'description', 'categories', 'socials', 'limit'])

      if (!query) {
        return response.badRequest({
          error: 'Query parameter is required',
          message: 'Please provide a search query',
        })
      }

      const result = await this.spotifyService.searchAndCreate(query, spotifyId, {
        description,
        categories,
        socials,
        limit: Number.parseInt(limit),
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

      const responseData: any = {
        success: true,
        data: {
          query,
          searchResults: result.searchResults,
          searchCount: result.searchResults.length,
        },
      }

      if (result.createdArtist) {
        await result.createdArtist.load('categories')
        responseData.data.createdArtist = result.createdArtist
        responseData.message = 'Artist found and created successfully'
      } else {
        responseData.message = 'Search completed successfully'
      }

      return response.json(responseData)
    } catch (error) {
      logger.error('Search and create operation failed:', error.message)
      return response.internalServerError({
        error: 'Operation failed',
        message: error.message,
      })
    }
  }

  /**
   * Get artist details from Spotify by ID
   * GET /api/spotify/artists/:spotifyId/details
   */
  async getDetails({ params, response }: HttpContext) {
    try {
      const { spotifyId } = params

      if (!spotifyId) {
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
    } catch (error) {
      logger.error('Failed to get artist details:', error.message)
      return response.internalServerError({
        error: 'Failed to get artist details',
        message: error.message,
      })
    }
  }

  /**
   * Sync existing artist with Spotify data
   * POST /api/spotify/artists/:id/sync
   */
  async sync({ params, response }: HttpContext) {
    try {
      const { id } = params

      const artist = await this.spotifyService.syncExistingArtist(id)
      await artist.load('categories')

      return response.json({
        success: true,
        message: 'Artist synced successfully',
        data: {
          artist,
        },
      })
    } catch (error) {
      logger.error('Failed to sync artist:', error.message)
      return response.internalServerError({
        error: 'Sync failed',
        message: error.message,
      })
    }
  }

  /**
   * Check if an artist exists by Spotify ID
   * GET /api/spotify/artists/:spotifyId/exists
   */
  async checkExists({ params, response }: HttpContext) {
    try {
      const { spotifyId } = params

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
    } catch (error) {
      logger.error('Failed to check artist existence:', error.message)
      return response.internalServerError({
        error: 'Check failed',
        message: error.message,
      })
    }
  }
}
