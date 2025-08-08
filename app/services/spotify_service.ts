import env from '#start/env'
import { DateTime } from 'luxon'
import Artist from '#models/artist'
import Release from '#models/release'
import logger from '@adonisjs/core/services/logger'
import ky from 'ky'
import Feature from '#models/feature'
import ArtistService from '#services/artist_service'
import type {
  CreateArtistOptions,
  SearchAndCreateResult,
  SpotifyAlbum,
  SpotifyArtist,
  SpotifySearchResult,
  SpotifyTokenResponse,
} from '@/types/index.js'

export default class SpotifyService {
  private accessToken: string | null = null
  private tokenExpiresAt: DateTime | null = null
  private readonly BASE_URL = 'https://api.spotify.com/v1'
  private readonly AUTH_URL = 'https://accounts.spotify.com/api/token'
  private api: typeof ky
  private artistService: ArtistService

  constructor() {
    this.artistService = new ArtistService()
    this.api = ky.create({
      retry: {
        limit: 3,
        methods: ['get', 'post'],
        statusCodes: [429, 408, 413, 429, 500, 502, 503, 504],
        delay: (attemptCount) => {
          // For rate limiting (429), use exponential backoff starting at 1 second
          return Math.min(1000 * Math.pow(2, attemptCount - 1), 30000)
        },
      },
      hooks: {
        beforeRetry: [
          async ({ request, options, error, retryCount }) => {
            const response = error.response
            if (response?.status === 429) {
              const retryAfter = response.headers.get('Retry-After')
              const delay = retryAfter ? Number.parseInt(retryAfter) * 1000 : 1000
              logger.warn(`Rate limited. Waiting ${delay}ms before retry ${retryCount + 1}`)
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          },
        ],
      },
    })
  }

  /**
   * Get access token for Spotify API
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > DateTime.now()) {
      return this.accessToken
    }
    try {
      const clientId = env.get('SPOTIFY_CLIENT_ID')
      const clientSecret = env.get('SPOTIFY_CLIENT_SECRET')

      if (!clientId || !clientSecret) {
        throw new Error('Spotify credentials not configured')
      }

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

      const data = await this.api
        .post(this.AUTH_URL, {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=client_credentials',
        })
        .json<SpotifyTokenResponse>()

      this.accessToken = data.access_token
      this.tokenExpiresAt = DateTime.now().plus({ seconds: data.expires_in - 60 }) // Refresh 1 minute early

      return this.accessToken
    } catch (error) {
      logger.error('Failed to get Spotify access token: ' + error.message)
      throw error
    }
  }

  /**
   * Make authenticated request to Spotify API
   */
  private async makeRequest<T>(endpoint: string): Promise<T> {
    const token = await this.getAccessToken()

    try {
      return await this.api
        .get(`${this.BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        .json<T>()
    } catch (error: any) {
      throw new Error(`Spotify API error: ${error.response?.status || 'Unknown'} ${error.message}`)
    }
  }

  /**
   * Get artist information from Spotify
   */
  async getArtist(spotifyId: string): Promise<SpotifyArtist> {
    return this.makeRequest<SpotifyArtist>(`/artists/${spotifyId}`)
  }

  /**
   * Get artist's albums from Spotify
   */
  async getArtistAlbums(
    spotifyId: string,
    options: {
      includeGroups?: string[]
      market?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ items: SpotifyAlbum[] }> {
    const params = new URLSearchParams({
      include_groups: options.includeGroups?.join(',') || 'album,single,',
      // market: options.market || 'FR',
      limit: (options.limit || 50).toString(),
      offset: (options.offset || 0).toString(),
    })
    logger.info(`Fetching albums for artist ${spotifyId} with params ${params}`)
    const res = await this.makeRequest<{ items: SpotifyAlbum[] }>(
      `/artists/${spotifyId}/albums?${params}`
    )
    logger.info(`Fetched ${res.items.length} albums for artist ${spotifyId}`)
    return res
  }

  /**
   * Get album details with tracks
   */
  async getAlbum(spotifyId: string): Promise<SpotifyAlbum> {
    return this.makeRequest<SpotifyAlbum>(`/albums/${spotifyId}`)
  }
  /**
   * Get track details
   */
  async getTrack(spotifyId: string): Promise<SpotifyAlbum> {
    return this.makeRequest<SpotifyAlbum>(`/tracks/${spotifyId}`)
  }

  /**
   * Search for artists on Spotify
   */
  async searchArtists(
    query: string,
    limit: number = 20
  ): Promise<{ artists: { items: SpotifyArtist[] } }> {
    const params = new URLSearchParams({
      q: query,
      type: 'artist',
      limit: limit.toString(),
    })

    return this.makeRequest<{ artists: { items: SpotifyArtist[] } }>(`/search?${params}`)
  }

  /**
   * Check for new releases for all artists with Spotify IDs
   */
  async checkForNewReleases(
    artistId?: Artist['id'],
    nbDays: number = 4
  ): Promise<{
    processed: number
    newReleases: number
    errors: number
  }> {
    const stats = { processed: 0, newReleases: 0, errors: 0 }

    try {
      if (artistId) {
        const artist = await Artist.find(artistId)
        if (!artist) {
          throw new Error(`Artist with ID ${artistId} not found`)
        }
        await this.checkArtistForNewReleases(artist, stats, nbDays)
        stats.processed++
        return stats
      }
      // Get all artists with Spotify IDs
      const artists = await Artist.query().whereNotNull('spotifyId').preload('releases')

      logger.info(`Checking ${artists.length} artists for new releases`)

      for (const artist of artists) {
        try {
          await this.checkArtistForNewReleases(artist, stats, nbDays)
          stats.processed++

          // Add delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          logger.error(`Error checking releases for artist ${artist.name}: ${error.message}`)
          stats.errors++
        }
      }

      logger.info(
        `Release check completed. Processed: ${stats.processed}, New: ${stats.newReleases}, Errors: ${stats.errors}`
      )
      return stats
    } catch (error) {
      logger.error('Failed to check for new releases: ' + error.message)
      throw error
    }
  }

  /**
   * Check for new releases for a specific artist
   */
  private async checkArtistForNewReleases(
    artist: Artist,
    stats: { processed: number; newReleases: number; errors: number },
    nbDays: number = 4
  ): Promise<void> {
    if (!artist.spotifyId) {
      return
    }

    try {
      // Get recent albums
      const daysAgo = DateTime.now().minus({ days: nbDays })
      const albums = await this.getArtistAlbums(artist.spotifyId, {
        includeGroups: ['album', 'single'],
        // limit: 10,
      })

      for (const album of albums.items) {
        const releaseDate = DateTime.fromISO(album.release_date)

        // Only check releases from the specified number of days
        if (releaseDate < daysAgo) {
          continue
        }

        // Check if we already have this release
        const existingRelease = await Release.query().where('spotifyId', album.id).first()

        if (!existingRelease) {
          const fullAlbum = await this.getAlbum(album.id)
          await this.createReleaseFromSpotify(artist, fullAlbum, album.album_type === 'single')
          stats.newReleases++
        }
      }
    } catch (error) {
      logger.error(`Error checking artist ${artist.name} for new releases:`, error.message)
      throw error
    }
  }

  /**
   * Create a new release from Spotify data
   */
  private async createReleaseFromSpotify(
    artist: Artist,
    album: SpotifyAlbum,
    isSingle: boolean
  ): Promise<Release> {
    try {
      const releaseData = {
        title: isSingle ? album.tracks.items[0].name : album.name,
        description: `${album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)} by ${artist.name}`,
        date: DateTime.fromISO(album.release_date),
        type: album.album_type,
        urls: Object.values(album.external_urls).map((url) => url),
        cover: album.images[0]?.url || null,
        isSecret: false,
        isAutomated: true, // Mark as automatically created
        spotifyId: album.id,
        artistId: artist.id,
      }

      const release = await Release.create(releaseData)

      logger.info(`Created new release: ${album.name} by ${artist.name}`)
      // Create features for all artists on the album/track
      for (const spotifyArtist of album.artists) {
        // Exclude the main artist of the release from being added as a feature
        if (spotifyArtist.id === artist.spotifyId) {
          continue
        }

        const existingArtist = await Artist.findBy('spotifyId', spotifyArtist.id)
        if (existingArtist) {
          await Feature.create({
            releaseId: release.id,
            artistId: existingArtist.id,
            artistName: null,
          })
        } else {
          await Feature.create({
            releaseId: release.id,
            artistId: null,
            artistName: spotifyArtist.name,
          })
        }
      }

      return release
    } catch (error) {
      logger.error(`Failed to create release for album ${album.name}: ${error.message}`)
      throw error
    }
  }

  /**
   * Update artist information from Spotify
   */
  async updateArtistFromSpotify(artist: Artist): Promise<void> {
    if (!artist.spotifyId) {
      return
    }

    try {
      const spotifyArtist = await this.getArtist(artist.spotifyId)

      await artist
        .merge({
          followers: {
            spotify: spotifyArtist.followers.total,
            lastUpdated: DateTime.now().toISO(),
          },
          profilePicture: artist.profilePicture || spotifyArtist.images[0]?.url || null,
        })
        .save()

      logger.info(`Updated artist ${artist.name} from Spotify`)
    } catch (error) {
      logger.error(`Failed to update artist ${artist.name} from Spotify:  ${error.message}`)
      throw error
    }
  }

  /**
   * Search for artists on Spotify and return formatted results
   */
  async searchArtistsFormatted(query: string, limit: number = 10): Promise<SpotifySearchResult[]> {
    try {
      const response = await this.searchArtists(query, limit)
      const artists = response.artists.items

      return artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        followers: artist.followers.total,
        images: artist.images,
        socials: artist.external_urls,
        spotifyUrl: `https://open.spotify.com/artist/${artist.id}`,
      }))
    } catch (error) {
      logger.error(`Failed to search Spotify artists: ${error.message}`)
      throw new Error(`Spotify search failed: ${error.message}`)
    }
  }

  /**
   * Check if an artist already exists in the database by Spotify ID
   */
  async findExistingArtistBySpotifyId(spotifyId: string): Promise<Artist | null> {
    return await Artist.query().where('spotifyId', spotifyId).first()
  }

  /**
   * Create artist from Spotify data
   */
  async createArtistFromSpotify(
    spotifyResult: SpotifySearchResult,
    options: CreateArtistOptions = {}
  ): Promise<Artist> {
    // Check if artist already exists with this Spotify ID
    const existingArtist = await this.findExistingArtistBySpotifyId(spotifyResult.id)

    if (existingArtist) {
      throw new Error(
        `Artist already exists in database: ${existingArtist.name} (ID: ${existingArtist.id})`
      )
    }

    // Prepare artist data
    const artistData = {
      name: spotifyResult.name,
      description: options?.description || `${spotifyResult.name} - Artist from Spotify`,
      profilePicture: spotifyResult.images[0]?.url || null,
      spotifyId: spotifyResult.id,
      followers: {
        spotify: spotifyResult.followers,
        lastUpdated: DateTime.now().toISO(),
      },
      socials: options?.socials || { spotify: spotifyResult.spotifyUrl },
      isVerified: false,
      categories: options.categories || [],
    }

    try {
      // Create the artist
      const artist = await this.artistService.createArtist(artistData)
      if (!artist) throw new Error('Artist not created')

      // Mark as checked
      artist.lastSpotifyCheck = DateTime.now()
      await artist.save()

      logger.info(`Created new artist: ${artist.name} with Spotify ID: ${artist.spotifyId}`)

      return artist
    } catch (error) {
      logger.error(`Failed to create artist from Spotify data: ${error.message}`)
      throw new Error(`Artist creation failed: ${error.message}`)
    }
  }

  /**
   * Search and optionally create artist in one operation
   */
  async searchAndCreate(
    query: string,
    spotifyId?: string,
    options: CreateArtistOptions & { limit?: number } = {}
  ): Promise<SearchAndCreateResult> {
    const result: SearchAndCreateResult = {
      searchResults: [],
    }

    try {
      // Search for artists
      result.searchResults = await this.searchArtistsFormatted(query, options.limit || 10)

      // If a specific Spotify ID is provided, try to create that artist
      if (spotifyId) {
        const selectedArtist = result.searchResults.find((artist) => artist.id === spotifyId)

        if (!selectedArtist) {
          result.error = `Artist with Spotify ID ${spotifyId} not found in search results`
          return result
        }

        try {
          result.createdArtist = await this.createArtistFromSpotify(selectedArtist, options)
        } catch (error) {
          result.error = error.message
        }
      }

      return result
    } catch (error) {
      result.error = error.message
      return result
    }
  }

  /**
   * Get detailed artist information from Spotify
   */
  async getArtistDetails(spotifyId: string) {
    try {
      const artist = await this.getArtist(spotifyId)
      return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        followers: artist.followers.total,
        images: artist.images,
        spotifyUrl: `https://open.spotify.com/artist/${artist.id}`,
      }
    } catch (error) {
      logger.error(`Failed to get artist details from Spotify: ${error.message}`)
      throw new Error(`Failed to get artist details: ${error.message}`)
    }
  }

  /**
   * Sync existing artist with Spotify data
   */
  async syncExistingArtist(artistId: string): Promise<Artist> {
    const artist = await Artist.findOrFail(artistId)

    if (!artist.spotifyId) {
      throw new Error('Artist does not have a Spotify ID')
    }

    try {
      await this.updateArtistFromSpotify(artist)
      artist.lastSpotifyCheck = DateTime.now()
      await artist.save()

      logger.info(`Synced artist ${artist.name} with Spotify data`)
      return artist
    } catch (error) {
      logger.error(`Failed to sync artist with Spotify: ${error.message}`)
      throw new Error(`Sync failed: ${error.message}`)
    }
  }
}
