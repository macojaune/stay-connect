import { Head, Link, useForm, usePage } from '@inertiajs/react'
import type { FormEvent } from 'react'
import type { SharedProps } from '@adonisjs/inertia/types'
import type { ArtistIndexProps } from '#contracts/artists'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, Search } from 'lucide-react'
import EditorialLayout from '~/layouts/EditorialLayout'
import Artwork from '~/components/editorial/Artwork'
import AuthField, { AuthFormError, focusAuthError } from '~/components/auth/AuthField'
import '~/css/auth-editorial.css'
import '~/css/artists-editorial.css'

function releaseDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
}

export default function ArtistsIndex({ artists, filters, pagination, flash }: ArtistIndexProps) {
  const { auth } = usePage<SharedProps>().props
  const search = useForm({ q: filters.q, sort: filters.sort })
  const form = useForm({ name: '', email: auth?.user?.email ?? '', sourceUrl: '', message: '' })

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    search.get('/artistes', { preserveState: true, preserveScroll: true })
  }

  function submitSuggestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.post('/artistes/suggestions', {
      preserveScroll: true,
      onSuccess: () => form.reset(),
      onError: focusAuthError,
    })
  }

  function pageUrl(page: number) {
    const params = new URLSearchParams({ q: filters.q, sort: filters.sort, page: String(page) })
    return `/artistes?${params}#repertoire`
  }

  return (
    <EditorialLayout>
      <Head title="Les artistes" />
      <header className="sc-artists-masthead">
        <div className="sc-shell sc-artists-masthead-inner">
          <h1 className="sc-display">
            Les artistes<span aria-hidden="true">.</span>
          </h1>
          <div className="sc-artists-intro">
            <p>
              Antilles, Guyane, diasporas.
              <br />
              Retrouve les artistes et remonte le fil de leurs sorties.
            </p>
            <a href="#proposer">
              Il manque quelqu’un ? <ArrowDown size={17} aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <section
        id="repertoire"
        className="sc-shell sc-artist-directory"
        aria-labelledby="directory-title"
      >
        <form
          className="sc-artist-filters"
          onSubmit={submitSearch}
          role="search"
          aria-label="Rechercher un artiste"
        >
          <div className="sc-artist-search-field">
            <label htmlFor="artist-search">Nom de l’artiste</label>
            <div className="sc-artist-search-input">
              <Search size={20} aria-hidden="true" />
              <input
                id="artist-search"
                type="search"
                name="q"
                value={search.data.q}
                maxLength={120}
                onChange={(event) => search.setData('q', event.target.value)}
                placeholder="Qui veux-tu écouter ?"
              />
            </div>
          </div>
          <div className="sc-artist-sort-field">
            <label htmlFor="artist-sort">Trier par</label>
            <select
              id="artist-sort"
              name="sort"
              value={search.data.sort}
              onChange={(event) =>
                search.setData('sort', event.target.value === 'recent' ? 'recent' : 'name')
              }
            >
              <option value="name">Nom · A à Z</option>
              <option value="recent">Dernière sortie</option>
            </select>
          </div>
          <button type="submit" className="sc-button" disabled={search.processing}>
            {search.processing ? 'Recherche…' : 'Rechercher'}{' '}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </form>

        <div className="sc-artist-results-heading" aria-live="polite" aria-atomic="true">
          <h2 id="directory-title">
            <strong>{pagination.total.toLocaleString('fr-FR')}</strong>{' '}
            {pagination.total === 1 ? 'artiste' : 'artistes'}
            {filters.q && <> pour « {filters.q} »</>}
          </h2>
          {filters.q && (
            <Link href="/artistes" className="sc-artist-text-link">
              Effacer la recherche
            </Link>
          )}
        </div>

        {artists.length > 0 ? (
          <div className="sc-artist-grid">
            {artists.map((artist) => (
              <article key={artist.id} className="sc-artist-tile">
                <Link href={`/artistes/${artist.id}`} className="sc-artist-tile-main">
                  <Artwork
                    src={artist.profilePicture}
                    name={artist.name}
                    className="sc-artist-tile-portrait"
                  />
                  <div className="sc-artist-tile-name">
                    <h3>{artist.name}</h3>
                    <ArrowUpRight size={20} aria-hidden="true" />
                  </div>
                  <p className="sc-artist-tile-count">
                    {artist.releaseCount === 0
                      ? 'Aucune sortie référencée'
                      : `${artist.releaseCount} ${artist.releaseCount === 1 ? 'sortie' : 'sorties'} au répertoire`}
                  </p>
                </Link>
                {artist.latestRelease && (
                  <Link
                    href={`/sorties/${artist.latestRelease.slug}`}
                    className="sc-artist-tile-release"
                  >
                    <span>
                      Dernière sortie
                      {releaseDate(artist.latestRelease.date) && (
                        <> · {releaseDate(artist.latestRelease.date)}</>
                      )}
                    </span>
                    <strong>{artist.latestRelease.title}</strong>
                  </Link>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="sc-artists-empty">
            <h3 className="sc-display">
              {filters.q ? 'Pas encore dans le répertoire.' : 'Le répertoire attend ses artistes.'}
            </h3>
            <p>
              {filters.q
                ? 'Essaie un autre nom ou propose-nous cet artiste pour compléter le catalogue.'
                : 'Tu connais un artiste des Antilles-Guyane ou de leurs diasporas ? Envoie-nous son profil.'}
            </p>
            <a className="sc-button" href="#proposer">
              Proposer un artiste <ArrowDown size={18} aria-hidden="true" />
            </a>
          </div>
        )}

        {pagination.lastPage > 1 && (
          <nav className="sc-artists-pagination" aria-label="Pages du répertoire">
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

      <section id="proposer" className="sc-artist-proposal" aria-labelledby="proposal-title">
        <div className="sc-shell sc-artist-proposal-inner">
          <div className="sc-artist-proposal-copy">
            <h2 id="proposal-title" className="sc-display">
              Fais passer
              <br />
              le nom.
            </h2>
            <p>
              Un artiste manque à l’appel ? Partage son nom et un lien pour nous aider à compléter
              le répertoire.
            </p>
            <p className="sc-artist-proposal-note">
              Chaque proposition est vérifiée avant ajout. Aucun compte nécessaire.
            </p>
          </div>
          <form
            onSubmit={submitSuggestion}
            className="sc-artist-proposal-form"
            aria-label="Proposer un artiste"
            aria-busy={form.processing}
          >
            {flash.success && (
              <p className="sc-artist-success" role="status">
                <Check size={20} aria-hidden="true" />
                {flash.success}
              </p>
            )}
            <AuthFormError errors={form.errors} />
            <AuthField
              id="name"
              label="Nom de l’artiste"
              autoComplete="off"
              minLength={2}
              maxLength={120}
              value={form.data.name}
              onChange={(event) => form.setData('name', event.target.value)}
              error={form.errors.name}
              required
            />
            <AuthField
              id="sourceUrl"
              label="Lien vers l’artiste"
              type="url"
              inputMode="url"
              pattern="https?://.+"
              maxLength={500}
              placeholder="https://…"
              hint="Spotify, YouTube, site officiel ou autre profil public."
              value={form.data.sourceUrl}
              onChange={(event) => form.setData('sourceUrl', event.target.value)}
              error={form.errors.sourceUrl}
              required
            />
            <AuthField
              id="email"
              type="email"
              label="Ton adresse email"
              autoComplete="email"
              hint="Pour te contacter si nous avons besoin d’une précision."
              value={form.data.email}
              onChange={(event) => form.setData('email', event.target.value)}
              error={form.errors.email}
              required
            />
            <div className="sc-auth-field">
              <label htmlFor="message">
                Une précision <span className="sc-artist-optional">(facultatif)</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={3}
                maxLength={1000}
                value={form.data.message}
                onChange={(event) => form.setData('message', event.target.value)}
                aria-invalid={form.errors.message ? true : undefined}
                aria-describedby={form.errors.message ? 'message-error' : undefined}
              />
              {form.errors.message && (
                <p id="message-error" className="sc-auth-error" role="alert">
                  {form.errors.message}
                </p>
              )}
            </div>
            <button type="submit" className="sc-button" disabled={form.processing}>
              {form.processing ? 'Envoi en cours…' : 'Envoyer la proposition'}{' '}
              <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </EditorialLayout>
  )
}
