import Artist from '#models/artist'
import Release from '#models/release'
import { renderPage } from '#services/inertia_page'
import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import type {
  ArtistCredit,
  ArtistDirectorySort,
  ArtistIndexProps,
  ArtistReleasePreview,
  ArtistShowProps,
} from '#contracts/artists'

const PER_PAGE = 24
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// EXISTS counts a release once, even when an artist has several feature credits.
const PUBLIC_ARTIST_RELEASES = `
  from releases
  where releases.is_secret = false
    and (releases.artist_id = artists.id or exists (
      select 1 from features
      where features.release_id = releases.id and features.artist_id = artists.id
    ))
`

function pageNumber(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value) : value
  return typeof parsed === 'number' && Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(parsed, 10000)
    : 1
}

function serializeRelease(release: Release): ArtistReleasePreview {
  return {
    id: release.id,
    title: release.title,
    slug: release.slug,
    date: release.date?.toISO() ?? null,
    type: release.type,
    cover: release.cover,
  }
}

function publicLinks(value: unknown): { label: string; url: string }[] {
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      return publicLinks(parsed)
    } catch {
      return []
    }
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return []

  const labels: Record<string, string> = {
    spotify: 'Spotify',
    instagram: 'Instagram',
    youtube: 'YouTube',
    soundcloud: 'SoundCloud',
    facebook: 'Facebook',
    tiktok: 'TikTok',
    twitter: 'X / Twitter',
    website: 'Site officiel',
    apple_music: 'Apple Music',
    deezer: 'Deezer',
  }
  const links: { label: string; url: string }[] = []
  const seen = new Set<string>()
  for (const [platform, address] of Object.entries(value)) {
    if (typeof address !== 'string') continue
    try {
      const url = new URL(address)
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue
      if (seen.has(url.href)) continue
      seen.add(url.href)
      links.push({ label: labels[platform.toLowerCase()] ?? url.hostname, url: url.href })
    } catch {
      // Historical social data may contain a handle instead of a usable URL.
    }
  }
  return links
}

export default class ArtistPagesController {
  async index(ctx: HttpContext) {
    const { session, request, response } = ctx
    const rawSearch: unknown = request.input('q')
    const q = typeof rawSearch === 'string' ? rawSearch.trim().slice(0, 120) : ''
    const sort: ArtistDirectorySort = request.input('sort') === 'recent' ? 'recent' : 'name'
    const page = pageNumber(request.input('page'))
    const query = Artist.query()
      .select('artists.*')
      .select(db.raw(`(select count(*) ${PUBLIC_ARTIST_RELEASES}) as release_count`))
      .select(
        db.raw(`(select max(releases.date) ${PUBLIC_ARTIST_RELEASES}) as latest_release_date`)
      )
      .preload('releases', (releaseQuery) => {
        releaseQuery.where('is_secret', false).groupOrderBy('date', 'desc').groupLimit(1)
      })
      .preload('featured', (releaseQuery) => {
        releaseQuery.where('is_secret', false).groupOrderBy('releases.date', 'desc').groupLimit(1)
      })

    if (q) query.whereILike('artists.name', `%${q.replace(/[\\%_]/g, '\\$&')}%`)
    if (sort === 'recent') query.orderByRaw('latest_release_date desc nulls last')
    query.orderBy('artists.name', 'asc').orderBy('artists.id', 'asc')

    const artists = await query.paginate(page, PER_PAGE)
    const lastPage = Math.max(1, artists.lastPage)
    if (page > lastPage) {
      const search = new URLSearchParams({ q, sort, page: String(lastPage) })
      return response.redirect().toPath(`/artistes?${search}`)
    }
    const success: unknown = session.flashMessages.get('success')
    const props: ArtistIndexProps = {
      artists: artists.all().map((artist) => {
        const latestRelease = [...artist.releases, ...artist.featured].sort(
          (first, second) => (second.date?.toMillis() ?? 0) - (first.date?.toMillis() ?? 0)
        )[0]
        return {
          id: artist.id,
          name: artist.name,
          profilePicture: artist.profilePicture,
          releaseCount: artist.releaseCount ?? 0,
          latestRelease: latestRelease ? serializeRelease(latestRelease) : null,
        }
      }),
      filters: { q, sort },
      pagination: { page, perPage: PER_PAGE, total: artists.total, lastPage },
      flash: { success: typeof success === 'string' ? success : undefined },
    }
    return renderPage(ctx, 'artists/index', props, 'Les artistes')
  }

  async show({ params, inertia, response, request }: HttpContext) {
    const id: unknown = params.id
    const artist =
      typeof id === 'string' && UUID.test(id)
        ? await Artist.query().where('id', id).preload('categories').first()
        : null

    if (!artist) {
      response.status(404)
      return inertia.render('errors/not_found', {
        title: 'Artiste introuvable',
        message: 'Cette fiche n’est pas disponible. Retrouve les artistes depuis le répertoire.',
      })
    }

    const page = pageNumber(request.input('page'))
    const releases = await Release.query()
      .where('is_secret', false)
      .where((query) => {
        query.where('artist_id', artist.id).orWhereHas('features', (features) => {
          features.where('artist_id', artist.id)
        })
      })
      .preload('artist')
      .preload('features', (features) => features.preload('artist'))
      .orderBy('date', 'desc')
      .orderBy('id', 'asc')
      .paginate(page, PER_PAGE)
    const lastPage = Math.max(1, releases.lastPage)
    if (page > lastPage) {
      return response.redirect().toPath(`/artistes/${artist.id}?page=${lastPage}#sorties`)
    }

    const links = publicLinks(artist.socials)
    if (
      artist.spotifyId &&
      !links.some((link) => new URL(link.url).hostname === 'open.spotify.com')
    ) {
      links.unshift({
        label: 'Spotify',
        url: `https://open.spotify.com/artist/${encodeURIComponent(artist.spotifyId)}`,
      })
    }

    const props: ArtistShowProps = {
      artist: {
        id: artist.id,
        name: artist.name,
        description: artist.description?.trim() || null,
        profilePicture: artist.profilePicture,
        categories: artist.categories.map((category) => ({ id: category.id, name: category.name })),
        links,
      },
      releases: releases.all().map((release) => {
        const featuredArtists: ArtistCredit[] = []
        const seen = new Set<string>()
        for (const feature of release.features) {
          const name = feature.artist?.name?.trim() || feature.artistName?.trim()
          if (!name || feature.artistId === release.artistId) continue
          const key = feature.artistId ?? name.toLocaleLowerCase('fr')
          if (seen.has(key)) continue
          seen.add(key)
          featuredArtists.push({ id: feature.artistId, name })
        }
        return {
          ...serializeRelease(release),
          artist: release.artist ? { id: release.artist.id, name: release.artist.name } : null,
          featuredArtists,
          role: release.artistId === artist.id ? 'main' : 'featured',
        }
      }),
      pagination: { page, perPage: PER_PAGE, total: releases.total, lastPage },
    }
    return inertia.render('artists/show', props, { title: artist.name })
  }
}
