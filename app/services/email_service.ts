import logger from '@adonisjs/core/services/logger'
import mail from '@adonisjs/mail/services/main'
import type { BaseMail } from '@adonisjs/mail/build/src/base_mail.js'
import WeeklyRecapMail from '#mails/weekly_recap_mail'
import type { WeeklyRecapEmailPayload } from '#contracts/email'

/**
 * Supported email templates keyed by a type-safe identifier.
 * Extend the enum as new transactional emails are introduced.
 */
export enum EmailTemplate {
  WeeklyRecap = 'weekly_recap',
}

type EmailPayloadMap = {
  [EmailTemplate.WeeklyRecap]: WeeklyRecapEmailPayload
}

type MailFactoryMap = {
  [EmailTemplate.WeeklyRecap]: (payload: WeeklyRecapEmailPayload) => BaseMail
}

/**
 * Centralised email service responsible for dispatching transactional emails.
 * New templates can be registered by extending the factories map.
 */
export default class EmailService {
  constructor(private factories: MailFactoryMap = EmailService.defaultFactories) {}

  /**
   * Sends an email using the configured Brevo transport. Pass `sendLater: true`
   * to defer the delivery via the configured messenger.
   */
  async send<K extends EmailTemplate>(
    template: K,
    payload: EmailPayloadMap[K],
    options?: { sendLater?: boolean }
  ) {
    const factory = this.factories[template]

    if (!factory) {
      throw new Error(`Email template "${template}" is not registered in EmailService`)
    }

    const mailable = factory(payload)

    try {
      if (options?.sendLater) {
        await mail.sendLater(mailable)
      } else {
        await mail.send(mailable)
      }
    } catch (error) {
      logger.error(
        {
          err: error,
          template,
        },
        'Failed to send transactional email'
      )
      throw error
    }
  }

  /**
   * Registry of template factories. Keeping it on the class makes it easy
   * to override in tests or extend in providers.
   */
  private static get defaultFactories(): MailFactoryMap {
    return {
      [EmailTemplate.WeeklyRecap]: (payload) => new WeeklyRecapMail(payload),
    }
  }
}
