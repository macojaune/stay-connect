import { errorDetails } from '#exceptions/error_details'
import SpotifyService from '#services/spotify_service'
import Artist from '#models/artist'
import { args, flags, BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

type Candidate = {
  spotifyId: string
  name: string
  spotifyUrl: string
  matchingSearches: string[]
  alreadyInCatalogue: boolean
}

export default class SpotifyArtistCandidates extends BaseCommand {
  static commandName = 'spotify:artist-candidates'
  static description = 'List Spotify artist candidates for human review without importing them'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @args.string({ description: 'Comma-separated genre search terms, e.g. "bouyon,rap antillais"' })
  declare genres: string

  @flags.number({ description: 'Maximum candidates returned per genre (1 to 10)', default: 10 })
  declare limit: number

  async run() {
    const genres = Array.from(
      new Set(
        this.genres
          .split(',')
          .map((genre) => genre.trim())
          .filter(Boolean)
      )
    )

    if (
      genres.length === 0 ||
      genres.length > 12 ||
      !Number.isInteger(this.limit) ||
      this.limit < 1 ||
      this.limit > 10
    ) {
      this.logger.error('Provide 1 to 12 genres and a per-genre limit between 1 and 10.')
      this.exitCode = 1
      return
    }

    const spotifyService = new SpotifyService()
    const candidates = new Map<string, Candidate>()

    try {
      for (const genre of genres) {
        const escapedGenre = genre.replace(/["\\]/g, '')
        const search = `genre:"${escapedGenre}"`
        const results = await spotifyService.searchArtistsFormatted(search, this.limit)

        for (const result of results) {
          const existing = candidates.get(result.id)
          if (existing) {
            existing.matchingSearches.push(genre)
            continue
          }

          candidates.set(result.id, {
            spotifyId: result.id,
            name: result.name,
            spotifyUrl: result.spotifyUrl,
            matchingSearches: [genre],
            alreadyInCatalogue: false,
          })
        }
      }

      const spotifyIds = Array.from(candidates.keys())
      if (spotifyIds.length > 0) {
        const knownArtists = await Artist.query()
          .whereIn('spotifyId', spotifyIds)
          .select('spotifyId')
        for (const artist of knownArtists) {
          if (artist.spotifyId) {
            const candidate = candidates.get(artist.spotifyId)
            if (candidate) candidate.alreadyInCatalogue = true
          }
        }
      }

      console.log(
        JSON.stringify(
          {
            source: 'Spotify Search',
            reviewStatus: 'à vérifier',
            searchedGenres: genres,
            candidates: Array.from(candidates.values()),
          },
          null,
          2
        )
      )
    } catch (error: unknown) {
      this.logger.error('Spotify candidate search failed: ' + errorDetails(error).message)
      this.exitCode = 1
    }
  }
}
