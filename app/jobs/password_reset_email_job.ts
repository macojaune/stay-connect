import { Job } from '@rlanz/bull-queue'
import mail from '@adonisjs/mail/services/main'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import User from '#models/user'
import PasswordResetMail from '#mails/password_reset_mail'
import PasswordResetService from '#services/password_reset_service'
import { safeReturnTo } from '#services/auth_redirect'
import type { PasswordResetRequest } from '#contracts/auth'

export default class PasswordResetEmailJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async handle(payload: PasswordResetRequest) {
    const users = await User.query()
      .whereRaw('LOWER(email) = ?', [payload.email.trim().toLowerCase()])
      .limit(2)
    // Legacy addresses differing only by case are ambiguous. Do not reset either account.
    const user = users.length === 1 ? users[0] : undefined
    if (!user) return

    const token = await new PasswordResetService().issue(user)
    const resetUrl = new URL('/reset-password', env.get('APP_URL'))
    resetUrl.searchParams.set('token', token)
    const returnTo = safeReturnTo(payload.returnTo)
    if (returnTo !== '/') resetUrl.searchParams.set('returnTo', returnTo)

    try {
      await mail.send(
        new PasswordResetMail({
          email: user.email,
          fullName: user.fullName,
          resetUrl: resetUrl.toString(),
        })
      )
    } catch {
      // The queue logs thrown errors. Never include a provider response containing the link.
      throw new Error('Password reset email delivery failed')
    }
  }

  async rescue() {
    // Provider exceptions can include the full email and its credential-bearing URL.
    logger.error('Password reset email delivery failed after all retries')
  }
}
