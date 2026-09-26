import ArtistSuggestion from '#models/artist_suggestion'
import type { ArtistSuggestionInput } from '#validators/artist_suggestion'

export default class ArtistSuggestionService {
  async create(input: ArtistSuggestionInput, userId: string | null) {
    return ArtistSuggestion.create({
      name: input.name,
      email: input.email,
      sourceUrl: input.sourceUrl,
      message: input.message || null,
      userId,
      status: 'pending',
    })
  }
}
