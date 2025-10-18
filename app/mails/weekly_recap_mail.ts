import env from '#start/env'
import { BaseMail } from '@adonisjs/mail'
import type { WeeklyRecapEmailPayload } from '#contracts/email'
import { BRAND_NAME, BRAND_PRIMARY_COLOR } from '#constants/branding'

export default class WeeklyRecapMail extends BaseMail {
  constructor(private payload: WeeklyRecapEmailPayload) {
    super()
  }

  /**
   * Compose the weekly recap email using an Edge template.
   */
  async prepare() {
    const fromAddress = env.get('MAIL_FROM_ADDRESS')
    const fromName = env.get('MAIL_FROM_NAME')
    const appUrl = env.get('APP_URL').replace(/\/$/, '')

    this.message
      .from(fromAddress, fromName)
      .to(this.payload.user.email, this.payload.user.fullName ?? undefined)
      .subject(`${BRAND_NAME} · Récapitulatif de la semaine`)
      .htmlView('emails/weekly_recap', {
        payload: this.payload,
        appUrl,
        brandName: BRAND_NAME,
        brandColor: BRAND_PRIMARY_COLOR,
      })
  }
}
