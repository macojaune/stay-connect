import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'
import WeeklyRecapService from '#services/weekly_recap_service'
import EmailService, { EmailTemplate } from '#services/email_service'

export default class SendWeeklyRecap extends BaseCommand {
  static commandName = 'email:weekly-recap'
  static description = 'Send the weekly recap email to confirmed users'

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

    const recipientsQuery = User.query().whereNotNull('confirmed_at')

    if (this.limit) {
      recipientsQuery.limit(this.limit)
    }

    const recipients = await recipientsQuery

    if (recipients.length === 0) {
      this.logger.info('No recipients found for the weekly recap.')
      return
    }

    this.logger.info(
      `Preparing weekly recap for ${recipients.length} recipient${recipients.length > 1 ? 's' : ''}`
    )

    let successCount = 0
    let failureCount = 0
    const actionVerb = this.sendLater ? 'Queued' : 'Sent'

    for (const recipient of recipients) {
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
      },
      dataset
    )

    await emailService.send(EmailTemplate.WeeklyRecap, payload, {
      sendLater: this.sendLater,
    })
  }
}
