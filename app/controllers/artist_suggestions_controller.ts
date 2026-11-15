import ArtistSuggestionService from '#services/artist_suggestion_service'
import AuthRateLimiter from '#services/auth_rate_limiter'
import { artistSuggestionValidator } from '#validators/artist_suggestion'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

export default class ArtistSuggestionsController {
  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(artistSuggestionValidator)
    const user = ctx.auth.use('web').user
    try {
      const seconds = await new AuthRateLimiter().consume(
        'artist-suggestion',
        ctx.request.ip(),
        user?.email ?? payload.email
      )
      if (seconds > 0) {
        ctx.response.header('Retry-After', seconds)
        ctx.session.flashErrors({
          form: `Trop de propositions. Réessaie dans ${Math.max(1, Math.ceil(seconds / 60))} min.`,
        })
        return ctx.response.redirect().toPath('/artistes#proposer')
      }
    } catch {
      logger.error('Artist suggestion rate limiter unavailable')
      ctx.session.flashErrors({
        form: 'Le service est momentanément indisponible. Réessaie plus tard.',
      })
      return ctx.response.redirect().toPath('/artistes#proposer')
    }

    await new ArtistSuggestionService().create(payload, user?.id ?? null)
    ctx.session.flash('success', 'Merci. La proposition est en attente de vérification.')
    if (ctx.request.header('X-Inertia')) return ctx.inertia.location('/artistes#proposer')
    return ctx.response.redirect().toPath('/artistes#proposer')
  }
}
