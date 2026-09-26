import {
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '#validators/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { errors } from '@adonisjs/auth'
import queue from '@rlanz/bull-queue/services/main'
import logger from '@adonisjs/core/services/logger'
import type {
  LoginPageProps,
  RegisterPageProps,
  ForgotPasswordPageProps,
  ResetPasswordPageProps,
} from '#contracts/auth'
import { authPageUrl, safeReturnTo } from '#services/auth_redirect'
import { startUserSession } from '#services/auth_session'
import AuthRateLimiter from '#services/auth_rate_limiter'
import AccountService from '#services/account_service'
import PasswordResetService from '#services/password_reset_service'
import PasswordResetEmailJob from '#jobs/password_reset_email_job'

export default class AuthController {
  private readonly rateLimiter = new AuthRateLimiter()
  private readonly accounts = new AccountService()
  private readonly passwords = new PasswordResetService()

  async showLogin(ctx: HttpContext) {
    const { request, response, session } = ctx
    response.header('Cache-Control', 'no-store')
    response.header('X-Robots-Tag', 'noindex, nofollow')
    const props: LoginPageProps = {
      returnTo: safeReturnTo(request.input('returnTo')),
      ...(session.flashMessages.get('passwordReset') === true ? { status: 'password-reset' } : {}),
    }
    return this.renderAuthPage(ctx, 'auth/LoginPage', props, 'Connexion')
  }

  async login(ctx: HttpContext) {
    const { request, response, session } = ctx
    if (!(await this.allow(ctx, 'login', request.input('email')))) return
    const payload = await request.validateUsing(loginValidator)

    try {
      const user = await this.accounts.verifyCredentials(payload.email, payload.password)
      await startUserSession(ctx, user)
      return this.resumeDiscovery(ctx, payload.returnTo)
    } catch (error) {
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        session.flashErrors({ email: 'Email ou mot de passe invalide.' })
        return response.redirect().toPath(authPageUrl('/login', safeReturnTo(payload.returnTo)))
      }
      throw error
    }
  }

  async showRegister(ctx: HttpContext) {
    const { request, response } = ctx
    response.header('Cache-Control', 'no-store')
    response.header('X-Robots-Tag', 'noindex, nofollow')
    const props: RegisterPageProps = { returnTo: safeReturnTo(request.input('returnTo')) }
    return this.renderAuthPage(ctx, 'auth/RegisterPage', props, 'Créer un compte')
  }

  async register(ctx: HttpContext) {
    if (!(await this.allow(ctx, 'register', ctx.request.input('email')))) return
    const payload = await ctx.request.validateUsing(registerValidator)
    const user = await this.accounts.register(payload)
    await startUserSession(ctx, user)
    return this.resumeDiscovery(ctx, payload.returnTo)
  }

  async showForgotPassword(ctx: HttpContext) {
    const { request, response, session } = ctx
    response.header('Cache-Control', 'no-store')
    response.header('X-Robots-Tag', 'noindex, nofollow')
    const props: ForgotPasswordPageProps = {
      returnTo: safeReturnTo(request.input('returnTo')),
      ...(session.flashMessages.get('resetLinkRequested') === true ? { status: 'sent' } : {}),
    }
    return this.renderAuthPage(ctx, 'auth/ForgotPasswordPage', props, 'Mot de passe oublié')
  }

  async forgotPassword(ctx: HttpContext) {
    const { request, response, session } = ctx
    if (!(await this.allow(ctx, 'forgot-password', request.input('email')))) return
    const payload = await request.validateUsing(forgotPasswordValidator)
    const returnTo = safeReturnTo(payload.returnTo)

    try {
      // Every valid address follows the same queue path. Account lookup happens in the worker.
      await queue.dispatch(
        PasswordResetEmailJob,
        { email: payload.email, returnTo },
        { removeOnComplete: true, removeOnFail: 20, backoff: { type: 'exponential', delay: 5000 } }
      )
      session.flash('resetLinkRequested', true)
    } catch {
      logger.error('Unable to queue a password reset request')
      session.flashErrors({
        form: 'L’envoi est momentanément indisponible. Réessaie dans un instant.',
      })
    }
    return response.redirect().toPath(authPageUrl('/forgot-password', returnTo))
  }

  async showResetPassword(ctx: HttpContext) {
    const { request, response } = ctx
    response.header('Referrer-Policy', 'no-referrer')
    response.header('Cache-Control', 'no-store')
    response.header('X-Robots-Tag', 'noindex, nofollow')
    const input: unknown = request.input('token')
    const token = typeof input === 'string' && /^[a-zA-Z0-9_-]{43}$/.test(input) ? input : ''
    const props: ResetPasswordPageProps = {
      token,
      returnTo: safeReturnTo(request.input('returnTo')),
      valid: await this.passwords.isValid(token),
    }
    return this.renderAuthPage(ctx, 'auth/ResetPasswordPage', props, 'Nouveau mot de passe')
  }

  async resetPassword(ctx: HttpContext) {
    const { request, response, session, auth } = ctx
    response.header('Referrer-Policy', 'no-referrer')
    response.header('Cache-Control', 'no-store')
    if (!(await this.allow(ctx, 'reset-password', request.input('token')))) return
    const payload = await request.validateUsing(resetPasswordValidator)
    const returnTo = safeReturnTo(payload.returnTo)
    if (!(await this.passwords.consume(payload.token, payload.password))) {
      session.flashErrors({ token: 'Ce lien est invalide ou a expiré. Demande un nouveau lien.' })
      return response.redirect().toPath(`/reset-password?${new URLSearchParams({ returnTo })}`)
    }

    await auth.use('web').logout()
    session.clear()
    session.flash('passwordReset', true)
    return response.redirect().toPath(authPageUrl('/login', returnTo))
  }

  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.clear()
    return response.redirect().toPath('/')
  }

  private resumeDiscovery(ctx: HttpContext, returnTo: unknown) {
    const destination = safeReturnTo(returnTo)
    // An XHR redirect loses URL fragments before Inertia receives the page response.
    if (destination.includes('#') && ctx.request.header('X-Inertia')) {
      return ctx.inertia.location(destination)
    }
    return ctx.response.redirect().toPath(destination)
  }

  private async renderAuthPage<Props extends { returnTo: string }>(
    ctx: HttpContext,
    component: string,
    props: Props,
    title: string
  ) {
    const page = await ctx.inertia.render(component, props, { title })
    if (
      ctx.request.header('X-Inertia') &&
      typeof page === 'object' &&
      ctx.request.header('X-Inertia-Version', '') !== String(page.version)
    ) {
      // Inertia 3.1 requests a full reload after this GET but does not preserve flashes.
      // Reflash before the session middleware commits, so the full page receives them.
      ctx.session.reflash()
    }
    return page
  }

  private async allow(
    ctx: HttpContext,
    action: 'login' | 'register' | 'forgot-password' | 'reset-password',
    identity: unknown
  ) {
    try {
      const seconds = await this.rateLimiter.consume(action, ctx.request.ip(), identity)
      if (seconds === 0) return true
      ctx.response.header('Retry-After', seconds)
      ctx.session.flashErrors({
        form: `Trop de tentatives. Réessaie dans ${Math.max(1, Math.ceil(seconds / 60))} min.`,
      })
    } catch {
      // Fail closed when the shared limiter is unavailable.
      logger.error('Authentication rate limiter unavailable')
      ctx.session.flashErrors({
        form: 'Le service est momentanément indisponible. Réessaie plus tard.',
      })
    }

    const returnTo = safeReturnTo(ctx.request.input('returnTo'))
    if (action === 'reset-password') {
      const token: unknown = ctx.request.input('token')
      const query = new URLSearchParams({ returnTo })
      if (typeof token === 'string' && /^[a-zA-Z0-9_-]{43}$/.test(token)) query.set('token', token)
      ctx.response.redirect().toPath(`/reset-password?${query}`)
    } else {
      ctx.response.redirect().toPath(authPageUrl(`/${action}`, returnTo))
    }
    return false
  }
}
