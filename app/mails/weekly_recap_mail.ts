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
    const [leadRelease, ...otherReleases] = this.payload.releases
    const releaseRows = Array.from({ length: Math.ceil(otherReleases.length / 2) }, (_, index) =>
      otherReleases.slice(index * 2, index * 2 + 2)
    )

    this.message
      .from(fromAddress, fromName)
      .to(this.payload.user.email, this.payload.user.fullName ?? undefined)
      .subject(`Les sorties de la semaine · ${BRAND_NAME}`)
      .htmlView('emails/weekly_recap', {
        payload: this.payload,
        appUrl,
        brandName: BRAND_NAME,
        brandColor: BRAND_PRIMARY_COLOR,
        leadRelease,
        releaseRows,
        emailAssetsUrl: `${appUrl}/email/weekly`,
      })
  }
}
