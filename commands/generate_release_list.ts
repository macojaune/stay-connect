/**
 * AdonisJS Ace Command : generate_release_list
 * Génère un extrait HTML formaté, random, des sorties musicales de la semaine ou du jour, pour mailing/newsletter.
 * Usage : node ace generate_release_list [--period=day|week] [--number=3]
 */
import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Release from '#models/release'
import { DateTime } from 'luxon'
import { execSync } from 'node:child_process'

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
    // Bornes de début et de fin selon la période choisie
    const now = DateTime.now()
    const from = this.period === 'day' ? now.startOf('day') : now.startOf('week')
    const to = this.period === 'day' ? now.endOf('day') : now.endOf('week')

    // Requête ORM
    try {
      const releases = await Release.query()
        .where('is_secret', false)
        .whereBetween('date', [from.toJSDate(), to.toJSDate()])
        .preload('artist')
        .preload('categories')
        .orderByRaw('RANDOM()')
        .limit(this.number)


      // Génération et affichage du HTML
      const html = releases.length
        ? this.htmlBlock(releases)
        : this.htmlEmptyBlock()
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

  /**
   * Bloc HTML principal (liste de cartes release)
   */
  private htmlBlock(releases: any[]): string {
    return `
<div style="max-width:630px;margin:auto;font-family:system-ui,sans-serif;">
  <h2 style="font-size:1.25em;color:#da2a63;text-align:center;font-weight:700;margin-bottom:24px;margin-top:0;">
    ${releases.length > 1 ? 'Sorties à ne pas rater :' : 'Sortie à ne pas rater'}
  </h2>
  <div style="display:flex;flex-direction:column;gap:18px;">
    ${releases.map(this.htmlCard).join('')}
  </div>
</div>
`.trim()
  }

  /**
   * Carte HTML pour une sortie unique
   */
  private htmlCard(release: any): string {
    const artist = release.artist?.name || 'Artiste inconnu'
    const cover = release.cover || 'https://cdn.stayconnect.fm/assets/img/music-default-cover.png'
    const type =
      release.type === 'single' ? 'Single' :
        release.type === 'album' ? 'Album' :
          release.type === 'event' ? 'Évent' : 'Autre'
    const date = typeof release.date?.toFormat === 'function'
      ? release.date.toFormat('dd/MM/yyyy')
      : ''
    const categories = (release.categories || []).map((c: any) => c.name).filter(Boolean).join(', ')

    return `
  <div style="background:#fff;border:1px solid #eee;border-radius:11px;padding:16px;display:flex;gap:15px;align-items:center;box-shadow:0 2px 12px #0001;">
    <div style="min-width:58px;width:58px;height:58px;border-radius:8px;overflow:hidden;box-shadow:0 1px 7px #0001;background:#f5f5f5;">
      <img src="${cover}" alt="${release.title}" style="width:100%;height:100%;object-fit:cover;"/>
    </div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:1.09em;font-weight:bold;color:#23222d;line-height:1.2;margin-bottom:6px;">
        ${artist} <span style="font-weight:normal;color:#aaa;">–</span> ${release.title}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        <span style="background:#ffeaf1;color:#da2a63;font-size:.90em;padding:.15em .75em;border-radius:99px;">${type}</span>
        ${categories
        ? `<span style="background:#f3eafc;color:#8120a3;font-size:.87em;padding:.13em .7em;border-radius:99px;">${categories}</span>`
        : ''
      }
      </div>
      <div style="margin-top:5px;font-size:.89em;color:#8F8A98;">
        Sortie le ${date}
      </div>
    </div>
  </div>
    `.trim()
  }

  /**
   * Bloc si aucune sortie trouvée
   */
  private htmlEmptyBlock(): string {
    return `
<div style="max-width:630px;margin:auto;text-align:center;font-family:system-ui,sans-serif;">
  <h2 style="font-size:1.10em;color:#da2a63;font-weight:700;margin-bottom:8px;">Aucune nouveauté cette période 🎧</h2>
  <div style="color:#8f8a98;">Sois le premier ou la première à soumettre une sortie sur stayconnect.fm !</div>
</div>
    `.trim()
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
