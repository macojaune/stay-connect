import { Job } from '@rlanz/bull-queue'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import WeeklyRecapService from '#services/weekly_recap_service'
import EmailService, { EmailTemplate } from '#services/email_service'
import { ContactsApi, ContactsApiApiKeys } from '@getbrevo/brevo'

export interface WeeklyRecapEmailPayload {
  sendLater?: boolean
  email?: string
  limit?: number
}

export default class WeeklyRecapEmailJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async handle(payload: WeeklyRecapEmailPayload = {}) {
    const sendLater = payload.sendLater ?? false
    const limit = payload.limit
    const emailOverride = payload.email

    const emailService = new EmailService()
    const weeklyRecapService = new WeeklyRecapService()

    logger.info('[queue] Building weekly recap dataset')
    const dataset = await weeklyRecapService.buildDataset()

    if (dataset.totalNewReleases === 0) {
      const start = dataset.periodStart.toISODate() ?? '[unknown]'
      const end = dataset.periodEnd.toISODate() ?? '[unknown]'
      logger.info(
        `[queue] Skipping weekly recap: no new releases for ${start} → ${end}`
      )
      return
    }

    if (emailOverride) {
      logger.info(`[queue] Sending weekly recap preview to ${emailOverride}`)
      const payloadData = weeklyRecapService.buildPayload(
        {
          email: emailOverride,
          fullName: emailOverride,
          username: emailOverride,
        },
        dataset
      )

      await emailService.send(EmailTemplate.WeeklyRecap, payloadData, {
        sendLater,
      })
      logger.info('[queue] Weekly recap preview sent')
      return
    }

    const recipients = await this.fetchContactsFromBrevo()
    if (recipients.length === 0) {
      logger.info('[queue] No recipients found for weekly recap')
      return
    }

    const finalRecipients = limit ? recipients.slice(0, limit) : recipients
    logger.info(
      `[queue] Preparing weekly recap for ${finalRecipients.length} recipient${finalRecipients.length > 1 ? 's' : ''}`
    )

    let success = 0
    let failure = 0
    const actionVerb = sendLater ? 'Queued' : 'Sent'

    for (const recipient of finalRecipients) {
      try {
        const payloadData = weeklyRecapService.buildPayload(recipient, dataset)
        await emailService.send(EmailTemplate.WeeklyRecap, payloadData, {
          sendLater,
        })
        success++
        logger.info(`[queue] ${actionVerb} weekly recap for ${recipient.email}`)
      } catch (error) {
        failure++
        logger.error(
          error,
          `[queue] Failed to send weekly recap to ${recipient.email}`
        )
      }
    }

    logger.info(
      `[queue] Weekly recap finished: success=${success}, failed=${failure}`
    )
  }

  async rescue(payload: WeeklyRecapEmailPayload, error: Error) {
    logger.error(
      error,
      `[queue] Weekly recap job failed permanently${payload.email ? ` (preview for ${payload.email})` : ''}`
    )
  }

  private async fetchContactsFromBrevo() {
    const listId = Number(env.get('BREVO_CONTACT_LIST_ID'))
    if (Number.isNaN(listId)) {
      throw new Error('BREVO_CONTACT_LIST_ID must be a valid number')
    }

    const api = new ContactsApi()
    api.setApiKey(ContactsApiApiKeys.apiKey, env.get('BREVO_API_KEY'))

    const limit = 200
    let offset = 0
    const recipients: {
      email: string
      fullName?: string | null
      username?: string | null
    }[] = []

    while (true) {
      const { body } = await api.getContactsFromList(listId, undefined, limit, offset, 'asc')
      const contacts = body.contacts ?? []

      if (contacts.length === 0) {
        break
      }

      for (const contact of contacts) {
        if (!contact.email || contact.emailBlacklisted) {
          continue
        }

        const attributes = (contact.attributes ?? {}) as Record<string, unknown>
        const firstName =
          typeof attributes['FIRSTNAME'] === 'string' ? (attributes['FIRSTNAME'] as string) : undefined
        const lastName =
          typeof attributes['LASTNAME'] === 'string' ? (attributes['LASTNAME'] as string) : undefined
        const username =
          typeof attributes['USERNAME'] === 'string' ? (attributes['USERNAME'] as string) : undefined

        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined

        recipients.push({
          email: contact.email,
          fullName,
          username,
        })
      }

      if (contacts.length < limit) {
        break
      }

      offset += limit
    }

    logger.info(`[queue] Retrieved ${recipients.length} contacts from Brevo list ${listId}`)

    return recipients
  }
}
