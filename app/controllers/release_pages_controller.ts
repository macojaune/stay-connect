import Release from '#models/release'
import Vote from '#models/vote'
import type { HttpContext } from '@adonisjs/core/http'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const looksLikeUuid = (value: string): boolean => UUID_REGEX.test(value)

export default class ReleasePagesController {
  public async show({ auth, params, inertia, request, response }: HttpContext) {
    const releaseQuery = Release.query()
      .preload('artist', (artistQuery) => {
        artistQuery.preload('categories').withCount('releases')
      })
      .preload('categories')
      .preload('votes', (votesQuery) => {
        votesQuery.preload('user').orderBy('created_at', 'desc').limit(12)
      })
      .preload('features', (featureQuery) => {
        featureQuery.preload('artist', (artistQuery) => {
          artistQuery.withCount('releases')
        })
      })

    if (looksLikeUuid(params.slug)) {
      releaseQuery.where('id', params.slug)
    } else {
      releaseQuery.where('slug', params.slug)
    }

    const release = await releaseQuery.first()

    if (!release) {
      return response.notFound({
        error: 'Release introuvable',
      })
    }

    const urlsValue = release.urls
    const parsedUrls = Array.isArray(urlsValue)
      ? urlsValue
      : (() => {
          try {
            return JSON.parse((urlsValue as unknown as string) ?? '[]')
          } catch {
            return []
          }
        })()

    const shareUrl = request.completeUrl()
    const aggregates = await Vote.query()
      .where('release_id', release.id)
      .avg('vote as average_vote')
      .count('* as total_votes')
      .first()
    const totalVotes = Number(aggregates?.$extras.total_votes ?? release.voteCount ?? 0)
    const averageVoteValue = Number(aggregates?.$extras.average_vote ?? 0)
    const averageVote =
      totalVotes > 0 && Number.isFinite(averageVoteValue)
        ? Number(averageVoteValue.toFixed(1))
        : null
    const viewerVote = auth.user
      ? await Vote.query().where('release_id', release.id).where('user_id', auth.user.id).first()
      : null

    const serializedArtist = release.artist
      ? {
          ...release.artist.serialize(),
          releaseCount: release.artist.releaseCount ?? null,
        }
      : null

    return inertia.render(
      'releases/show',
      {
        release: {
          id: release.id,
          title: release.title,
          slug: release.slug,
          description: release.description,
          date: release.date?.toISO(),
          type: release.type,
          cover: release.cover,
          spotifyId: release.spotifyId,
          urls: parsedUrls,
          artist: serializedArtist,
          categories: release.categories,
          featuredArtists: release.features
            .map((feature) => ({
              id: feature.id,
              artistName: feature.artistName?.trim() || feature.artist?.name?.trim() || null,
              artistId: feature.artistId,
              releaseCount: feature.artist?.releaseCount ?? null,
              profilePicture: feature.artist?.profilePicture ?? null,
            }))
            .filter((feature) => !!feature.artistName),
          votesSummary: {
            average: averageVote,
            total: totalVotes,
          },
          reviews: release.votes.map((vote) => ({
            id: vote.id,
            rating: vote.vote,
            comment: vote.comment,
            createdAt: vote.createdAt.toISO(),
            user: {
              id: vote.user.id,
              displayName:
                vote.user.fullName ||
                vote.user.username ||
                vote.user.email.split('@')[0] ||
                'Membre',
            },
            isCurrentUser: auth.user?.id === vote.user.id,
          })),
          currentUserVote: viewerVote
            ? {
                id: viewerVote.id,
                rating: viewerVote.vote,
                comment: viewerVote.comment,
              }
            : null,
        },
        shareUrl,
      },
      {
        title: `${release.title} · ${release.artist?.name ?? 'Sortie'}`,
      }
    )
  }
}
