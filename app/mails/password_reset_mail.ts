import { BaseMail } from '@adonisjs/mail'
import env from '#start/env'
import { BRAND_NAME, BRAND_PRIMARY_COLOR } from '#constants/branding'
import PasswordResetService from '#services/password_reset_service'

export interface PasswordResetMailPayload {
  email: string
  fullName: string | null
  resetUrl: string
}

export default class PasswordResetMail extends BaseMail {
  constructor(public readonly payload: PasswordResetMailPayload) {
    super()
  }

  async prepare() {
    this.message
      .from(env.get('MAIL_FROM_ADDRESS'), env.get('MAIL_FROM_NAME'))
      .to(this.payload.email, this.payload.fullName ?? undefined)
      .subject('Ton nouveau mot de passe · StayConnect')
      .htmlView('emails/password_reset', {
        ...this.payload,
        brandName: BRAND_NAME,
        brandColor: BRAND_PRIMARY_COLOR,
        lifetimeMinutes: PasswordResetService.lifetimeMinutes,
      })
      .text(
        `Pour choisir un nouveau mot de passe StayConnect, ouvre ce lien :\n${this.payload.resetUrl}\n\nCe lien est valable ${PasswordResetService.lifetimeMinutes} minutes et ne peut être utilisé qu’une fois. Si tu n’as pas fait cette demande, ignore cet email.`
      )
  }
}
