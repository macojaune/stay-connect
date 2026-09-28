import Release from '#models/release'
import Vote from '#models/vote'
import type { HttpContext } from '@adonisjs/core/http'
import type { ReleaseShowProps } from '#contracts/release_page'
import { releaseTerritories } from '#services/release_territories'

function parseReleaseUrls(value: unknown): string[] {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      return parseReleaseUrls(parsed)
    } catch {
      return []
    }
  }
  if (!Array.isArray(value)) return []
  const urls: unknown[] = value
  return urls.filter((url): url is string => typeof url === 'string')
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const looksLikeUuid = (value: string): boolean => UUID_REGEX.test(value)

export default class ReleasePagesController {
  public async show({ auth, params, inertia, request, response }: HttpContext) {
    const releaseQuery = Release.query()
      .where('is_secret', false)
      .preload('artist', (artistQuery) => {
        artistQuery.preload('categories').preload('territories').withCount('releases')
      })
      .preload('categories')
      .preload('votes', (votesQuery) => {
        votesQuery.preload('user').orderBy('created_at', 'desc').limit(12)
      })
      .preload('features', (featureQuery) => {
        featureQuery.preload('artist', (artistQuery) => {
          artistQuery.preload('territories').withCount('releases')
        })
      })

    if (looksLikeUuid(params.slug)) {
      releaseQuery.where('id', params.slug)
    } else {
      releaseQuery.where('slug', params.slug)
    }

    const release = await releaseQuery.first()

    if (!release) {
      response.status(404)

      return inertia.render('errors/not_found', {
        title: 'Cette sortie n’est plus disponible',
        message:
          'La sortie que tu cherches a peut-être été retirée ou son lien a changé. Retrouve les dernières nouveautés depuis l’accueil.',
      })
    }

    const parsedUrls = parseReleaseUrls(release.urls)

    const shareUrl = request.completeUrl()
    const aggregates = await Vote.query()
      .where('release_id', release.id)
      .count('* as total_votes')
      .first()
    const totalVotes = Number(aggregates?.$extras.total_votes ?? release.voteCount ?? 0)
    const viewer = auth.use('web').user
    const viewerVote = viewer
      ? await Vote.query().where('release_id', release.id).where('user_id', viewer.id).first()
      : null

    const serializedArtist = release.artist
      ? {
          id: release.artist.id,
          name: release.artist.name,
          profilePicture: release.artist.profilePicture,
          releaseCount: release.artist.releaseCount ?? null,
        }
      : null

    const props: ReleaseShowProps = {
      release: {
        id: release.id,
        title: release.title,
        slug: release.slug,
        description: release.description,
        date: release.date.toISO(),
        type: release.type,
        cover: release.cover,
        spotifyId: release.spotifyId,
        urls: parsedUrls,
        artist: serializedArtist,
        categories: release.categories.map((category) => ({
          id: category.id,
          name: category.name,
        })),
        territories: releaseTerritories(release),
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
          total: totalVotes,
        },
        reviews: release.votes.map((vote) => ({
          id: vote.id,
          comment: vote.comment,
          createdAt: vote.createdAt.toISO(),
          user: {
            id: vote.user.id,
            displayName:
              vote.user.fullName || vote.user.username || vote.user.email.split('@')[0] || 'Membre',
          },
          isCurrentUser: viewer?.id === vote.user.id,
        })),
        currentUserVote: viewerVote
          ? {
              id: viewerVote.id,
              comment: viewerVote.comment,
            }
          : null,
      },
      shareUrl,
    }

    return inertia.render('releases/show', props, {
      title: `${release.title} · ${release.artist?.name ?? 'Sortie'}`,
    })
  }
}
