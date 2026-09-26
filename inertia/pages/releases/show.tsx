import type { ReleaseShowProps } from '#contracts/release_page'
import type { SharedProps } from '@adonisjs/inertia/types'
import React, { useEffect, useMemo, useState } from 'react'
import EditorialLayout from '~/layouts/EditorialLayout'
import '~/css/release-editorial.css'
import { Head, Link, router, usePage } from '@inertiajs/react'
import { ArrowLeft, ArrowUpRight, Check, Copy, Link2, RotateCcw, Trash2 } from 'lucide-react'
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

type PageProps = {
  auth: SharedProps['auth']
  errors?: Record<string, string>
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
  Button: React.ComponentType<{ url: string; children: React.ReactNode; className?: string }>
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

const ReleaseShow: React.FC<ReleaseShowProps> = ({ release, shareUrl }) => {
  const { auth, errors } = usePage<PageProps>().props
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')
  const [showMorePlatforms, setShowMorePlatforms] = useState(false)
  const [voteComment, setVoteComment] = useState(release.currentUserVote?.comment ?? '')
  const [voteFeedback, setVoteFeedback] = useState<'saved' | 'removed' | null>(null)
  const [voteIsSubmitting, setVoteIsSubmitting] = useState(false)

  const releaseDate = release.date ? new Date(`${release.date.slice(0, 10)}T12:00:00`) : null
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
  const featuredArtistNames = useMemo(
    () =>
      release.featuredArtists
        .map((artist) => artist.artistName?.trim())
        .filter((artistName): artistName is string => !!artistName),
    [release.featuredArtists]
  )

  const relatedArtists = useMemo(() => {
    const normalizeReleaseCount = (value: number | string | null | undefined): number | null => {
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

  const shareTitle = useMemo(() => {
    const parts = [release.title, release.artist?.name].filter(Boolean)
    return parts.join(' · ')
  }, [release.artist?.name, release.title])

  const shareMessage = useMemo(
    () => `Découvre "${release.title}" sur #StayConnect`,
    [release.title]
  )

  const boostsCountLabel =
    release.votesSummary.total === 1 ? '1 pull-up' : `${release.votesSummary.total} pull-ups`
  const comments = release.reviews.filter((review) => Boolean(review.comment))

  const submitVote = () => {
    setVoteFeedback(null)
    const comment = voteComment.trim()
    const data = comment ? { comment } : {}
    const options = {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setVoteIsSubmitting(true),
      onSuccess: () => setVoteFeedback('saved'),
      onFinish: () => setVoteIsSubmitting(false),
    }

    if (release.currentUserVote) {
      router.put(`/sorties/${release.id}/avis`, data, options)
      return
    }

    router.post(`/sorties/${release.id}/avis`, data, options)
  }

  const removeVote = () => {
    setVoteFeedback(null)
    router.delete(`/sorties/${release.id}/avis`, {
      preserveScroll: true,
      preserveState: true,
      onStart: () => setVoteIsSubmitting(true),
      onSuccess: () => {
        setVoteComment('')
        setVoteFeedback('removed')
      },
      onFinish: () => setVoteIsSubmitting(false),
    })
  }

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

  const visibleLinks = showMorePlatforms ? streamingLinks : primaryLinks
  const voteError = errors?.vote || errors?.comment

  return (
    <EditorialLayout>
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
      <div className="sc-shell sc-release">
        <Link href="/" className="sc-release-back">
          <ArrowLeft size={18} aria-hidden="true" /> Toutes les sorties
        </Link>

        <article className="sc-release-hero">
          <header className="sc-release-heading">
            <h1>
              <span className="sc-release-title sc-display">{release.title}</span>
              <span className="sc-release-artist">
                {release.artist?.id ? (
                  <Link href={`/artistes/${release.artist.id}`}>{release.artist.name}</Link>
                ) : (
                  (release.artist?.name ?? 'Artiste inconnu')
                )}
              </span>
            </h1>
            {featuredArtistNames.length > 0 && (
              <p className="sc-release-featuring">Avec {featuredArtistNames.join(', ')}</p>
            )}
            <p className="sc-release-meta">
              {release.type && <span className="sc-release-type">{release.type}</span>}
              {formattedDate && <time dateTime={release.date!}>Sortie le {formattedDate}</time>}
            </p>
            {release.categories.length > 0 && (
              <ul className="sc-release-genres" aria-label="Genres musicaux">
                {release.categories.map((category) => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            )}
          </header>

          <div className="sc-release-artwork">
            {release.cover ? (
              <img
                src={release.cover}
                alt={`Pochette de ${release.title}`}
                width={640}
                height={640}
              />
            ) : (
              <div
                className="sc-release-cover-fallback"
                role="img"
                aria-label="Pochette indisponible"
              >
                <span className="sc-display">{release.artist?.name[0]?.toUpperCase() ?? '#'}</span>
                <span>Pochette indisponible</span>
              </div>
            )}
          </div>

          <section className="sc-release-listening" aria-labelledby="release-listening-title">
            <h2 id="release-listening-title">Écouter sur ta plateforme</h2>
            {streamingLinks.length > 0 ? (
              <>
                <div className="sc-release-platforms" id="release-platforms">
                  {visibleLinks.map((link) => {
                    const IconComponent = link.Icon
                    return (
                      <a
                        key={link.url}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sc-release-platform"
                        aria-label={`Écouter sur ${link.label}, nouvel onglet`}
                      >
                        <IconComponent className="sc-release-platform-logo" aria-hidden="true" />
                        <span>{link.label}</span>
                        <ArrowUpRight size={20} aria-hidden="true" />
                      </a>
                    )
                  })}
                </div>
                {extraLinks.length > 0 && (
                  <button
                    type="button"
                    className="sc-release-text-button"
                    onClick={() => setShowMorePlatforms(!showMorePlatforms)}
                    aria-expanded={showMorePlatforms}
                    aria-controls="release-platforms"
                  >
                    {showMorePlatforms
                      ? 'Voir moins de plateformes'
                      : extraLinks.length === 1
                        ? "Voir l'autre plateforme"
                        : `Voir les ${extraLinks.length} autres plateformes`}
                  </button>
                )}
              </>
            ) : (
              <p className="sc-muted">
                Aucun lien d'écoute n'est disponible pour cette sortie pour le moment.
              </p>
            )}
          </section>

          {release.description && <p className="sc-release-description">{release.description}</p>}
        </article>

        <section
          id="soutenir"
          className="sc-release-support"
          aria-labelledby="release-support-title"
        >
          <div className="sc-release-support-intro">
            <h2 id="release-support-title" className="sc-display">
              Soutiens cette sortie.
            </h2>
            <p className="sc-release-boost-count">
              <RotateCcw size={22} aria-hidden="true" />
              <strong>{boostsCountLabel}</strong>
            </p>
            <p>Un pull-up pour soutenir cette sortie. Un commentaire si tu veux en parler.</p>
          </div>
          <div className="sc-release-support-action">
            {auth?.user ? (
              <div className="sc-release-vote-form">
                {release.currentUserVote && (
                  <p className="sc-release-boosted">
                    <Check size={18} aria-hidden="true" /> Tu as donné un pull-up
                  </p>
                )}
                <label htmlFor="release-comment">
                  Ton commentaire <span>facultatif</span>
                </label>
                <textarea
                  id="release-comment"
                  value={voteComment}
                  onChange={(event) => setVoteComment(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Qu'est-ce qui te plaît dans cette sortie ?"
                  aria-invalid={Boolean(voteError)}
                  aria-describedby={voteError ? 'release-vote-feedback' : undefined}
                />
                <div className="sc-release-vote-actions">
                  <button
                    type="button"
                    className="sc-button"
                    disabled={voteIsSubmitting}
                    onClick={submitVote}
                  >
                    <RotateCcw size={18} aria-hidden="true" />
                    {voteIsSubmitting
                      ? 'Enregistrement…'
                      : release.currentUserVote
                        ? 'Mettre à jour mon commentaire'
                        : 'Pull-up'}
                  </button>
                  {release.currentUserVote && (
                    <button
                      type="button"
                      className="sc-release-text-button"
                      disabled={voteIsSubmitting}
                      onClick={removeVote}
                    >
                      <Trash2 size={16} aria-hidden="true" /> Retirer mon pull-up
                    </button>
                  )}
                </div>
                {(voteFeedback || voteError) && (
                  <p
                    id="release-vote-feedback"
                    className="sc-release-feedback"
                    role={voteError ? 'alert' : 'status'}
                  >
                    {voteError ||
                      (voteFeedback === 'saved' ? 'Pull-up enregistré.' : 'Pull-up retiré.')}
                  </p>
                )}
              </div>
            ) : (
              <div className="sc-release-join">
                <p>Connecte-toi pour donner un pull-up et laisser un commentaire.</p>
                <div className="sc-release-vote-actions">
                  <Link
                    href={`/login?${new URLSearchParams({ returnTo: `/sorties/${release.slug}#soutenir` })}`}
                    className="sc-button"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href={`/register?${new URLSearchParams({ returnTo: `/sorties/${release.slug}#soutenir` })}`}
                    className="sc-button-light"
                  >
                    Créer un compte
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="sc-release-sharing" aria-labelledby="release-sharing-title">
          <h2 id="release-sharing-title">Fais tourner.</h2>
          <div className="sc-release-share-actions">
            {shareButtons.map((config) => {
              const ButtonComponent = config.Button
              const IconComponent = config.Icon
              return (
                <ButtonComponent
                  key={config.key}
                  url={shareUrl}
                  {...config.buttonProps}
                  className="sc-release-share-control"
                  aria-label={`Partager sur ${config.label}`}
                >
                  <IconComponent size={24} round />
                  <span>{config.label}</span>
                </ButtonComponent>
              )
            })}
            <button
              type="button"
              onClick={handleCopyLink}
              className="sc-release-share-control"
              aria-label="Copier le lien de cette sortie"
            >
              <Copy size={19} aria-hidden="true" />
              <span>{copyStatus === 'copied' ? 'Lien copié' : 'Copier le lien'}</span>
            </button>
          </div>
          {copyStatus !== 'idle' && (
            <p className="sc-release-copy-status" role="status">
              {copyStatus === 'copied'
                ? 'Le lien est copié.'
                : 'Impossible de copier le lien. Réessaie.'}
            </p>
          )}
        </section>

        {relatedArtists.length > 0 && (
          <section className="sc-release-related" aria-labelledby="release-artists-title">
            <h2 id="release-artists-title" className="sc-release-section-title sc-display">
              Les artistes
            </h2>
            <div className="sc-release-artists">
              {relatedArtists.map((artist) => {
                const content = (
                  <>
                    <div className="sc-release-artist-picture">
                      {artist.picture ? (
                        <img src={artist.picture} alt="" width={64} height={64} loading="lazy" />
                      ) : (
                        <span className="sc-display" aria-hidden="true">
                          {artist.name[0]?.toUpperCase() ?? '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="sc-release-related-name">{artist.name}</p>
                      {artist.releaseCount !== null && artist.releaseCount !== undefined && (
                        <p className="sc-muted">
                          {artist.releaseCount === 1
                            ? '1 sortie'
                            : `${artist.releaseCount} sorties`}
                        </p>
                      )}
                    </div>
                    {artist.id && <ArrowUpRight size={20} aria-hidden="true" />}
                  </>
                )
                return artist.id ? (
                  <Link
                    key={artist.id}
                    href={`/artistes/${artist.id}`}
                    className="sc-release-artist-link"
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={artist.name} className="sc-release-artist-link">
                    {content}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        <section className="sc-release-comments" aria-labelledby="release-comments-title">
          <div className="sc-release-comments-heading">
            <h2 id="release-comments-title" className="sc-release-section-title sc-display">
              Les commentaires
            </h2>
            <span className="sc-muted">
              {comments.length} {comments.length === 1 ? 'commentaire' : 'commentaires'}
            </span>
          </div>
          {comments.length > 0 ? (
            <div className="sc-release-comment-list">
              {comments.map((review) => (
                <article key={review.id} className="sc-release-comment">
                  <div>
                    <p className="sc-release-comment-author">
                      {review.user.displayName}
                      {review.isCurrentUser ? ' · toi' : ''}
                    </p>
                    {review.createdAt && (
                      <time dateTime={review.createdAt} className="sc-muted">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                    <span className="sc-release-comment-boost">
                      <RotateCcw size={14} aria-hidden="true" /> A donné un pull-up
                    </span>
                  </div>
                  <p className="sc-release-comment-copy">{review.comment}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="sc-release-comments-empty sc-muted">
              Aucun commentaire pour le moment. Tu peux en ajouter avec ton pull-up.
            </p>
          )}
        </section>
      </div>
    </EditorialLayout>
  )
}

export default ReleaseShow
