import env from '#start/env'
import { createLeadValidator } from '#validators/newsletter'
import type { HttpContext } from '@adonisjs/core/http'
import { ContactsApi, ContactsApiApiKeys } from '@getbrevo/brevo'
import Release from '#models/release'
import Artist from '#models/artist'
import { DateTime } from 'luxon'

export default class HomeController {
  async index({ inertia }: HttpContext) {
    // Get releases from the last 4 weeks and next week
    const now = DateTime.now()
    const fourWeeksAgo = now.minus({ weeks: 4 })
    const nextWeek = now.plus({ weeks: 1 })

    const releases = await Release.query()
      .where('date', '>=', fourWeeksAgo.toSQL())
      .where('date', '<=', nextWeek.toSQL())
      .where('isSecret', false)
      .preload('artist')
      .preload('categories')
      .orderBy('date', 'desc')

    // Get artists for the tag list (limit to 30)
    const allArtists = await Artist.query().select('name')

    // Shuffle the artists array and take first 30
    const shuffledArtists = allArtists.sort(() => Math.random() - 0.5).slice(0, 30)

    // Get total artist count for the "et X autres" text
    const totalArtistCount = await Artist.query().count('* as total')
    const remainingArtists = Math.max(0, Number(totalArtistCount[0].$extras.total) - 30)

    // Group releases by week
    const groupedReleases = this.groupReleasesByWeek(releases, now)

    return inertia.render(
      'home',
      {
        errors: undefined,
        timelineData: groupedReleases,
        artists: shuffledArtists.map((artist) => artist.name),
        remainingArtistsCount: remainingArtists,
      },
      { page: { title: 'Accueil' } }
    )
  }

  private groupReleasesByWeek(releases: Release[], now: DateTime) {
    const groups: { [key: string]: any } = {}

    releases.forEach((release) => {
      const releaseDate = DateTime.fromJSDate(release.date.toJSDate())
      const weekStart = releaseDate.startOf('week')
      const weekKey = weekStart.toISODate()

      if (!groups[weekKey]) {
        const isThisWeek = weekStart.hasSame(now.startOf('week'), 'day')
        const isNextWeek = weekStart.hasSame(now.plus({ weeks: 1 }).startOf('week'), 'day')
        const isPastWeek = weekStart < now.startOf('week')

        let title = ''
        let subtitle = ''
        let isUpcoming = false

        if (isNextWeek) {
          title = 'La semaine prochaine'
          subtitle = 'À venir'
          isUpcoming = true
        } else if (isThisWeek) {
          title = 'Cette semaine'
          subtitle = 'Les sorties de la semaine'
        } else if (isPastWeek) {
          const weeksAgo = Math.floor(now.startOf('week').diff(weekStart, 'weeks').weeks)
          if (weeksAgo === 1) {
            title = 'La semaine passée'
          } else {
            title = `Il y a ${weeksAgo} semaines`
          }
          subtitle = 'Retour sur les temps forts'
        }

        groups[weekKey] = {
          title,
          subtitle,
          isUpcoming,
          news: [],
          weekStart: weekStart.toISODate(),
        }
      }

      // Transform release to news item format
      const newsItem = {
        id: release.id,
        title: release.title,
        artist: release.artist?.name || 'Artiste inconnu',
        date: this.formatReleaseDate(DateTime.fromJSDate(release.date.toJSDate()), now),
        type: release.type || 'release',
        category: release.categories?.[0]?.name || 'Musique',
        imageUrl: release.cover,
      }

      groups[weekKey].news.push(newsItem)
    })

    // Convert to array and sort by week
    const sortedGroups = Object.values(groups).sort((a: any, b: any) => {
      return DateTime.fromISO(b.weekStart).toMillis() - DateTime.fromISO(a.weekStart).toMillis()
    })

    // Add placeholder for next week if no releases
    const nextWeekStart = now.plus({ weeks: 1 }).startOf('week')
    const hasNextWeek = sortedGroups.some(
      (group: any) => group.weekStart === nextWeekStart.toISODate()
    )

    if (!hasNextWeek) {
      sortedGroups.unshift({
        title: 'À venir',
        subtitle: 'Inscris-toi pour voir les sorties en avance',
        isUpcoming: true,
        news: [],
        weekStart: nextWeekStart.toISODate(),
      })
    }

    return sortedGroups
  }

  private formatReleaseDate(releaseDate: DateTime, now: DateTime): string {
    const diffDays = Math.floor(now.diff(releaseDate, 'days').days)

    if (diffDays === 0) {
      return "Aujourd'hui"
    } else if (diffDays === 1) {
      return 'Hier'
    } else if (diffDays === -1) {
      return 'Demain'
    } else if (diffDays > 0) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    } else {
      return `Dans ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`
    }
  }

  async subscribe({ inertia, request }: HttpContext) {
    const data = request.all()
    const [errors, payload] = await createLeadValidator.tryValidate(data)
    if (!errors) {
      const contactsApi = new ContactsApi()
      contactsApi.setApiKey(ContactsApiApiKeys.apiKey, env.get('BREVO_API_KEY'))

      await contactsApi.createContact({
        email: payload?.email,
        listIds: [3],
        attributes: {
          IS_ARTIST: payload.type === 'artist',
          ARTIST_NAME: payload.artistName,
          ROLE: payload.role,
          USERNAME: payload.username,
        },
      })
    }

    return inertia.render('home', { errors: errors?.messages })
  }
}
