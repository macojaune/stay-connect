import { Link, useForm } from '@inertiajs/react'
import { ArrowRight, ArrowUpRight, Check, Plus } from 'lucide-react'
import type { MemberSuggestionsProps } from '#contracts/member'
import MemberLayout from '~/layouts/MemberLayout'
import AuthField, { AuthFormError, focusAuthError } from '~/components/auth/AuthField'
import {
  MemberPaginationNav,
  SuggestionStatus,
  memberDate,
} from '~/components/editorial/MemberContent'
import '~/css/auth-editorial.css'

export default function SuggestionsPage({
  suggestions,
  pagination,
  status,
}: MemberSuggestionsProps) {
  const form = useForm({ name: '', sourceUrl: '', message: '' })
  return (
    <MemberLayout
      title="Tes propositions"
      description="Fais découvrir les artistes qui manquent encore au catalogue."
    >
      <section className="sc-member-propose" aria-labelledby="suggest-title">
        <div className="sc-member-propose-intro">
          <Plus size={30} strokeWidth={1.5} aria-hidden="true" />
          <h2 id="suggest-title" className="sc-display">
            Un nom à nous faire écouter ?
          </h2>
          <p>
            Propose un artiste des Antilles-Guyane. Ajoute un lien vers sa
            musique ou son profil officiel.
          </p>
          <p>
            Chaque proposition est vérifiée avant un éventuel ajout au catalogue. Son statut
            apparaîtra plus bas.
          </p>
          <Link href="/artistes">
            Consulter les artistes déjà référencés <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <form
          className="sc-auth-form"
          aria-busy={form.processing}
          onSubmit={(event) => {
            event.preventDefault()
            form.post('/mon-espace/propositions', {
              preserveScroll: true,
              onError: focusAuthError,
              onSuccess: () => form.reset(),
            })
          }}
        >
          {status === 'submitted' && (
            <p role="status" className="sc-member-notice">
              <Check size={19} aria-hidden="true" />
              Ta proposition est enregistrée et attend sa vérification.
            </p>
          )}
          <AuthFormError errors={form.errors} />
          <AuthField
            id="name"
            label="Nom de l’artiste"
            required
            minLength={2}
            maxLength={120}
            value={form.data.name}
            onChange={(event) => form.setData('name', event.target.value)}
            error={form.errors.name}
            autoComplete="off"
          />
          <AuthField
            id="sourceUrl"
            label="Lien vers l’artiste"
            type="url"
            required
            maxLength={500}
            placeholder="https://open.spotify.com/artist/…"
            hint="Spotify, site officiel ou profil sur les réseaux sociaux."
            value={form.data.sourceUrl}
            onChange={(event) => form.setData('sourceUrl', event.target.value)}
            error={form.errors.sourceUrl}
          />
          <div className="sc-auth-field">
            <label htmlFor="message">
              Une précision ? <span className="sc-muted">Facultatif</span>
            </label>
            <textarea
              id="message"
              name="message"
              className="sc-member-textarea"
              maxLength={1000}
              rows={3}
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
            {form.processing ? 'Envoi en cours…' : 'Envoyer la proposition'}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </form>
      </section>
      <section className="sc-member-suggestions-history" aria-labelledby="history-title">
        <div className="sc-member-section-heading">
          <h2 id="history-title">Tes envois</h2>
          <span>
            {pagination.total} {pagination.total === 1 ? 'proposition' : 'propositions'}
          </span>
        </div>
        {suggestions.length > 0 ? (
          <ul className="sc-member-suggestion-list">
            {suggestions.map((item) => (
              <li key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <span className="sc-member-suggestion-date">
                    Proposé le {memberDate(item.createdAt)}
                  </span>
                  {item.message && <p>{item.message}</p>}
                  {item.sourceUrl && (
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ouvrir le lien proposé pour ${item.name}, nouvel onglet`}
                    >
                      Voir le lien envoyé <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  )}
                </div>
                <SuggestionStatus status={item.status} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="sc-member-history-empty">
            Tu n’as pas encore envoyé de proposition depuis ton compte. Le formulaire ci-dessus est
            là pour ça.
          </p>
        )}
        <MemberPaginationNav pagination={pagination} href="/mon-espace/propositions" />
      </section>
    </MemberLayout>
  )
}
