import env from '#start/env'
import { createLeadValidator } from '#validators/newsletter'
import type { HttpContext } from '@adonisjs/core/http'
import { ContactsApi, ContactsApiApiKeys } from '@getbrevo/brevo'
import logger from '@adonisjs/core/services/logger'
import Release from '#models/release'
import Artist from '#models/artist'
import { DateTime } from 'luxon'

export default class HomeController {
  async index({ inertia, session }: HttpContext) {
    // Get releases from the last 4 weeks and next week
    const now = DateTime.now()
    const fourWeeksAgo = now.minus({ weeks: 4 })
    const nextWeek = now.plus({ weeks: 1 })

    const releases = await this.withDbRetry(
      'home_releases',
      () =>
        Release.query()
          .where('date', '>=', fourWeeksAgo.toSQL())
          .where('date', '<=', nextWeek.toSQL())
          .where('is_secret', false)
          .preload('artist')
          .preload('categories')
          .preload('features')
          .orderBy('date', 'desc'),
      []
    )

    const allArtists = await this.withDbRetry(
      'home_artists',
      () => Artist.query().select('name'),
      []
    )

    // Shuffle the artists array and take first 30
    const shuffledArtists = allArtists.sort(() => Math.random() - 0.5).slice(0, 30)

    // Get total artist count for the "et X autres" text
    const totalArtistCount = await this.withDbRetry(
      'home_artist_total_count',
      () => Artist.query().count('* as total'),
      []
    )
    const parsedTotalArtistCount = Number(totalArtistCount[0]?.$extras?.total ?? 0)
    const remainingArtists = Math.max(
      0,
      (Number.isFinite(parsedTotalArtistCount) ? parsedTotalArtistCount : 0) - 30
    )

    // Group releases by week
    const groupedReleases = this.groupReleasesByWeek(releases, now)

    // Get flashed errors and old input from session
    const errors = session.flashMessages.get('errors', undefined)
    const old = session.flashMessages.get('old', {})

    return inertia.render(
      'home',
      {
        timelineData: groupedReleases,
        artists: shuffledArtists.map((artist) => artist.name),
        remainingArtistsCount: remainingArtists,
        errors,
        old,
      },
      { title: 'Accueil' }
    )
  }

  private isTransientDbError(error: unknown): boolean {
    const message = (error as Error)?.message ?? ''
    const code = (error as { code?: string })?.code ?? ''

    const transientMessages = [
      'Connection terminated unexpectedly',
      'Connection ended unexpectedly',
      'Connection terminated',
      'Connection ended',
      'read ECONNRESET',
      'socket hang up',
      'ETIMEDOUT',
    ]

    const transientCodes = new Set(['ECONNRESET', 'ETIMEDOUT', '57P01', '57P02', '57P03'])

    return transientCodes.has(code) || transientMessages.some((entry) => message.includes(entry))
  }

  private async withDbRetry<T>(
    operation: string,
    execute: () => Promise<T>,
    fallbackValue: T,
    maxAttempts = 3
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await execute()
      } catch (error) {
        const canRetry = this.isTransientDbError(error) && attempt < maxAttempts

        if (!canRetry) {
          logger.error(
            {
              operation,
              attempt,
              maxAttempts,
              message: (error as Error)?.message,
              code: (error as { code?: string })?.code,
            },
            'Database operation failed'
          )
          return fallbackValue
        }

        const waitTimeMs = attempt * 150
        logger.warn(
          {
            operation,
            attempt,
            maxAttempts,
            waitTimeMs,
            message: (error as Error)?.message,
            code: (error as { code?: string })?.code,
          },
          'Transient database error detected, retrying operation'
        )

        await new Promise((resolve) => setTimeout(resolve, waitTimeMs))
      }
    }

    return fallbackValue
  }

  private groupReleasesByWeek(releases: Release[], now: DateTime) {
    const groups: { [key: string]: any } = {}

    releases.forEach((release) => {
      const releaseDate = DateTime.fromJSDate(release.date.toJSDate())
      const weekStart = releaseDate.startOf('week')
      const weekKey = weekStart.toISODate() || now.toISODate()

      if (!groups?.[weekKey!]) {
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

        groups[weekKey!] = {
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
        slug: release.slug,
        artist: release.artist?.name || 'Artiste inconnu',
        date: this.formatReleaseDate(DateTime.fromJSDate(release.date.toJSDate()), now),
        type: release.type || 'release',
        category: release.categories?.[0]?.name || 'Musique',
        imageUrl: release.cover,
        featuredArtists: release.features.map(
          (feature) => feature.artistName || feature.artist?.name || 'Artiste inconnu'
        ),
      }

      groups[weekKey!].news.push(newsItem)
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

    const currentWeekStart = now.startOf('week')
    const previousWeekStart = now.minus({ weeks: 1 }).startOf('week')

    const findGroupByWeekStart = (weekStart: DateTime) =>
      sortedGroups.find((group: any) => group.weekStart === weekStart.toISODate())

    const limitedSections = []
    const upcomingSection = findGroupByWeekStart(nextWeekStart)

    limitedSections.push({
      ...(upcomingSection ?? {
        news: [],
        weekStart: nextWeekStart.toISODate(),
      }),
      title: 'À venir',
      subtitle: upcomingSection?.subtitle ?? 'Inscris-toi pour voir les sorties en avance',
      isUpcoming: true,
    })

    const currentWeekSection = findGroupByWeekStart(currentWeekStart)
    if (currentWeekSection) {
      limitedSections.push({
        ...currentWeekSection,
        title: 'Cette semaine',
        subtitle: currentWeekSection.subtitle || 'Les sorties de la semaine',
      })
    } else {
      limitedSections.push({
        title: 'Cette semaine',
        subtitle: 'Les sorties de la semaine',
        isUpcoming: false,
        news: [],
        weekStart: currentWeekStart.toISODate(),
      })
    }

    const previousWeekSection = findGroupByWeekStart(previousWeekStart)
    if (previousWeekSection && previousWeekSection.news.length > 0) {
      limitedSections.push({
        ...previousWeekSection,
        title: 'La semaine passée',
      })
    }

    return limitedSections
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

  async subscribe({ request, response, session }: HttpContext) {
    const data = request.all()
    const [errors, payload] = await createLeadValidator.tryValidate(data)
    let errorMessage = ''
    if (!errors && payload) {
      const contactsApi = new ContactsApi()
      contactsApi.setApiKey(ContactsApiApiKeys.apiKey, env.get('BREVO_API_KEY'))
      try {
        await contactsApi.createContact({
          email: payload?.email,
          listIds: [3],
          attributes: {
            IS_ARTIST: payload.type === 'artist' ? 'true' : 'false',
            ARTIST_NAME: payload.artistName,
            ROLE: payload.role,
            USERNAME: payload.username,
          },
        } as any)
      } catch (e) {
        errorMessage =
          "Une erreur est survenue lors de l'enregistrement de ton inscription : " +
          e.response.body.message
        session.flash('errors', errorMessage)
        session.flash('old', payload)
        return response.redirect().toRoute('home')
      }
    } else {
      const validationMessages = errors.messages as Array<{ field: string; message: string }>
      const reducedErrors = validationMessages.reduce((acc: Record<string, string>, curr) => {
        acc[curr.field] = curr.message
        return acc
      }, {})
      session.flash('errors', reducedErrors)
    }

    return response.redirect().toRoute('/')
  }
}
