import { useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowRight, ArrowUpRight, RotateCcw, ListOrdered, CalendarDays } from 'lucide-react'
import PullUpRecord from '~/components/editorial/PullUpRecord'
import { getDemoTerritories, territoryLabels } from '~/demo/territories'
import EditorialLayout from '~/layouts/EditorialLayout'

type ReleaseItem = {
  id: number
  slug: string
  title: string
  artist: string
  date: string
  dateIso: string
  type: string
  imageUrl?: string | null
  featuredArtists: string[]
  boostCount: number
}
type Week = { title: string; weekStart: string; isUpcoming: boolean; news: ReleaseItem[] }
type HomeProps = { timelineData: Week[]; errors?: string | Record<string, string> }
const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const dayDate = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
})
const dateOf = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00`)
const releaseType = (type: string) =>
  ({ single: 'Single', album: 'Album', ep: 'EP' })[type.toLowerCase()] || 'Sortie'

function Field({
  id,
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string }) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        {...props}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p className="sc-field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function Newsletter({ errors }: Pick<HomeProps, 'errors'>) {
  const userForm = useForm({ type: 'user', username: '', email: '' })
  const artistForm = useForm({ type: 'artist', artistName: '', role: '', email: '' })
  const [userMessage, setUserMessage] = useState('')
  const [artistMessage, setArtistMessage] = useState('')
  const submitUser = (event: FormEvent) => {
    event.preventDefault()
    if (demoMode) {
      setUserMessage('Aperçu local : aucune inscription ni aucun email envoyé.')
      return
    }
    setUserMessage('')
    userForm.post('/newsletter', {
      preserveScroll: true,
      onSuccess: (page) => {
        if (!page.props.errors || Object.keys(page.props.errors).length === 0) {
          userForm.reset()
          setUserMessage('Tu es inscrit·e. Rendez-vous au prochain récap !')
        }
      },
    })
  }
  const submitArtist = (event: FormEvent) => {
    event.preventDefault()
    if (demoMode) {
      setArtistMessage('Aperçu local : aucune inscription ni aucun email envoyé.')
      return
    }
    setArtistMessage('')
    artistForm.post('/newsletter', {
      preserveScroll: true,
      onSuccess: (page) => {
        if (!page.props.errors || Object.keys(page.props.errors).length === 0) {
          artistForm.reset()
          setArtistMessage('Merci, ton inscription a bien été enregistrée.')
        }
      },
    })
  }
  return (
    <section className="sc-newsletter" id="newsletter-section" aria-labelledby="newsletter-title">
      <div className="sc-shell sc-newsletter-inner">
        <div>
          <h2 id="newsletter-title" className="sc-display">
            Les sorties.
            <br />
            <span>Dans ta boîte.</span>
          </h2>
          <p>
            Le récap des nouveautés des Antilles-Guyane et de leurs diasporas, chaque semaine par
            email. De quoi découvrir, écouter et soutenir les artistes d’ici.
          </p>
        </div>
        <div>
          {typeof errors === 'string' && <p role="alert">{errors}</p>}
          <form className="sc-newsletter-form" onSubmit={submitUser}>
            <Field
              id="newsletter-username"
              label="Ton pseudo"
              name="username"
              autoComplete="nickname"
              placeholder="Ton pseudo"
              value={userForm.data.username}
              onChange={(e) => userForm.setData('username', e.target.value)}
              error={userForm.errors.username}
              required
            />
            <Field
              id="newsletter-email"
              label="Ton email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="toi@exemple.fr"
              value={userForm.data.email}
              onChange={(e) => userForm.setData('email', e.target.value)}
              error={userForm.errors.email}
              required
            />
            <button
              className="sc-button"
              type="submit"
              disabled={userForm.processing}
              data-umami-event="newsletter-submit"
              data-umami-event-type="user"
            >
              {userForm.processing ? 'Inscription…' : 'Recevoir le récap'}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
            {userMessage && (
              <p className="sc-form-message" role="status">
                {userMessage}
              </p>
            )}
          </form>
          <details className="sc-artist-invite">
            <summary>Tu es artiste ou dans une équipe ?</summary>
            <form className="sc-newsletter-form" onSubmit={submitArtist}>
              <Field
                id="artist-name"
                label="Nom de l’artiste"
                name="artistName"
                value={artistForm.data.artistName}
                onChange={(e) => artistForm.setData('artistName', e.target.value)}
                error={artistForm.errors.artistName}
                required
              />
              <Field
                id="artist-role"
                label="Ton rôle"
                name="role"
                placeholder="Artiste, manager…"
                value={artistForm.data.role}
                onChange={(e) => artistForm.setData('role', e.target.value)}
                error={artistForm.errors.role}
                required
              />
              <div className="sc-form-full">
                <Field
                  id="artist-email"
                  label="Ton email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={artistForm.data.email}
                  onChange={(e) => artistForm.setData('email', e.target.value)}
                  error={artistForm.errors.email}
                  required
                />
              </div>
              <button
                className="sc-button"
                type="submit"
                disabled={artistForm.processing}
                data-umami-event="newsletter-submit"
                data-umami-event-type="artist"
              >
                {artistForm.processing ? 'Inscription…' : 'Rejoindre côté artistes'}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
              {artistMessage && (
                <p className="sc-form-message" role="status">
                  {artistMessage}
                </p>
              )}
            </form>
          </details>
        </div>
      </div>
    </section>
  )
}

function ReleaseEntry({
  release,
  rank,
  priority,
}: {
  release: ReleaseItem
  rank?: number
  priority: boolean
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const href = `/sorties/${release.slug}`
  const territories = demoMode ? getDemoTerritories(release.slug) : []
  return (
    <article className={`sc-entry${rank ? ' sc-entry-ranked' : ''}`}>
      {rank && (
        <span className="sc-entry-rank" aria-label={`Position ${rank}`}>
          {String(rank).padStart(2, '0')}
        </span>
      )}
      <Link
        className="sc-entry-artwork"
        href={href}
        aria-label={`${release.artist} — ${release.title}, voir la sortie`}
      >
        {release.imageUrl && !imageFailed ? (
          <img
            src={release.imageUrl}
            alt={`Pochette de ${release.title}`}
            width={180}
            height={180}
            loading={priority ? 'eager' : 'lazy'}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className="sc-cover-fallback" aria-hidden="true">
            {release.artist.slice(0, 2)}
          </span>
        )}
        <span className="sc-entry-open">
          <ArrowUpRight size={20} aria-hidden="true" />
        </span>
      </Link>
      <div className="sc-entry-info">
        <div className="sc-entry-meta">
          <span>{releaseType(release.type)}</span>
          {rank && (
            <time dateTime={release.dateIso}>{shortDate.format(dateOf(release.dateIso))}</time>
          )}
        </div>
        <h3>
          <Link href={href}>{release.artist}</Link>
        </h3>
        <p className="sc-entry-title">
          <Link href={href}>{release.title}</Link>
        </p>
        {release.featuredArtists.length > 0 && (
          <p className="sc-entry-featuring">Avec {release.featuredArtists.join(', ')}</p>
        )}
        {territories.length > 0 && (
          <ul className="sc-territories" aria-label="Territoires fictifs pour cet aperçu">
            {territories.map((territory) => (
              <li
                key={territory}
                className={`sc-territory sc-territory-${territory.toLowerCase()}`}
                title="Attribution fictive pour tester les badges, invités compris"
              >
                {territoryLabels[territory]}
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        className="sc-pullup-counter"
        href={`${href}#soutenir`}
        aria-label={`${release.boostCount} pull-ups pour ${release.title}, voir le soutien`}
      >
        <RotateCcw size={20} aria-hidden="true" />
        <strong>{release.boostCount}</strong>
        <span>pull-up{release.boostCount !== 1 ? 's' : ''}</span>
      </Link>
    </article>
  )
}

