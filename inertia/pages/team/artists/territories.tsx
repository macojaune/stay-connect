import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { type FormEvent } from 'react'
import type { TerritoryCode, TerritorySourceKind } from '#contracts/territories'
import { territoryCodes, territoryLabels } from '#contracts/territories'
import EditorialLayout from '~/layouts/EditorialLayout'
import '~/css/team-release-editor.css'
import '~/css/team-territories.css'

type Affiliation = {
  territoryCode: TerritoryCode
  sourceKind: TerritorySourceKind
  sourceReference: string | null
  sourceNote: string
  verifiedAt?: string | null
}

type Props = {
  artist: { id: string; name: string; territories: Affiliation[] }
  success: string | null
}

type FormData = {
  territories: Affiliation[]
  reviewConfirmed: boolean
}

export default function TeamArtistTerritories({ artist, success }: Props) {
  const form = useForm<FormData>({
    territories: artist.territories,
    reviewConfirmed: false,
  })
  const errors = form.errors as Record<string, string | undefined>

  function selected(code: TerritoryCode) {
    return form.data.territories.find((entry) => entry.territoryCode === code)
  }

  function toggle(code: TerritoryCode, enabled: boolean) {
    form.setData(
      'territories',
      enabled
        ? [
            ...form.data.territories,
            {
              territoryCode: code,
              sourceKind: 'public_source',
              sourceReference: null,
              sourceNote: '',
            },
          ]
        : form.data.territories.filter((entry) => entry.territoryCode !== code)
    )
    form.setData('reviewConfirmed', false)
  }

  function update(code: TerritoryCode, patch: Partial<Affiliation>) {
    form.setData(
      'territories',
      form.data.territories.map((entry) =>
        entry.territoryCode === code ? { ...entry, ...patch } : entry
      )
    )
    form.setData('reviewConfirmed', false)
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    form.put(`/equipe/artistes/${artist.id}/territoires`, {
      onError: (serverErrors) => {
        const first = Object.keys(serverErrors)[0]
        const index = first?.match(/^territories\.(\d+)\.(\w+)$/)
        const code = index ? form.data.territories[Number(index[1])]?.territoryCode : null
        const id = code ? `${code}-${index?.[2]}` : first
        if (id) requestAnimationFrame(() => document.getElementById(id)?.focus())
      },
    })
  }

  return (
    <EditorialLayout>
      <Head title={`Territoires de ${artist.name}`}>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="sc-shell sc-editor-shell sc-territory-editor">
        <Link href={`/artistes/${artist.id}`} className="sc-editor-back">
          <ArrowLeft size={17} aria-hidden="true" /> Fiche de {artist.name}
        </Link>
        <header className="sc-editor-intro">
          <h1 className="sc-display">Affiliations de {artist.name}.</h1>
          <p>
            Associe uniquement les territoires dont le lien musical ou culturel avec cet artiste a
            été vérifié. Les badges seront visibles sur ses sorties et participations dès
            l’enregistrement.
          </p>
        </header>

        {success && (
          <p className="sc-territory-success" role="status">
            <Check size={18} aria-hidden="true" /> {success}
          </p>
        )}

        <form className="sc-territory-form" onSubmit={submit} aria-busy={form.processing}>
          <div className="sc-territory-editor-heading">
            <div>
              <p className="sc-territory-kicker">Référentiel · Antilles-Guyane</p>
              <h2 className="sc-display">Territoires vérifiés</h2>
            </div>
            <p>
              Une affiliation inconnue reste décochée. Ne la déduis pas de Spotify, du nom ou du
              lieu de résidence.
            </p>
          </div>

          <div className="sc-territory-editor-list">
            {territoryCodes.map((code) => {
              const entry = selected(code)
              const index = form.data.territories.findIndex((item) => item.territoryCode === code)
              const error = (field: keyof Affiliation) =>
                index >= 0 ? errors[`territories.${index}.${field}`] : undefined
              return (
                <section
                  key={code}
                  className={`sc-territory-editor-card${entry ? ' is-selected' : ''}`}
                >
                  <label className="sc-territory-editor-choice" htmlFor={`${code}-enabled`}>
                    <input
                      id={`${code}-enabled`}
                      type="checkbox"
                      checked={!!entry}
                      onChange={(event) => toggle(code, event.target.checked)}
                    />
                    <span className={`sc-territory sc-territory-${code.toLowerCase()}`}>
                      {territoryLabels[code]}
                    </span>
                    <span className="sc-territory-editor-state">
                      {entry ? 'Affiliation retenue' : 'Non renseigné'}
                    </span>
                  </label>

                  {entry && (
                    <div className="sc-territory-editor-fields">
                      <div className="sc-editor-field">
                        <label htmlFor={`${code}-sourceKind`}>Nature de la source</label>
                        <select
                          id={`${code}-sourceKind`}
                          value={entry.sourceKind}
                          onChange={(event) =>
                            update(code, { sourceKind: event.target.value as TerritorySourceKind })
                          }
                        >
                          <option value="public_source">Source publique explicite</option>
                          <option value="artist_declaration">Déclaration de l’artiste</option>
                        </select>
                      </div>
                      <div className="sc-editor-field">
                        <label htmlFor={`${code}-sourceReference`}>
                          Lien de la source{' '}
                          {entry.sourceKind === 'public_source' ? '(obligatoire)' : '(facultatif)'}
                        </label>
                        <input
                          id={`${code}-sourceReference`}
                          type="url"
                          inputMode="url"
                          placeholder="https://…"
                          value={entry.sourceReference ?? ''}
                          required={entry.sourceKind === 'public_source'}
                          maxLength={1000}
                          aria-invalid={!!error('sourceReference')}
                          aria-describedby={
                            error('sourceReference') ? `${code}-reference-error` : undefined
                          }
                          onChange={(event) =>
                            update(code, { sourceReference: event.target.value || null })
                          }
                        />
                        {error('sourceReference') && (
                          <p
                            id={`${code}-reference-error`}
                            className="sc-editor-error"
                            role="alert"
                          >
                            {error('sourceReference')}
                          </p>
                        )}
                      </div>
                      <div className="sc-editor-field sc-territory-note-field">
                        <label htmlFor={`${code}-sourceNote`}>Ce que la source établit</label>
                        <textarea
                          id={`${code}-sourceNote`}
                          value={entry.sourceNote}
                          required
                          minLength={10}
                          maxLength={500}
                          placeholder="Indique le passage ou la déclaration, avec sa date. Aucune donnée privée."
                          aria-invalid={!!error('sourceNote')}
                          aria-describedby={error('sourceNote') ? `${code}-note-error` : undefined}
                          onChange={(event) => update(code, { sourceNote: event.target.value })}
                        />
                        {error('sourceNote') && (
                          <p id={`${code}-note-error`} className="sc-editor-error" role="alert">
                            {error('sourceNote')}
                          </p>
                        )}
                      </div>
                      {entry.verifiedAt && (
                        <p className="sc-territory-editor-reviewed">
                          Dernière vérification le{' '}
                          {new Date(entry.verifiedAt).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                  )}
                </section>
              )
            })}
          </div>

          <div className="sc-territory-editor-publish">
            <label htmlFor="reviewConfirmed">
              <input
                id="reviewConfirmed"
                type="checkbox"
                checked={form.data.reviewConfirmed}
                aria-invalid={!!errors.reviewConfirmed}
                aria-describedby={errors.reviewConfirmed ? 'reviewConfirmed-error' : undefined}
                onChange={(event) => form.setData('reviewConfirmed', event.target.checked)}
              />
              J’ai vérifié chaque affiliation retenue et sa source.
            </label>
            {errors.reviewConfirmed && (
              <p id="reviewConfirmed-error" className="sc-editor-error" role="alert">
                {errors.reviewConfirmed}
              </p>
            )}
            <button
              type="submit"
              className="sc-button"
              disabled={form.processing || !form.data.reviewConfirmed}
            >
              Enregistrer les affiliations <ArrowRight size={18} aria-hidden="true" />
            </button>
            <p>Enregistrer publie ou retire les badges immédiatement sur les sorties concernées.</p>
          </div>
        </form>
      </div>
    </EditorialLayout>
  )
}
