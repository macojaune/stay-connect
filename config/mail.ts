import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: env.get('MAIL_MAILER', 'brevo'),

  /**
   * The mailers object can be used to configure multiple mailers
   * each using a different transport or same transport with different
   * options.
   */
  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST', '127.0.0.1'),
      port: env.get('SMTP_PORT', 1026),
      secure: env.get('SMTP_SECURE', false),
    }),
    brevo: transports.brevo({
      key: env.get('BREVO_API_KEY'),
      baseUrl: 'https://api.brevo.com/v3',
    }),
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}
