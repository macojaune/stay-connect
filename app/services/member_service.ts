import Vote from '#models/vote'
import Release from '#models/release'
import ArtistSuggestion from '#models/artist_suggestion'
import { DateTime } from 'luxon'
import type { SimplePaginatorContract } from '@adonisjs/lucid/types/querybuilder'
import type {
  MemberDashboardProps,
  MemberPagination,
  MemberRelease,
  MemberSuggestion,
  MemberSuggestionsProps,
} from '#contracts/member'

export function memberPage(value: unknown): number {
  if (typeof value !== 'string' && typeof value !== 'number') return 1
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 && page <= 10000 ? page : 1
}

function pagination<Result>(rows: SimplePaginatorContract<Result>): MemberPagination {
  return {
    page: rows.currentPage,
    perPage: rows.perPage,
    total: rows.total,
    lastPage: Math.max(1, rows.lastPage),
  }
}

function count(value: unknown): number {
  const number = typeof value === 'string' || typeof value === 'number' ? Number(value) : Number.NaN
  if (!Number.isSafeInteger(number) || number < 0) throw new Error('Invalid member total')
  return number
}

function releaseCard(release: Release): MemberRelease {
  return {
    id: release.id,
    slug: release.slug,
    title: release.title,
    cover: release.cover,
    date: release.date.toISODate(),
    type: release.type,
    artist: release.artist ? { id: release.artist.id, name: release.artist.name } : null,
    featuredArtists: release.features
      .map((feature) => feature.artistName || feature.artist?.name || '')
      .filter(Boolean),
    pullUpCount: release.voteCount,
  }
}

function suggestionCard(suggestion: ArtistSuggestion): MemberSuggestion {
  return {
    id: suggestion.id,
    name: suggestion.name,
    sourceUrl: suggestion.sourceUrl,
    message: suggestion.message,
    status: suggestion.status,
    createdAt: suggestion.createdAt.toISO(),
    updatedAt: suggestion.updatedAt?.toISO() ?? null,
  }
}

export default class MemberService {
  async dashboard(
    userId: string,
    displayName: string,
    page: number
  ): Promise<MemberDashboardProps> {
    const ownPullUps = () =>
      Vote.query()
        .where('user_id', userId)
        .whereHas('release', (query) => query.where('is_secret', false))
    const [pullUps, comments, suggestions, suggestionTotal, latestReleases] = await Promise.all([
      ownPullUps()
        .preload('release', (query) =>
          query.preload('artist').preload('features', (features) => features.preload('artist'))
        )
        .orderBy('created_at', 'desc')
        .orderBy('id', 'desc')
        .paginate(page, 12),
      ownPullUps()
        .whereNotNull('comment')
        .whereRaw("TRIM(comment) <> ''")
        .count('* as total')
        .first(),
      ArtistSuggestion.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .orderBy('id', 'desc')
        .limit(3),
      ArtistSuggestion.query().where('user_id', userId).count('* as total').first(),
      Release.query()
        .where('is_secret', false)
        .where('date', '<=', DateTime.utc().toSQL())
        .preload('artist')
        .preload('features', (features) => features.preload('artist'))
        .orderBy('date', 'desc')
        .orderBy('id', 'desc')
        .limit(6),
    ])

    return {
      displayName,
      stats: {
        pullUps: pullUps.total,
        comments: count(comments?.$extras.total),
        suggestions: count(suggestionTotal?.$extras.total),
      },
      pullUps: pullUps.all().map((vote) => ({
        id: vote.id,
        comment: vote.comment,
        createdAt: vote.createdAt.toISO(),
        release: releaseCard(vote.release),
      })),
      pagination: pagination(pullUps),
      suggestions: suggestions.map(suggestionCard),
      latestReleases: latestReleases.map(releaseCard),
    }
  }

  async suggestions(userId: string, page: number): Promise<MemberSuggestionsProps> {
    const rows = await ArtistSuggestion.query()
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .paginate(page, 12)
    return { suggestions: rows.all().map(suggestionCard), pagination: pagination(rows) }
  }
}
