import env from '#start/env'
import { DateTime } from 'luxon'
import Artist from '#models/artist'
import Release from '#models/release'
import logger from '@adonisjs/core/services/logger'

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: Array<{
    url: string
    height: number
    width: number
  }>
  followers: {
    total: number
  }
}

export interface SpotifyAlbum {
  id: string
  name: string
  release_date: string
  album_type: 'album' | 'single' | 'compilation'
  images: Array<{
    url: string
    height: number
    width: number
  }>
  artists: Array<{
    id: string
    name: string
  }>
  tracks: {
    items: Array<{
      id: string
      name: string
      duration_ms: number
      preview_url?: string
      track_number: number
    }>
  }
}

export interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export default class SpotifyService {
  private static accessToken: string | null = null
  private static tokenExpiresAt: DateTime | null = null
  private static readonly BASE_URL = 'https://api.spotify.com/v1'
  private static readonly AUTH_URL = 'https://accounts.spotify.com/api/token'

  /**
   * Get access token for Spotify API
   */
  private static async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > DateTime.now()) {
      return this.accessToken
    }

    const clientId = env.get('SPOTIFY_CLIENT_ID')
    const clientSecret = env.get('SPOTIFY_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('Spotify credentials not configured')
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    try {
      const response = await fetch(this.AUTH_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      })

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`)
      }

      const data: SpotifyTokenResponse = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiresAt = DateTime.now().plus({ seconds: data.expires_in - 60 }) // Refresh 1 minute early

      return this.accessToken
    } catch (error) {
      logger.error('Failed to get Spotify access token:', error)
      throw error
    }
  }

  /**
   * Make authenticated request to Spotify API
   */
  private static async makeRequest<T>(endpoint: string): Promise<T> {
    const token = await this.getAccessToken()
    const url = `${this.BASE_URL}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = response.headers.get('Retry-After')
          const waitTime = retryAfter ? Number.parseInt(retryAfter) * 1000 : 1000
          logger.warn(`Spotify API rate limited. Waiting ${waitTime}ms`)
          await new Promise((resolve) => setTimeout(resolve, waitTime))
          return this.makeRequest<T>(endpoint)
        }
        throw new Error(`Spotify API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      logger.error(`Failed to make Spotify API request to ${endpoint}:`, error)
      throw error
    }
  }

  /**
   * Get artist information from Spotify
   */
  static async getArtist(spotifyId: string): Promise<SpotifyArtist> {
    return this.makeRequest<SpotifyArtist>(`/artists/${spotifyId}`)
  }

  /**
   * Get artist's albums from Spotify
   */
  static async getArtistAlbums(
    spotifyId: string,
    options: {
      includeGroups?: string[]
      market?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ items: SpotifyAlbum[] }> {
    const params = new URLSearchParams({
      include_groups: options.includeGroups?.join(',') || 'album,single',
      market: options.market || 'US',
      limit: (options.limit || 50).toString(),
      offset: (options.offset || 0).toString(),
    })

    return this.makeRequest<{ items: SpotifyAlbum[] }>(`/artists/${spotifyId}/albums?${params}`)
  }

  /**
   * Get album details with tracks
   */
  static async getAlbum(spotifyId: string): Promise<SpotifyAlbum> {
    return this.makeRequest<SpotifyAlbum>(`/albums/${spotifyId}`)
  }

  /**
   * Search for artists on Spotify
   */
  static async searchArtists(
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
  static async checkForNewReleases(): Promise<{
    processed: number
    newReleases: number
    errors: number
  }> {
    const stats = { processed: 0, newReleases: 0, errors: 0 }

    try {
      // Get all artists with Spotify IDs
      const artists = await Artist.query().whereNotNull('spotifyId').preload('releases')

      logger.info(`Checking ${artists.length} artists for new releases`)

      for (const artist of artists) {
        try {
          await this.checkArtistForNewReleases(artist)
          stats.processed++

          // Add delay to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 100))
        } catch (error) {
          logger.error(`Error checking releases for artist ${artist.name}:`, error)
          stats.errors++
        }
      }

      logger.info(
        `Release check completed. Processed: ${stats.processed}, New: ${stats.newReleases}, Errors: ${stats.errors}`
      )
      return stats
    } catch (error) {
      logger.error('Failed to check for new releases:', error)
      throw error
    }
  }

  /**
   * Check for new releases for a specific artist
   */
  private static async checkArtistForNewReleases(artist: Artist): Promise<void> {
    if (!artist.spotifyId) {
      return
    }

    try {
      // Get recent albums (last 2 years)
      const twoYearsAgo = DateTime.now().minus({ years: 2 })
      const albums = await this.getArtistAlbums(artist.spotifyId, {
        includeGroups: ['album', 'single'],
        limit: 50,
      })

      for (const album of albums.items) {
        const releaseDate = DateTime.fromISO(album.release_date)

        // Only check releases from the last 2 years
        if (releaseDate < twoYearsAgo) {
          continue
        }

        // Check if we already have this release
        const existingRelease = await Release.query().where('spotifyId', album.id).first()

        if (!existingRelease) {
          // Get full album details
          const fullAlbum = await this.getAlbum(album.id)
          await this.createReleaseFromSpotify(artist, fullAlbum)
        }
      }
    } catch (error) {
      logger.error(`Error checking artist ${artist.name} for new releases:`, error)
      throw error
    }
  }

  /**
   * Create a new release from Spotify data
   */
  private static async createReleaseFromSpotify(
    artist: Artist,
    album: SpotifyAlbum
  ): Promise<Release> {
    try {
      const release = await Release.create({
        title: album.name,
        description: `${album.album_type.charAt(0).toUpperCase() + album.album_type.slice(1)} by ${artist.name}`,
        date: DateTime.fromISO(album.release_date),
        type: album.album_type,
        urls: [`https://open.spotify.com/album/${album.id}`],
        cover: album.images[0]?.url || null,
        isSecret: false,
        isAutomated: true, // Mark as automatically created
        spotifyId: album.id,
        artistId: artist.id,
      })

      logger.info(`Created new release: ${album.name} by ${artist.name}`)
      return release
    } catch (error) {
      logger.error(`Failed to create release for album ${album.name}:`, error)
      throw error
    }
  }

  /**
   * Update artist information from Spotify
   */
  static async updateArtistFromSpotify(artist: Artist): Promise<void> {
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
      logger.error(`Failed to update artist ${artist.name} from Spotify:`, error)
      throw error
    }
  }
}
