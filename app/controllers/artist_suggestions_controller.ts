import ArtistSuggestion from '#models/artist_suggestion'
import { artistSuggestionValidator } from '#validators/artist_suggestion'
import type { HttpContext } from '@adonisjs/core/http'

export default class ArtistSuggestionsController {
  async store({ request, response, session }: HttpContext) {
    const payload = await request.validateUsing(artistSuggestionValidator)

    await ArtistSuggestion.create({
      name: payload.name,
      email: payload.email,
      sourceUrl: payload.sourceUrl || null,
      message: payload.message || null,
      status: 'pending',
    })

    session.flash('success', 'Merci. La proposition est en attente de vérification.')
    return response.redirect().back()
  }
}
