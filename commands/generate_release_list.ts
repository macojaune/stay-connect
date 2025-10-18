/**
 * AdonisJS Ace Command : generate_release_list
 * Génère un extrait HTML formaté, random, des sorties musicales de la semaine ou du jour, pour mailing/newsletter.
 * Usage : node ace generate_release_list [--period=day|week] [--number=3]
 */
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { execSync } from 'node:child_process'
import ReleaseExcerptService from '#services/release_excerpt_service'

type Period = 'week' | 'day'

export default class GenerateReleaseList extends BaseCommand {
  static commandName = 'generate_release_list'
  static description = 'Génère une liste HTML random de sorties musicales pour newsletter/email (jour/semaine, n=3 par défaut).'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: false,
  }

  @flags.number({ alias: 'n', description: 'Combien de sorties afficher', default: 3 })
  declare number: number

  @flags.string({ alias: 'p', description: 'Période à cibler ("day" ou "week")', default: 'week' })
  declare period: Period

  @flags.boolean({ description: 'Copier le HTML dans le presse-papier' })
  declare copy: boolean

  public async run() {
    const excerptService = new ReleaseExcerptService()

    try {
      const { html } = await excerptService.generate({
        period: this.period,
        number: this.number,
        sort: 'random',
        includeLinks: false,
      })

      console.log(html)

      if (this.copy) {
        try {
          this.copyToClipboard(html)
          this.logger.info('HTML copié dans le presse-papiers ✅')
        } catch (e) {
          this.logger.warning('Impossible de copier dans le presse-papiers: ' + (e as Error).message)
        }
      }
    } catch (err) {
      this.logger.fatal('Erreur lors de la récupération des releases : ' + err)
      return
    }
  }

  private copyToClipboard(text: string) {
    const platform = process.platform
    if (platform === 'darwin') {
      execSync('pbcopy', { input: text })
      return
    }
    if (platform === 'win32') {
      execSync('clip', { input: text })
      return
    }
    // Try xclip or xsel on Linux/others
    try {
      execSync('xclip -selection clipboard', { input: text })
    } catch {
      execSync('xsel --clipboard --input', { input: text })
    }
  }
}
