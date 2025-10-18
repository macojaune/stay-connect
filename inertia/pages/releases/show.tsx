import React, { useEffect, useMemo, useState } from 'react'
import AppLayout from '~/layouts/AppLayout'
import { Head, Link } from '@inertiajs/react'
import { Link2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import {
  AppleMusicLogo,
  DeezerLogo,
  SoundcloudLogo,
  SpotifyLogo,
  TidalLogo,
  YoutubeLogo,
} from '~/components/icons/StreamingPlatformIcons'

type ReleaseShowProps = {
  release: {
    id: string
    title: string
    slug: string
    description: string | null
    date: string | null
    type: string
    cover: string | null
    spotifyId: string | null
    urls: string[]
    artist: {
      id: string
      name: string
      profilePicture?: string | null
    } | null
    categories: Array<{
      id: string
      name: string
      slug?: string
    }>
    featuredArtists: Array<{
      id: string
      artistName?: string | null
      artistId?: string | null
    }>
  }
  shareUrl: string
}

const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '')
  const bigint = Number.parseInt(sanitized.length === 3 ? sanitized.repeat(2) : sanitized, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type StreamingLink = {
  url: string
  label: string
  domain: string
  key: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  accent: string
}

type PlatformConfig = {
  matcher: RegExp
  label: string
  key: string
  Icon: StreamingLink['Icon']
  accent: string
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  { matcher: /spotify/, label: 'Spotify', key: 'spotify', Icon: SpotifyLogo, accent: '#1DB954' },
  {
    matcher: /music\.apple\.com/,
    label: 'Apple Music',
    key: 'apple-music',
    Icon: AppleMusicLogo,
    accent: '#FA3262',
  },
  {
    matcher: /deezer\.com/,
    label: 'Deezer',
    key: 'deezer',
    Icon: DeezerLogo,
    accent: '#2D27FF',
  },
  {
    matcher: /youtube\.com|youtu\.be/,
    label: 'YouTube',
    key: 'youtube',
    Icon: YoutubeLogo,
    accent: '#FF0000',
  },
  {
    matcher: /soundcloud\.com/,
    label: 'SoundCloud',
    key: 'soundcloud',
    Icon: SoundcloudLogo,
    accent: '#FF5500',
  },
  { matcher: /tidal\.com/, label: 'Tidal', key: 'tidal', Icon: TidalLogo, accent: '#18BFFF' },
]

/*
 * Spotify embed helpers are temporarily disabled while the player is commented out.
 * Keeping the parsing logic here for future reuse when the player returns.
 */
// type SpotifyEmbedConfig = {
//   type: 'track' | 'album' | 'playlist' | 'episode' | 'show'
//   id: string
// }

// const mapReleaseTypeToSpotify = (releaseType?: string | null): SpotifyEmbedConfig['type'] => {
//   switch ((releaseType ?? '').toLowerCase()) {
//     case 'album':
//     case 'lp':
//     case 'ep':
//       return 'album'
//     case 'playlist':
//       return 'playlist'
//     case 'podcast':
//     case 'episode':
//       return 'episode'
//     default:
//       return 'track'
//   }
// }

// const SPOTIFY_ID_REGEX = /^[0-9A-Za-z]{22}$/

// const parseSpotifyId = (
//   raw: string | null,
//   releaseType?: string | null
// ): SpotifyEmbedConfig | null => {
//   if (!raw) {
//     return null
//   }

//   const trimmed = raw.trim()
//  const lower = trimmed.toLowerCase()
//  const fallbackType = mapReleaseTypeToSpotify(releaseType)

//   if (lower.startsWith('spotify:')) {
//     const parts = trimmed.split(':').filter(Boolean)
//     if (parts.length >= 3) {
//       const [, type, id] = parts
//       if (id) {
//         return {
//           type: (type as SpotifyEmbedConfig['type']) ?? fallbackType,
//           id,
//         }
//       }
//     }
//   }

//   if (lower.includes('open.spotify.com')) {
//     try {
//       const url = new URL(trimmed)
//       const segments = url.pathname.split('/').filter(Boolean)
//       if (segments.length >= 2) {
//         const [type, id] = segments
//         return {
//           type: (type as SpotifyEmbedConfig['type']) ?? fallbackType,
//           id: id.split('?')[0],
//         }
//       }
//     } catch {
//       // fall through to generic parsing
//     }
//   }

//   if (SPOTIFY_ID_REGEX.test(trimmed)) {
//     return {
//       type: fallbackType,
//       id: trimmed,
//     }
//   }

//   return null
// }

const ReleaseShow: React.FC<ReleaseShowProps> = ({ release, shareUrl }) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [showMorePlatforms, setShowMorePlatforms] = useState(false)

  const releaseDate = release.date ? new Date(release.date) : null
  const formattedDate = releaseDate
    ? releaseDate.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : null

  const streamingLinks = useMemo<StreamingLink[]>(() => {
    if (!release.urls || release.urls.length === 0) {
      return []
    }

    const seen = new Set<string>()

    const collected = release.urls.reduce<StreamingLink[]>((acc, rawUrl) => {
      if (!rawUrl) {
        return acc
      }

      try {
        const normalizedUrl = new URL(rawUrl)
        const normalizedHref = normalizedUrl.toString()
        if (seen.has(normalizedHref)) {
          return acc
        }
        seen.add(normalizedHref)

        const domain = normalizedUrl.hostname.replace('www.', '')
        const platformConfig =
          PLATFORM_CONFIGS.find((entry) => entry.matcher.test(normalizedUrl.hostname)) ?? null

        acc.push({
          url: normalizedHref,
          domain,
          label: platformConfig?.label ?? domain,
          key: platformConfig?.key ?? domain,
          Icon: platformConfig?.Icon ?? Link2,
          accent: platformConfig?.accent ?? '#3F3F46',
        })
        return acc
      } catch {
        return acc
      }
    }, [])

    const priority = new Map([
      ['spotify', 0],
      ['apple-music', 1],
      ['deezer', 2],
    ])

    return collected.sort((a, b) => {
      const rankA = priority.has(a.key) ? priority.get(a.key)! : priority.size
      const rankB = priority.has(b.key) ? priority.get(b.key)! : priority.size
      if (rankA !== rankB) {
        return rankA - rankB
      }
      return a.label.localeCompare(b.label)
    })
  }, [release.urls])

  const primaryLinks = useMemo(() => streamingLinks.slice(0, 3), [streamingLinks])
  const extraLinks = useMemo(() => streamingLinks.slice(3), [streamingLinks])

  useEffect(() => {
    if (extraLinks.length === 0) {
      setShowMorePlatforms(false)
    }
  }, [extraLinks.length])

  // const spotifyEmbedUrl = useMemo(() => {
  //   const parsed = parseSpotifyId(release.spotifyId, release.type)
  //   if (!parsed) {
  //     return null
  //   }
  //   return `https://open.spotify.com/embed/${parsed.type}/${parsed.id}`
  // }, [release.spotifyId, release.type])

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${release.title} · ${release.artist?.name ?? ''}`,
          text: `Découvre "${release.title}" sur #StayConnect`,
          url: shareUrl,
        })
        setShareStatus('idle')
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 3500)
    } catch {
      setShareStatus('error')
      setTimeout(() => setShareStatus('idle'), 3500)
    }
  }

  const subtitleParts = [
    release.artist?.name ?? 'Artiste inconnu',
    formattedDate ? `Sortie le ${formattedDate}` : null,
    release.type ? release.type.charAt(0).toUpperCase() + release.type.slice(1) : null,
  ].filter(Boolean)

  return (
    <AppLayout>
      <Head title={`${release.title} · ${release.artist?.name ?? 'Sortie musicale'}`} />
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-dark transition-colors"
          >
            <span aria-hidden="true">←</span> Retour à l'accueil
          </Link>
        </div>

        <article className="bg-white rounded-3xl shadow-lg border border-zinc-100 overflow-hidden">
          <div className="grid md:grid-cols-[280px_1fr] gap-8 md:gap-10 items-stretch">
            <div className="relative md:h-full">
              <div className="md:h-full">
                {release.cover ? (
                  <img
                    src={release.cover}
                    alt={`Couverture de ${release.title}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand/20 to-brand/40 flex items-center justify-center text-brand font-semibold text-xl">
                    {release.title[0]?.toUpperCase() ?? '#'}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-6 p-6 md:pr-10 md:py-8 md:min-h-full">
              <header className="space-y-3">
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 leading-tight">
                  {release.title}
                </h1>
                {subtitleParts.length > 0 && (
                  <p className="text-sm md:text-base text-zinc-600">{subtitleParts.join(' · ')}</p>
                )}

                {release.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {release.categories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                )}
              </header>

              {release.description && (
                <p className="text-sm md:text-base text-zinc-700 leading-relaxed whitespace-pre-line">
                  {release.description}
                </p>
              )}

              {release.featuredArtists.length > 0 && (
                <div className="text-sm text-zinc-600">
                  <span className="font-semibold text-zinc-800">Featuring :</span>{' '}
                  {release.featuredArtists
                    .map((artist) => artist.artistName ?? 'Artiste invité')
                    .join(', ')}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-full text-sm font-medium hover:bg-brand-dark transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 8.25a3 3 0 10-2.9 3.605l10.17 5.086a3 3 0 105.147-.441l-10.17-5.086a3.002 3.002 0 00-2.247-3.164z"
                    />
                  </svg>
                  Partager
                </button>
                {shareStatus === 'copied' && (
                  <span className="text-xs text-green-600 font-medium">Lien copié ✅</span>
                )}
                {shareStatus === 'error' && (
                  <span className="text-xs text-red-600 font-medium">
                    Impossible de partager, réessaie.
                  </span>
                )}
              </div>

              {streamingLinks.length > 0 && (
                <div className="mt-6 w-full flex flex-col items-center gap-3 pt-4 md:mt-auto md:w-auto md:items-end">
                  <span className="text-xs uppercase tracking-wide text-zinc-400">
                    Disponible sur
                  </span>
                  <div className="flex w-full flex-wrap items-center justify-center gap-3 md:w-auto md:justify-end">
                    {primaryLinks.map((link) => {
                      const ringStyle = {
                        boxShadow: `0 0 0 4px ${hexToRgba(link.accent, 0.25)}`,
                        borderColor: hexToRgba(link.accent, 0.4),
                      }

                      const IconComponent = link.Icon
                      const isLucideFallback = IconComponent === Link2

                      return (
                        <Tooltip key={link.url}>
                          <TooltipTrigger asChild>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Écouter sur ${link.label}`}
                              className="group inline-flex min-w-[64px] flex-col items-center justify-center gap-1"
                            >
                              <span
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                style={ringStyle}
                              >
                                <IconComponent
                                  className="h-7 w-7"
                                  {...(isLucideFallback ? { color: link.accent } : {})}
                                />
                              </span>
                              <span className="text-[11px] font-medium text-zinc-500 md:hidden">
                                {link.label}
                              </span>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{link.label}</p>
                            <p className="text-xs text-zinc-400">{link.domain}</p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}

                    {extraLinks.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowMorePlatforms((prev) => !prev)}
                          className="inline-flex min-w-[64px] flex-col items-center justify-center gap-1 text-zinc-600 transition-colors hover:text-zinc-800 focus-visible:outline-none focus-visible:ring focus-visible:ring-brand/40"
                          aria-expanded={showMorePlatforms}
                          aria-label="Voir plus de plateformes"
                        >
                          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                            <span className="text-xl font-semibold">…</span>
                          </span>
                          <span className="text-[11px] font-medium text-zinc-500 md:hidden">
                            Plus
                          </span>
                        </button>
                        <div
                          className={`flex w-full flex-wrap items-center justify-center gap-3 md:justify-end ${
                            showMorePlatforms ? '' : 'hidden'
                          }`}
                          role="region"
                          aria-hidden={!showMorePlatforms}
                        >
                          {extraLinks.map((link) => {
                              const ringStyle = {
                                boxShadow: `0 0 0 4px ${hexToRgba(link.accent, 0.25)}`,
                                borderColor: hexToRgba(link.accent, 0.4),
                              }
                              const IconComponent = link.Icon
                              const isLucideFallback = IconComponent === Link2

                              return (
                                <Tooltip key={link.url}>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      aria-label={`Écouter sur ${link.label}`}
                                      className="group inline-flex min-w-[56px] flex-col items-center justify-center gap-1"
                                      onClick={() => setShowMorePlatforms(false)}
                                    >
                                      <span
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                                        style={ringStyle}
                                      >
                                        <IconComponent
                                          className="h-6 w-6"
                                          {...(isLucideFallback ? { color: link.accent } : {})}
                                        />
                                      </span>
                                      <span className="text-[10px] font-medium text-zinc-500">
                                        {link.label}
                                      </span>
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="font-medium">{link.label}</p>
                                    <p className="text-xs text-zinc-400">{link.domain}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* TODO: Restore Spotify embed when embed issues are resolved */}
        {/* {spotifyEmbedUrl && (
          <section className="bg-zinc-900/90 rounded-3xl overflow-hidden shadow-lg border border-zinc-800">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-white mb-2">Écouter un extrait</h2>
              <p className="text-sm text-zinc-300">
                Profite d&apos;un aperçu du morceau directement depuis Spotify.
              </p>
            </div>
            <iframe
              src={spotifyEmbedUrl}
              width="100%"
              height="352"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="min-h-[200px]"
            />
          </section>
        )} */}

        {streamingLinks.length === 0 && (
          <section className="bg-white rounded-3xl shadow-lg border border-zinc-100 overflow-hidden">
            <div className="px-6 py-8 space-y-3 text-center">
              <h2 className="text-xl font-semibold text-zinc-900">Écouter sur ta plateforme</h2>
              <p className="text-sm text-zinc-500">
                Les liens de streaming seront ajoutés très bientôt. Reviens vite&nbsp;!
              </p>
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  )
}

export default ReleaseShow
