import { Head, Link } from '@inertiajs/react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Disc3 } from 'lucide-react'
import type { ArtistCredit, ArtistRelease, ArtistShowProps } from '#contracts/artists'
import EditorialLayout from '~/layouts/EditorialLayout'
import Artwork from '~/components/editorial/Artwork'
import '~/css/artists-editorial.css'

function parsedDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function ArtistName({ credit }: { credit: ArtistCredit }) {
  return credit.id ? (
    <Link href={`/artistes/${credit.id}`}>{credit.name}</Link>
  ) : (
    <span>{credit.name}</span>
  )
}

export default function ArtistShow({ artist, releases, pagination }: ArtistShowProps) {
  const years = new Map<string, ArtistRelease[]>()
  for (const release of releases) {
    const year = parsedDate(release.date)?.getUTCFullYear().toString() ?? 'Sans date'
    const group = years.get(year)
    if (group) group.push(release)
    else years.set(year, [release])
  }

  function pageUrl(page: number) {
    return `/artistes/${artist.id}?page=${page}#sorties`
  }

  return (
    <EditorialLayout>
      <Head title={artist.name} />
      <div className="sc-shell sc-artist-profile">
        <Link href="/artistes" className="sc-artist-back">
          <ArrowLeft size={18} aria-hidden="true" /> Tous les artistes
        </Link>
        <header className="sc-artist-profile-hero">
          <Artwork
            src={artist.profilePicture}
            name={artist.name}
            className="sc-artist-profile-portrait"
          />
          <div className="sc-artist-profile-intro">
            <h1 className="sc-display">{artist.name}</h1>
            {artist.categories.length > 0 && (
              <ul className="sc-artist-categories" aria-label="Styles musicaux">
                {artist.categories.map((category) => (
                  <li key={category.id}>{category.name}</li>
                ))}
              </ul>
            )}
            <p className={artist.description ? 'sc-artist-bio' : 'sc-artist-bio sc-muted'}>
              {artist.description ?? 'Aucune présentation disponible pour le moment.'}
            </p>
            {artist.links.length > 0 && (
              <nav
                className="sc-artist-links"
                aria-label={`Retrouver ${artist.name} sur les plateformes`}
              >
                {artist.links.map((link) => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.label} <ArrowUpRight size={16} aria-hidden="true" />
                    <span className="sr-only"> (nouvel onglet)</span>
                  </a>
                ))}
              </nav>
            )}
            <a href="#sorties" className="sc-button sc-artist-listen">
              Explorer les sorties <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        </header>

        <section id="sorties" className="sc-artist-discography" aria-labelledby="discography-title">
          <div className="sc-artist-discography-heading">
            <div>
              <h2 id="discography-title" className="sc-display">
                Les sorties<span className="sc-artist-total">{pagination.total}</span>
              </h2>
              <p>De la plus récente à la plus ancienne, participations incluses.</p>
            </div>
            <Disc3 size={40} strokeWidth={1.5} aria-hidden="true" />
          </div>

          {releases.length > 0 ? (
            <div className="sc-artist-timeline">
              {Array.from(years, ([year, entries]) => (
                <section key={year} className="sc-artist-year" aria-label={`Sorties ${year}`}>
                  <h3 className="sc-display">{year}</h3>
                  <ol className="sc-artist-release-list">
                    {entries.map((release) => {
                      const date = parsedDate(release.date)
                      return (
                        <li key={release.id} className="sc-artist-release-row">
                          <Link
                            href={`/sorties/${release.slug}`}
                            className="sc-artist-release-cover"
                            tabIndex={-1}
                            aria-hidden="true"
                          >
                            <Artwork src={release.cover} name={release.title} />
                          </Link>
                          <div className="sc-artist-release-body">
                            <div className="sc-artist-release-meta">
                              <span>{release.type || 'Sortie'}</span>
                              {release.role === 'featured' && (
                                <span className="sc-artist-feature-label">En participation</span>
                              )}
                            </div>
                            <h4>
                              <Link href={`/sorties/${release.slug}`}>{release.title}</Link>
                            </h4>
                            <p className="sc-artist-release-credits">
                              {release.artist ? (
                                <ArtistName credit={release.artist} />
                              ) : (
                                <span>Artiste principal non renseigné</span>
                              )}
                              {release.featuredArtists.length > 0 && (
                                <>
                                  {' · avec '}
                                  {release.featuredArtists.map((credit, index) => (
                                    <span key={credit.id ?? credit.name}>
                                      {index > 0 && ', '}
                                      <ArtistName credit={credit} />
                                    </span>
                                  ))}
                                </>
                              )}
                            </p>
                            <p className="sc-artist-release-date">
                              {date && release.date ? (
                                <time dateTime={release.date}>
                                  {date.toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    timeZone: 'UTC',
                                  })}
                                </time>
                              ) : (
                                'Date non renseignée'
                              )}
                            </p>
                          </div>
                          <Link
                            href={`/sorties/${release.slug}`}
                            className="sc-artist-release-open"
                            aria-label={`Découvrir ${release.title}`}
                          >
                            <ArrowUpRight size={24} aria-hidden="true" />
                          </Link>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              ))}
            </div>
          ) : (
            <div className="sc-artists-empty">
              <h3 className="sc-display">Pas encore de sortie.</h3>
              <p>
                Aucune sortie n’est encore référencée pour {artist.name}. En attendant, explore les
                nouveautés du catalogue.
              </p>
              <Link href="/" className="sc-button">
                Voir les dernières sorties <ArrowUpRight size={18} aria-hidden="true" />
              </Link>
            </div>
          )}

          {pagination.lastPage > 1 && (
            <nav className="sc-artists-pagination" aria-label="Pages des sorties de l’artiste">
              {pagination.page > 1 ? (
                <Link href={pageUrl(pagination.page - 1)} rel="prev">
                  <ArrowLeft size={18} aria-hidden="true" /> Précédente
                </Link>
              ) : (
                <span />
              )}
              <span>
                Page {pagination.page} / {pagination.lastPage}
              </span>
              {pagination.page < pagination.lastPage ? (
                <Link href={pageUrl(pagination.page + 1)} rel="next">
                  Suivante <ArrowRight size={18} aria-hidden="true" />
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </EditorialLayout>
  )
}
