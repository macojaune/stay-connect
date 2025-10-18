import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import WeeklyRecapService from '#services/weekly_recap_service'
import EmailService, { EmailTemplate } from '#services/email_service'
import env from '#start/env'
import { ContactsApi, ContactsApiApiKeys } from '@getbrevo/brevo'

export default class SendWeeklyRecap extends BaseCommand {
  static commandName = 'email:weekly-recap'
  static description = 'Send the weekly recap email to subscribers from the Brevo list'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  @flags.boolean({
    description: 'Queue emails instead of sending immediately',
    default: false,
  })
  declare sendLater: boolean

  @flags.string({
    description: 'Limit the blast to a specific email address (for testing)',
  })
  declare email?: string

  @flags.number({
    description: 'Maximum number of recipients to process',
  })
  declare limit?: number

  async run() {
    try {
      await this.execute()
    } catch (error) {
      this.handleFailure(error)
    }
  }

  private async execute() {
    const emailService = new EmailService()
    const weeklyRecapService = new WeeklyRecapService()

    const dataset = await weeklyRecapService.buildDataset()

    if (this.email) {
      await this.sendPreview(emailService, weeklyRecapService, dataset, this.email)
      this.logger.info('Weekly recap preview sent.')
      return
    }

    const recipients = await this.fetchContactsFromBrevo()
    if (recipients.length === 0) {
      this.logger.info('No recipients found for the weekly recap.')
      return
    }

    if (this.limit && recipients.length > this.limit) {
      this.logger.info(
        `Applying limit: processing first ${this.limit} contacts out of ${recipients.length} fetched`
      )
    }

    const limitedRecipients = this.limit ? recipients.slice(0, this.limit) : recipients

    this.logger.info(
      `Preparing weekly recap for ${limitedRecipients.length} recipient${limitedRecipients.length > 1 ? 's' : ''}`
    )

    let successCount = 0
    let failureCount = 0
    const actionVerb = this.sendLater ? 'Queued' : 'Sent'

    for (const recipient of limitedRecipients) {
      try {
        const payload = weeklyRecapService.buildPayload(recipient, dataset)
        await emailService.send(EmailTemplate.WeeklyRecap, payload, {
          sendLater: this.sendLater,
        })
        successCount++
        this.logger.info(`${actionVerb} recap for ${recipient.email}`)
      } catch (error) {
        failureCount++
        this.logger.error(
          {
            err: error,
            email: recipient.email,
          },
          `Failed to send weekly recap to ${recipient.email}`
        )
      }
    }

    this.logger.info(
      `Weekly recap complete: ${successCount} succeeded, ${failureCount} failed.`
    )
  }

  private async fetchContactsFromBrevo() {
    const listId = Number(env.get('BREVO_CONTACT_LIST_ID'))
    if (Number.isNaN(listId)) {
      throw new Error('Environment variable BREVO_CONTACT_LIST_ID must be a valid number')
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

    this.logger.info(`Fetched ${recipients.length} contacts from Brevo list ${listId}.`)

    return recipients
  }

  private handleFailure(error: unknown) {
    if (error instanceof AggregateError) {
      error.errors.forEach((innerError) => {
        this.logger.error(innerError)
      })
    } else {
      this.logger.error(error)
    }

    this.exitCode = 1
  }

  private async sendPreview(
    emailService: EmailService,
    weeklyRecapService: WeeklyRecapService,
    dataset: Awaited<ReturnType<WeeklyRecapService['buildDataset']>>,
    email: string
  ) {
    const payload = weeklyRecapService.buildPayload(
      {
        email,
        fullName: email,
        username: email,
      },
      dataset
    )

    await emailService.send(EmailTemplate.WeeklyRecap, payload, {
      sendLater: this.sendLater,
    })
  }
}
