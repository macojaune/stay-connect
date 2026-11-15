import type { HttpContext } from '@adonisjs/core/http'
import queue from '@rlanz/bull-queue/services/main'
import logger from '@adonisjs/core/services/logger'
import type { MemberAccountProps } from '#contracts/member'
import MemberService, { memberPage } from '#services/member_service'
import ArtistSuggestionService from '#services/artist_suggestion_service'
import AuthRateLimiter from '#services/auth_rate_limiter'
import { renderPage } from '#services/inertia_page'
import { memberProfileValidator, memberSuggestionValidator } from '#validators/member'
import PasswordResetEmailJob from '#jobs/password_reset_email_job'

export default class MemberController {
  private readonly members = new MemberService()
  private readonly limiter = new AuthRateLimiter()

  async dashboard(ctx: HttpContext) {
    this.privatePage(ctx)
    const user = ctx.auth.use('web').getUserOrFail()
    const page = memberPage(ctx.request.input('page'))
    const props = await this.members.dashboard(user.id, user.fullName || user.username, page)
    if (page > props.pagination.lastPage) {
      return ctx.response.redirect().toPath(`/mon-espace?page=${props.pagination.lastPage}`)
    }
    return renderPage(ctx, 'member/DashboardPage', props, 'Mon espace')
  }

  async account(ctx: HttpContext) {
    this.privatePage(ctx)
    const user = ctx.auth.use('web').getUserOrFail()
    const status: unknown = ctx.session.flashMessages.get('memberAccountStatus')
    const props: MemberAccountProps = {
      profile: { fullName: user.fullName, username: user.username, email: user.email },
      ...(status === 'updated' || status === 'reset-link-sent' ? { status } : {}),
    }
    return renderPage(ctx, 'member/AccountPage', props, 'Mon compte')
  }

  async updateAccount(ctx: HttpContext) {
    const user = ctx.auth.use('web').getUserOrFail()
    const payload = await ctx.request.validateUsing(memberProfileValidator)
    // Only the public display name is editable. No body/URL field selects the account.
    user.fullName = payload.name
    await user.save()
    ctx.session.flash('memberAccountStatus', 'updated')
    return ctx.response.redirect().toPath('/mon-compte')
  }

  async requestPasswordReset(ctx: HttpContext) {
    const user = ctx.auth.use('web').getUserOrFail()
    if (!(await this.allow(ctx, 'forgot-password', user.email, '/mon-compte'))) return
    try {
      await queue.dispatch(
        PasswordResetEmailJob,
        { email: user.email, returnTo: '/mon-espace' },
        { removeOnComplete: true, removeOnFail: 20, backoff: { type: 'exponential', delay: 5000 } }
      )
      ctx.session.flash('memberAccountStatus', 'reset-link-sent')
    } catch {
      logger.error('Unable to queue a member password reset request')
      ctx.session.flashErrors({
        form: 'L’envoi est momentanément indisponible. Réessaie dans un instant.',
      })
    }
    return ctx.response.redirect().toPath('/mon-compte')
  }

  async suggestions(ctx: HttpContext) {
    this.privatePage(ctx)
    const user = ctx.auth.use('web').getUserOrFail()
    const page = memberPage(ctx.request.input('page'))
    const props = await this.members.suggestions(user.id, page)
    if (page > props.pagination.lastPage) {
      return ctx.response
        .redirect()
        .toPath(`/mon-espace/propositions?page=${props.pagination.lastPage}`)
    }
    if (ctx.session.flashMessages.get('memberSuggestionSubmitted') === true)
      props.status = 'submitted'
    return renderPage(ctx, 'member/SuggestionsPage', props, 'Mes propositions')
  }

  async storeSuggestion(ctx: HttpContext) {
    const user = ctx.auth.use('web').getUserOrFail()
    if (!(await this.allow(ctx, 'artist-suggestion', user.email, '/mon-espace/propositions')))
      return
    const payload = await ctx.request.validateUsing(memberSuggestionValidator)
    await new ArtistSuggestionService().create({ ...payload, email: user.email }, user.id)
    ctx.session.flash('memberSuggestionSubmitted', true)
    return ctx.response.redirect().toPath('/mon-espace/propositions')
  }

  private privatePage(ctx: HttpContext) {
    ctx.response.header('Cache-Control', 'no-store')
    ctx.response.header('X-Robots-Tag', 'noindex, nofollow')
  }

  private async allow(
    ctx: HttpContext,
    action: 'forgot-password' | 'artist-suggestion',
    email: string,
    destination: '/mon-compte' | '/mon-espace/propositions'
  ) {
    try {
      const seconds = await this.limiter.consume(action, ctx.request.ip(), email)
      if (seconds === 0) return true
      ctx.response.header('Retry-After', seconds)
      ctx.session.flashErrors({
        form: `Trop de demandes. Réessaie dans ${Math.max(1, Math.ceil(seconds / 60))} min.`,
      })
    } catch {
      logger.error('Member action rate limiter unavailable')
      ctx.session.flashErrors({
        form: 'Le service est momentanément indisponible. Réessaie plus tard.',
      })
    }
    ctx.response.redirect().toPath(destination)
    return false
  }
}
