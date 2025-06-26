import { BaseCommand, args, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import SpotifyService from '#services/spotify_service'
import type { SpotifySearchResult } from '#services/spotify_service'
import Artist from '#models/artist'
import logger from '@adonisjs/core/services/logger'

export default class SearchSpotifyArtist extends BaseCommand {
  static commandName = 'spotify:search-artist'
  static description = 'Search for artists on Spotify and optionally create them in the database'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @args.string({ description: 'Artist name to search for' })
  declare query: string

  @flags.number({ description: 'Number of results to return', default: 4 })
  declare limit: number

  @flags.boolean({ description: 'Interactive mode to select and create artist' })
  declare interactive: boolean

  async run() {
    this.logger.info(`Searching Spotify for artist: ${this.query}`)

    try {
      const results = await this.searchSpotifyArtists(this.query, this.limit)

      if (results.length === 0) {
        this.logger.info('No artists found on Spotify')
        return
      }

      this.displayResults(results)

      if (this.interactive) {
        await this.handleInteractiveSelection(results)
      }

      this.logger.info('Search completed successfully')
    } catch (error) {
      this.logger.error('Failed to search Spotify artists: ' + error.message)
      this.exitCode = 1
    }
  }

  /**
   * Search for artists on Spotify (can be called from API)
   */
  async searchSpotifyArtists(query: string, limit: number = 10): Promise<SpotifySearchResult[]> {
    const spotifyService = new SpotifyService()
    return await spotifyService.searchArtistsFormatted(query, limit)
  }

  /**
   * Create artist from Spotify data (can be called from API)
   */
  async createArtistFromSpotify(
    spotifyResult: SpotifySearchResult,
    additionalData: {
      description?: string
      categories?: string[]
    } = {}
  ): Promise<Artist> {
    const spotifyService = new SpotifyService()
    return await spotifyService.createArtistFromSpotify(spotifyResult, additionalData)
  }

  private displayResults(results: SpotifySearchResult[]) {
    this.logger.info(`\nFound ${results.length} artists on Spotify:\n`)

    results.forEach((artist, index) => {
      this.logger.info(`${index + 1}. ${artist.name}`)
      this.logger.info(`   Spotify ID: ${artist.id}`)
      this.logger.info(`   Followers: ${artist.followers.toLocaleString()}`)
      this.logger.info(`   Genres: ${artist.genres.join(', ') || 'None listed'}`)
      this.logger.info(`   URL: ${artist.spotifyUrl}`)
      this.logger.info('')
    })
  }

  private async handleInteractiveSelection(results: SpotifySearchResult[]) {
    const selection = await this.prompt.ask(
      `Enter the number of the artist to create (1-${results.length}) or 0 to skip:`
    )

    const selectedIndex = Number.parseInt(selection) - 1

    if (selectedIndex < 0 || selectedIndex >= results.length) {
      this.logger.info('No artist selected or invalid selection')
      return
    }

    const selectedArtist = results[selectedIndex]

    // Ask for additional details
    const description = await this.prompt.ask(
      `Enter description for ${selectedArtist.name} (optional):`,
      { default: '' }
    )

    try {
      const artist = await this.createArtistFromSpotify(selectedArtist, {
        description,
      })

      this.logger.info(`\n✅ Successfully created artist: ${artist.name}`)
      this.logger.info(`   Database ID: ${artist.id}`)
      this.logger.info(`   Spotify ID: ${artist.spotifyId}`)
      this.logger.info(`   Profile Picture: ${artist.profilePicture || 'None'}`)
    } catch (error) {
      this.logger.error(`Failed to create artist: ${error.message}`)
    }
  }
}
