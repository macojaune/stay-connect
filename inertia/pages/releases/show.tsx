import React, { useEffect, useMemo, useState } from 'react'
import AppLayout from '~/layouts/AppLayout'
import { Head, Link } from '@inertiajs/react'
import { Copy, Link2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import {
  AppleMusicLogo,
  DeezerLogo,
  SoundcloudLogo,
  SpotifyLogo,
  TidalLogo,
  YoutubeLogo,
} from '~/components/icons/StreamingPlatformIcons'
import {
  LinkedinIcon,
  LinkedinShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from 'react-share'

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
      releaseCount?: number | string | null
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
      releaseCount?: number | string | null
      profilePicture?: string | null
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

type ShareButtonConfig = {
  key: string
  label: string
  Button: React.ComponentType<React.PropsWithChildren<Record<string, unknown>>>
  Icon: React.ComponentType<{ size?: number; round?: boolean; borderRadius?: number }>
  buttonProps?: Record<string, unknown>
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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
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

  const relatedArtists = useMemo(() => {
    const normalizeReleaseCount = (
      value: number | string | null | undefined
    ): number | null => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value
      }
      if (typeof value === 'string') {
        const parsed = Number.parseInt(value, 10)
        return Number.isFinite(parsed) ? parsed : null
      }
      return null
    }

    const artists: Array<{
      id: string | null | undefined
      name: string
      picture?: string | null
      releaseCount: number | null
    }> = []

    if (release.artist?.name) {
      const primaryCount = normalizeReleaseCount(release.artist.releaseCount)

      artists.push({
        id: release.artist.id,
        name: release.artist.name,
        picture: release.artist.profilePicture,
        releaseCount: primaryCount,
      })
    }

    release.featuredArtists.forEach((artist) => {
      if (!artist.artistName) {
        return
      }
      const alreadyAdded = artists.some(
        (entry) => entry.id && artist.artistId && entry.id === artist.artistId
      )
      if (alreadyAdded) {
        return
      }

      const featuredCount = normalizeReleaseCount(artist.releaseCount)

      artists.push({
        id: artist.artistId,
        name: artist.artistName ?? 'Artiste invité',
        picture: artist.profilePicture ?? null,
        releaseCount: featuredCount,
      })
    })

    return artists
  }, [release.artist, release.featuredArtists])

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

  const shareTitle = useMemo(() => {
    const parts = [release.title, release.artist?.name].filter(Boolean)
    return parts.join(' · ')
  }, [release.artist?.name, release.title])

  const shareMessage = useMemo(
    () => `Découvre "${release.title}" sur #StayConnect`,
    [release.title]
  )

  const seoDescription = useMemo(() => {
    const raw = release.description?.replace(/\s+/g, ' ').trim() ?? ''
    const base = raw.length > 0 ? raw : shareMessage

    if (base.length <= 160) {
      return base
    }

    return `${base.slice(0, 157).trimEnd()}…`
  }, [release.description, shareMessage])

  const shareButtons = useMemo<ShareButtonConfig[]>(
    () => [
      {
        key: 'twitter',
        label: 'X',
        Button: TwitterShareButton,
        Icon: TwitterIcon,
        buttonProps: { title: shareMessage, hashtags: ['StayConnect'] },
      },
      {
        key: 'whatsapp',
        label: 'WhatsApp',
        Button: WhatsappShareButton,
        Icon: WhatsappIcon,
        buttonProps: { title: shareMessage, separator: ' – ' },
      },
      {
        key: 'linkedin',
        label: 'LinkedIn',
        Button: LinkedinShareButton,
        Icon: LinkedinIcon,
        buttonProps: { title: shareTitle, summary: shareMessage, source: 'StayConnect' },
      },
    ],
    [shareMessage, shareTitle]
  )

  const ogImage = release.cover ?? null
  const twitterCardType = ogImage ? 'summary_large_image' : 'summary'

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    } finally {
      setTimeout(() => setCopyStatus('idle'), 3000)
    }
  }

  const subtitleParts = [
    release.artist?.name ?? 'Artiste inconnu',
    formattedDate ? `Sortie le ${formattedDate}` : null,
    release.type ? release.type.charAt(0).toUpperCase() + release.type.slice(1) : null,
  ].filter(Boolean)

  return (
    <AppLayout>
      <Head title={shareTitle}>
        <meta name="description" content={seoDescription} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}
        <meta name="twitter:card" content={twitterCardType} />
        <meta name="twitter:title" content={shareTitle} />
        <meta name="twitter:description" content={seoDescription} />
        {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
        <meta name="twitter:url" content={shareUrl} />
        <link rel="canonical" href={shareUrl} />
      </Head>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-dark transition-colors"
          >
            <span aria-hidden="true">←</span> Retour à l'accueil
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_240px] items-start">
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

              <div className="flex flex-col gap-6 p-6 md:py-8 md:pr-10 md:min-h-full">
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
                            </TooltipContent>
                          </Tooltip>
                        )
                      })}

                      {extraLinks.length > 0 &&
                        showMorePlatforms &&
                        extraLinks.map((link) => {
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
                                  onClick={() => setShowMorePlatforms(false)}
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
                              </TooltipContent>
                            </Tooltip>
                          )
                        })}

                      {extraLinks.length > 0 && !showMorePlatforms && (
                        <button
                          type="button"
                          onClick={() => setShowMorePlatforms(true)}
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
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </article>

          <aside className="bg-white rounded-3xl shadow-lg border border-zinc-100 overflow-hidden md:py-8">
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-brand/40 bg-brand/10 p-6 text-center mx-6">
              <div
                className="absolute inset-0 bg-gradient-to-br from-brand/40 via-white/40 to-brand-dark/40 blur-xl opacity-60"
                aria-hidden="true"
              />
              <div className="relative space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">
                  Votes
                </h2>
                <p className="text-sm text-zinc-600 leading-relaxed">
                  Ici prochainement tu pourras voter pour cette sortie.
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <p className="text-center text-xs font-semibold uppercase tracking-wide text-brand">
                Partager
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {shareButtons.map((config) => {
                  const ButtonComponent = config.Button
                  const IconComponent = config.Icon

                  return (
                    <ButtonComponent
                      key={config.key}
                      url={shareUrl}
                      {...config.buttonProps}
                      className="group inline-flex items-center justify-center focus:outline-none"
                      aria-label={`Partager sur ${config.label}`}
                    >
                      <span className="inline-flex  items-center justify-center rounded-full border border-brand/20 bg-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                        <IconComponent size={44} round />
                      </span>
                    </ButtonComponent>
                  )
                })}
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="group inline-flex items-center justify-center focus:outline-none"
                  aria-label="Copier le lien"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-brand/20 bg-white shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
                    <Copy className="h-5 w-5" />
                  </span>
                </button>
              </div>
              {(copyStatus === 'copied' || copyStatus === 'error') && (
                <div className="min-h-[18px] text-center text-[11px] font-medium">
                  {copyStatus === 'copied' && <span className="text-green-600">Lien copié ✅</span>}
                  {copyStatus === 'error' && (
                    <span className="text-red-600">Impossible de copier, réessaie.</span>
                  )}
                </div>
              )}
            </div>
          </aside>

        </div>



        {relatedArtists.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-xl font-semibold text-zinc-900 text-start">Artistes liés</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArtists.map((artist) => {
                const href = artist.id ? `/artists/${artist.id}` : '/artists/bientot'

                return (
                  <Tooltip key={`${artist.id ?? artist.name}`}>
                    <TooltipTrigger asChild>
                      <Link
                        href={href}
                        onClick={(event) => event.preventDefault()}
                        aria-disabled="true"
                        className="group relative flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-default"
                      >
                        <div className="relative h-14 w-14 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                          {artist.picture ? (
                            <img
                              src={artist.picture}
                              alt={artist.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-brand">
                              {artist.name[0]?.toUpperCase() ?? '?'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">{artist.name}</p>
                          {artist.releaseCount !== null && artist.releaseCount !== undefined && (
                            <p className="text-xs text-zinc-500">
                              {artist.releaseCount === 1
                                ? '1 sortie'
                                : `${artist.releaseCount} sorties`}
                            </p>
                          )}
                        </div>
                        <span className="pointer-events-none absolute inset-0 rounded-2xl border border-transparent transition group-hover:border-brand/40" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[220px] text-sm">
                        Bientôt tu pourras découvrir sa page artiste complète.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </section>
        )}

        <section className="bg-white rounded-3xl shadow-lg border border-zinc-100 overflow-hidden">
          <div className="relative px-6 py-10">
            <div
              className="absolute inset-0 bg-gradient-to-br from-brand/20 via-white to-brand-dark/30 blur-xl opacity-60"
              aria-hidden="true"
            />
            <div className="relative space-y-3 text-center">
              <h2 className="text-xl text-center font-semibold text-zinc-900">Description</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Prochainement l'artiste et son équipe pourront ajouter une description du
                projet en détail, les crédits et les informations de production.
              </p>
            </div>
          </div>
        </section>

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

        <section className="bg-white rounded-3xl shadow-lg border border-zinc-100 overflow-hidden">
          <div className="relative px-6 py-10">
            <div
              className="absolute inset-0 bg-gradient-to-br from-zinc-200 via-white to-brand/40 blur-xl opacity-60"
              aria-hidden="true"
            />
            <div className="relative space-y-3 text-center">
              <h2 className="text-xl font-semibold text-zinc-900">Commentaires & avis</h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                Ici prochainement tu pourras partager tes retours et donner ton avis.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  )
}

export default ReleaseShow