export default function Home({ timelineData, errors }: HomeProps) {
  const weeks = [...timelineData].sort((a, b) => a.weekStart.localeCompare(b.weekStart))
  const [selectedWeek, setSelectedWeek] = useState(
    () =>
      timelineData.find((week) => week.title === 'Cette semaine')?.weekStart || weeks[0]?.weekStart
  )
  const [sort, setSort] = useState<'date' | 'boosts'>('date')
  const week = weeks.find((item) => item.weekStart === selectedWeek)
  const releases = [...(week?.news || [])].sort(
    (a, b) =>
      (sort === 'boosts' ? b.boostCount - a.boostCount : 0) ||
      (b.dateIso || '').localeCompare(a.dateIso || '') ||
      a.artist.localeCompare(b.artist)
  )
  const periodStart = week ? dateOf(week.weekStart) : null
  const periodEnd = periodStart ? new Date(periodStart) : null
  periodEnd?.setDate(periodEnd.getDate() + 6)
  const period =
    periodStart && periodEnd
      ? `${shortDate.format(periodStart)} – ${shortDate.format(periodEnd)}`
      : ''
  return (
    <EditorialLayout>
      <Head title="Les sorties de la semaine">
        <meta
          name="description"
          content="Les nouveautés des artistes des Antilles-Guyane et de leurs diasporas. Découvre les sorties, écoute et donne un pull-up à tes coups de cœur."
        />
      </Head>
      <section className="sc-masthead" aria-labelledby="discovery-title">
        <div className="sc-shell sc-masthead-content">
          <h1 className="sc-display" id="discovery-title">
            <span>Les sorties</span>
            <span>de la semaine.</span>
          </h1>
          <div className="sc-masthead-aside">
            <PullUpRecord />
            <div className="sc-masthead-copy">
              <p>
                Les nouveautés des artistes des Antilles-Guyane et de leurs diasporas.
                <br />
                Découvre. Écoute. Un pull-up pour tes coups de cœur.
              </p>
              <a href="#newsletter-section">
                Le récap par email <ArrowRight size={17} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="sc-shell sc-catalogue" aria-label="Catalogue des sorties">
        <div className="sc-catalogue-top">
          <div className="sc-weeks" role="group" aria-label="Choisir une semaine">
            {weeks.map((item) => (
              <button
                type="button"
                key={item.weekStart}
                aria-pressed={selectedWeek === item.weekStart}
                onClick={() => setSelectedWeek(item.weekStart)}
              >
                {item.isUpcoming
                  ? 'À venir'
                  : item.title === 'Cette semaine'
                    ? 'Cette semaine'
                    : 'La semaine passée'}
              </button>
            ))}
          </div>
        </div>
        <div className="sc-catalogue-toolbar">
          <h2 className="sc-count" aria-live="polite">
            {releases.length} {week?.isUpcoming ? 'sortie' : 'nouveauté'}
            {releases.length !== 1 ? 's' : ''}
            <span>{period}</span>
          </h2>
          <div className="sc-sort" role="group" aria-label="Classer les sorties">
            <button type="button" aria-pressed={sort === 'date'} onClick={() => setSort('date')}>
              <CalendarDays size={16} aria-hidden="true" /> Le fil des sorties
            </button>
            <button
              type="button"
              aria-pressed={sort === 'boosts'}
              onClick={() => setSort('boosts')}
            >
              <ListOrdered size={17} aria-hidden="true" /> Le classement
            </button>
          </div>
        </div>
        {demoMode && (
          <p className="sc-territory-demo">
            Les territoires affichés sont fictifs dans cet aperçu, invités compris.
          </p>
        )}
        {releases.length > 0 ? (
          <div className={`sc-listing sc-listing-${sort}`} key={`${selectedWeek}-${sort}`}>
            {sort === 'boosts' ? (
              <>
                <p className="sc-ranking-note">
                  Le classement de la semaine, par nombre de pull-ups.
                </p>
                {releases.map((release, index) => (
                  <ReleaseEntry
                    key={release.id}
                    release={release}
                    rank={index + 1}
                    priority={index < 3}
                  />
                ))}
              </>
            ) : (
              [...new Set(releases.map((release) => release.dateIso))].map((day) => (
                <section className="sc-day" key={day} aria-label={`Sorties du ${day}`}>
                  <h3 className="sc-day-label">
                    <time dateTime={day}>{dayDate.format(dateOf(day))}</time>
                  </h3>
                  <div className="sc-day-entries">
                    {releases
                      .filter((release) => release.dateIso === day)
                      .map((release, index) => (
                        <ReleaseEntry key={release.id} release={release} priority={index < 2} />
                      ))}
                  </div>
                </section>
              ))
            )}
          </div>
        ) : (
          <div className="sc-empty">
            <h3 className="sc-display">
              {week?.isUpcoming ? 'La suite arrive.' : 'Une semaine encore calme.'}
            </h3>
            <p>
              {week?.isUpcoming
                ? 'Aucune sortie annoncée pour la semaine prochaine.'
                : 'Aucune sortie répertoriée pour cette semaine.'}
            </p>
            <a className="sc-button-light" href="#newsletter-section">
              Recevoir les prochaines sorties <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        )}
      </section>
      <Newsletter errors={errors} />
    </EditorialLayout>
  )
}
