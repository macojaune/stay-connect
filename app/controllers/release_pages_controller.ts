import Release from '#models/release'
import type { HttpContext } from '@adonisjs/core/http'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const looksLikeUuid = (value: string): boolean => UUID_REGEX.test(value)

export default class ReleasePagesController {
  public async show({ params, inertia, request, response }: HttpContext) {
    const releaseQuery = Release.query()
      .preload('artist')
      .preload('categories')
      .preload('features', (featureQuery) => featureQuery.preload('artist'))

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
          artist: release.artist,
          categories: release.categories,
          featuredArtists: release.features.map((feature) => ({
            id: feature.id,
            artistName: feature.artistName || feature.artist?.name,
            artistId: feature.artistId,
          })),
        },
        shareUrl,
      },
      {
        title: `${release.title} · ${release.artist?.name ?? 'Sortie'}`,
      }
    )
  }
}
