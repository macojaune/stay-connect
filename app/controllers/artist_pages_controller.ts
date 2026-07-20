import Artist from '#models/artist'
import type { HttpContext } from '@adonisjs/core/http'

const serializeRelease = (release: {
  id: string
  title: string
  slug: string
  date: { toISO: () => string | null } | null
  type: string
  cover: string | null
}) => ({
  id: release.id,
  title: release.title,
  slug: release.slug,
  date: release.date?.toISO() ?? null,
  type: release.type,
  cover: release.cover,
})

export default class ArtistPagesController {
  async index({ inertia, session }: HttpContext) {
    const artists = await Artist.query()
      .preload('releases', (releaseQuery) => {
        releaseQuery.where('is_secret', false).orderBy('date', 'desc').limit(1)
      })
      .withCount('releases', (releaseQuery) => releaseQuery.where('is_secret', false))
      .orderBy('name', 'asc')

    return inertia.render(
      'artists/index',
      {
        artists: artists.map((artist) => ({
          id: artist.id,
          name: artist.name,
          profilePicture: artist.profilePicture,
          releaseCount: artist.releaseCount ?? 0,
          latestRelease: artist.releases[0] ? serializeRelease(artist.releases[0]) : null,
        })),
        flash: {
          success: session.flashMessages.get('success', undefined),
        },
      },
      { title: 'Artistes' }
    )
  }

  async show({ params, inertia, response }: HttpContext) {
    const artist = await Artist.query()
      .where('id', params.id)
      .preload('categories')
      .preload('releases', (releaseQuery) => {
        releaseQuery.where('is_secret', false).orderBy('date', 'desc')
      })
      .first()

    if (!artist) {
      return response.notFound({ error: 'Artiste introuvable' })
    }

    return inertia.render(
      'artists/show',
      {
        artist: {
          id: artist.id,
          name: artist.name,
          description: artist.description,
          profilePicture: artist.profilePicture,
          socials: artist.socials,
          isVerified: artist.isVerified,
          categories: artist.categories.map((category) => ({
            id: category.id,
            name: category.name,
          })),
          releases: artist.releases.map(serializeRelease),
        },
      },
      { title: artist.name }
    )
  }
}
