import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { ArrowLeft, ArrowRight, Check, ImagePlus, Plus, Search, Trash2 } from 'lucide-react'
import EditorialLayout from '~/layouts/EditorialLayout'
import Artwork from '~/components/editorial/Artwork'
import '~/css/team-release-editor.css'

type Option = { id: string; name: string }
type ReleaseType = 'single' | 'ep' | 'album'
type ExistingRelease = {
  id: string
  title: string
  description: string
  date: string
  type: ReleaseType
  cover: string | null
  urls: string[]
  artistId: string | null
  categoryIds: string[]
}
type Props = {
  mode: 'create' | 'edit'
  artists: Option[]
  categories: Option[]
  release: ExistingRelease | null
}
type EditorData = {
  title: string
  description: string
  date: string
  type: ReleaseType
  cover: string | null
  coverFile: File | null
  urls: string[]
  artistId: string | null
  newArtistName: string
  categoryIds: string[]
  newCategoryName: string
}

const isHttps = (value: string) => /^https:\/\//i.test(value)

function normalized(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim()
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={`${id}-error`} className="sc-editor-error" role="alert">
      {message}
    </p>
  ) : null
}

function fieldDescription(id: string, error?: string, hint?: boolean) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') ||
    undefined
  )
}

export default function TeamReleaseForm({ mode, artists, categories, release }: Props) {
  const editing = mode === 'edit' && release !== null
  const form = useForm<EditorData>({
    title: release?.title ?? '',
    description: release?.description ?? '',
    date: release?.date ?? '',
    type: release?.type ?? 'single',
    cover: release?.cover && isHttps(release.cover) ? release.cover : null,
    coverFile: null,
    urls: release?.urls.length && release.urls.every(isHttps) ? release.urls : [''],
    artistId: release?.artistId ?? null,
    newArtistName: '',
    categoryIds: release?.categoryIds ?? [],
    newCategoryName: '',
  })
  const [artistMode, setArtistMode] = useState<'existing' | 'new'>('existing')
  const [artistQuery, setArtistQuery] = useState('')
  const [categoryQuery, setCategoryQuery] = useState('')
  const [artistSelectionError, setArtistSelectionError] = useState('')
  const [coverTouched, setCoverTouched] = useState(false)
  const [uploadedCoverPreview, setUploadedCoverPreview] = useState<string | null>(null)
  const coverFileInput = useRef<HTMLInputElement>(null)
  const [linksTouched, setLinksTouched] = useState(false)

  const selectedArtist = artists.find((artist) => artist.id === form.data.artistId)
  const artistMatches = useMemo(() => {
    const query = normalized(artistQuery)
    const matches = artists.filter((artist) => normalized(artist.name).includes(query))
    const first = matches.slice(0, 8)
    if (!query && selectedArtist && !first.some((artist) => artist.id === selectedArtist.id)) {
      first.unshift(selectedArtist)
    }
    return { first, total: matches.length }
  }, [artistQuery, artists, selectedArtist])
  const categoryMatches = useMemo(() => {
    const query = normalized(categoryQuery)
    const matches = categories.filter((category) => normalized(category.name).includes(query))
    const first = matches.slice(0, 12)
    for (const category of categories) {
      if (
        form.data.categoryIds.includes(category.id) &&
        !first.some((item) => item.id === category.id)
      ) {
        first.unshift(category)
      }
    }
    return { first, total: matches.length }
  }, [categories, categoryQuery, form.data.categoryIds])
  const artistError = artistSelectionError || form.errors.artistId || form.errors.newArtistName
  const urlErrors = form.errors as Record<string, string | undefined>
  const urlErrorAt = (index: number) =>
    urlErrors[`urls.${index}`] || (index === 0 ? form.errors.urls : undefined)
  const hasLegacyLinks = editing && release.urls.some((url) => !isHttps(url))
  const linksRequired = !editing || (release.urls.length > 0 && (!hasLegacyLinks || linksTouched))

  useEffect(() => {
    if (!form.data.coverFile) {
      setUploadedCoverPreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(form.data.coverFile)
    setUploadedCoverPreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [form.data.coverFile])

  function focusServerError(errors: Record<string, string>) {
    const key = Object.keys(errors)[0]
    const id = key?.startsWith('urls.')
      ? `streaming-url-${key.split('.')[1]}`
      : key === 'artistId'
        ? 'artist-search'
        : key === 'categoryIds'
          ? 'category-search'
          : key === 'urls'
            ? 'streaming-url-0'
            : key
    if (id) requestAnimationFrame(() => document.getElementById(id)?.focus())
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (artistMode === 'existing' && !form.data.artistId) {
      setArtistSelectionError('Choisis un artiste dans le catalogue ou crée un nouvel artiste.')
      document.getElementById('artist-search')?.focus()
      return
    }
    setArtistSelectionError('')
    form.transform((data) => ({
      title: data.title.trim(),
      description: data.description.trim(),
      date: data.date,
      type: data.type,
      ...(data.coverFile
        ? { coverFile: data.coverFile }
        : !editing || coverTouched
          ? { cover: data.cover?.trim() || null }
          : {}),
      ...(!editing || linksTouched
        ? { urls: data.urls.map((url) => url.trim()).filter(Boolean) }
        : {}),
      categoryIds: data.categoryIds,
      ...(artistMode === 'existing'
        ? { artistId: data.artistId }
        : { newArtistName: data.newArtistName.trim() }),
      ...(data.newCategoryName.trim() ? { newCategoryName: data.newCategoryName.trim() } : {}),
    }))
    const options = { onError: focusServerError }
    if (editing) form.patch(`/equipe/sorties/${release.id}`, options)
    else form.post('/equipe/sorties', options)
  }

  const previewArtist = artistMode === 'new' ? form.data.newArtistName : selectedArtist?.name
  const previewCover =
    uploadedCoverPreview || form.data.cover || (!coverTouched ? (release?.cover ?? null) : null)
  const heading = editing ? 'Corriger la sortie.' : 'Ajouter une sortie.'
  return (
    <EditorialLayout>
      <Head title={heading}>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="sc-shell sc-editor-shell">
        <Link href="/mon-espace" className="sc-editor-back">
          <ArrowLeft size={17} aria-hidden="true" /> Mon espace
        </Link>
        <header className="sc-editor-intro">
          <h1 className="sc-display">{heading}</h1>
          <p>
            {editing
              ? 'Mets à jour les informations de la sortie. Les corrections seront visibles dès l’enregistrement.'
              : 'Renseigne la sortie et ses liens d’écoute. Elle sera visible dès l’enregistrement.'}
          </p>
        </header>

        <form className="sc-editor-form" onSubmit={submit} aria-busy={form.processing}>
          <div className="sc-editor-main">
            <section className="sc-editor-section" aria-labelledby="release-details-title">
              <div className="sc-editor-section-heading">
                <h2 id="release-details-title">La sortie</h2>
                <p>Le titre et la date portent la découverte dans le catalogue.</p>
              </div>
              <div className="sc-editor-fields sc-editor-fields-two">
                <div className="sc-editor-field sc-editor-field-wide">
                  <label htmlFor="title">Titre de la sortie</label>
                  <input
                    id="title"
                    name="title"
                    required
                    maxLength={200}
                    value={form.data.title}
                    onChange={(event) => form.setData('title', event.target.value)}
                    placeholder="Titre du single, de l’EP ou de l’album"
                    aria-invalid={!!form.errors.title}
                    aria-describedby={fieldDescription('title', form.errors.title)}
                  />
                  <FieldError id="title" message={form.errors.title} />
                </div>
                <div className="sc-editor-field">
                  <label htmlFor="type">Format</label>
                  <select
                    id="type"
                    name="type"
                    value={form.data.type}
                    onChange={(event) => form.setData('type', event.target.value as ReleaseType)}
                    aria-invalid={!!form.errors.type}
                    aria-describedby={fieldDescription('type', form.errors.type)}
                  >
                    <option value="single">Single</option>
                    <option value="ep">EP</option>
                    <option value="album">Album</option>
                  </select>
                  <FieldError id="type" message={form.errors.type} />
                </div>
                <div className="sc-editor-field">
                  <label htmlFor="date">Date de sortie</label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    required
                    value={form.data.date}
                    onChange={(event) => form.setData('date', event.target.value)}
                    aria-invalid={!!form.errors.date}
                    aria-describedby={fieldDescription('date', form.errors.date)}
                  />
                  <FieldError id="date" message={form.errors.date} />
                </div>
                <div className="sc-editor-field sc-editor-field-wide">
                  <label htmlFor="description">
                    Description <span>facultative</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    maxLength={2000}
                    value={form.data.description}
                    onChange={(event) => form.setData('description', event.target.value)}
                    aria-invalid={!!form.errors.description}
                    aria-describedby={fieldDescription(
                      'description',
                      form.errors.description,
                      true
                    )}
                  />
                  <p id="description-hint" className="sc-editor-hint">
                    Une présentation courte, sans texte promotionnel automatique.
                  </p>
                  <FieldError id="description" message={form.errors.description} />
                </div>
              </div>
            </section>

            <section className="sc-editor-section" aria-labelledby="artist-section-title">
              <div className="sc-editor-section-heading">
                <h2 id="artist-section-title">L’artiste principal</h2>
                <p>Retrouve un profil existant avant d’en créer un autre.</p>
              </div>
              <div className="sc-editor-choice" role="group" aria-label="Choix de l’artiste">
                <button
                  type="button"
                  aria-pressed={artistMode === 'existing'}
                  onClick={() => {
                    setArtistMode('existing')
                    setArtistSelectionError('')
                  }}
                >
                  Dans le catalogue
                </button>
                <button
                  type="button"
                  aria-pressed={artistMode === 'new'}
                  onClick={() => {
                    setArtistMode('new')
                    setArtistSelectionError('')
                  }}
                >
                  Nouvel artiste
                </button>
              </div>
              {artistMode === 'existing' ? (
                <div className="sc-editor-field">
                  <label htmlFor="artist-search">Rechercher un artiste</label>
                  <div className="sc-editor-search">
                    <Search size={18} aria-hidden="true" />
                    <input
                      id="artist-search"
                      type="search"
                      value={artistQuery}
                      onChange={(event) => setArtistQuery(event.target.value)}
                      placeholder="Nom de l’artiste"
                      aria-invalid={!!artistError}
                      aria-describedby={fieldDescription('artist-search', artistError, true)}
                    />
                  </div>
                  <p id="artist-search-hint" className="sc-editor-hint">
                    {selectedArtist
                      ? `Artiste choisi : ${selectedArtist.name}`
                      : 'Choisis un résultat ci-dessous.'}
                  </p>
                  <FieldError id="artist-search" message={artistError} />
                  <div className="sc-editor-options" aria-label="Résultats artistes">
                    {artistMatches.first.length ? (
                      artistMatches.first.map((artist) => (
                        <button
                          key={artist.id}
                          type="button"
                          aria-pressed={form.data.artistId === artist.id}
                          onClick={() => {
                            form.setData('artistId', artist.id)
                            setArtistSelectionError('')
                          }}
                        >
                          <span>{artist.name}</span>
                          {form.data.artistId === artist.id && (
                            <Check size={18} aria-hidden="true" />
                          )}
                        </button>
                      ))
                    ) : (
                      <p>Aucun artiste trouvé. Passe à « Nouvel artiste » pour l’ajouter.</p>
                    )}
                  </div>
                  {artistMatches.total > 8 && (
                    <p className="sc-editor-hint">
                      Affinez la recherche pour voir les autres artistes.
                    </p>
                  )}
                </div>
              ) : (
                <div className="sc-editor-field">
                  <label htmlFor="newArtistName">Nom du nouvel artiste</label>
                  <input
                    id="newArtistName"
                    name="newArtistName"
                    required
                    maxLength={120}
                    value={form.data.newArtistName}
                    onChange={(event) => form.setData('newArtistName', event.target.value)}
                    placeholder="Nom affiché dans le catalogue"
                    aria-invalid={!!artistError}
                    aria-describedby={fieldDescription('newArtistName', artistError, true)}
                  />
                  <p id="newArtistName-hint" className="sc-editor-hint">
                    Son profil sera créé avec cette sortie.
                  </p>
                  <FieldError id="newArtistName" message={artistError} />
                </div>
              )}
            </section>

            <section className="sc-editor-section" aria-labelledby="categories-title">
              <div className="sc-editor-section-heading">
                <h2 id="categories-title">Les catégories</h2>
                <p>Facultatif. Plusieurs genres peuvent accompagner une sortie.</p>
              </div>
              <div className="sc-editor-field">
                <label htmlFor="category-search">Rechercher une catégorie</label>
                <div className="sc-editor-search">
                  <Search size={18} aria-hidden="true" />
                  <input
                    id="category-search"
                    type="search"
                    value={categoryQuery}
                    onChange={(event) => setCategoryQuery(event.target.value)}
                    placeholder="Genre musical"
                  />
                </div>
                <fieldset
                  className="sc-editor-categories"
                  aria-invalid={!!form.errors.categoryIds}
                  aria-describedby={form.errors.categoryIds ? 'categoryIds-error' : undefined}
                >
                  <legend className="sc-editor-visually-hidden">
                    Catégories associées à la sortie
                  </legend>
                  {categoryMatches.first.length ? (
                    categoryMatches.first.map((category) => (
                      <label key={category.id}>
                        <input
                          type="checkbox"
                          checked={form.data.categoryIds.includes(category.id)}
                          disabled={
                            form.data.categoryIds.length >= 12 &&
                            !form.data.categoryIds.includes(category.id)
                          }
                          onChange={(event) =>
                            form.setData(
                              'categoryIds',
                              event.target.checked
                                ? [...form.data.categoryIds, category.id]
                                : form.data.categoryIds.filter((id) => id !== category.id)
                            )
                          }
                        />
                        <span>{category.name}</span>
                      </label>
                    ))
                  ) : (
                    <p>Aucune catégorie trouvée.</p>
                  )}
                </fieldset>
                {categoryMatches.total > 12 && (
                  <p className="sc-editor-hint">
                    Affinez la recherche pour voir les autres catégories.
                  </p>
                )}
                {form.data.categoryIds.length >= 12 && (
                  <p className="sc-editor-hint">12 catégories maximum.</p>
                )}
                <FieldError id="categoryIds" message={form.errors.categoryIds} />
              </div>
              <div className="sc-editor-field sc-editor-new-category">
                <label htmlFor="newCategoryName">
                  Nouvelle catégorie <span>facultative</span>
                </label>
                <input
                  id="newCategoryName"
                  name="newCategoryName"
                  maxLength={80}
                  value={form.data.newCategoryName}
                  onChange={(event) => form.setData('newCategoryName', event.target.value)}
                  placeholder="Si elle manque au catalogue"
                  aria-invalid={!!form.errors.newCategoryName}
                  aria-describedby={fieldDescription(
                    'newCategoryName',
                    form.errors.newCategoryName,
                    true
                  )}
                />
                <p id="newCategoryName-hint" className="sc-editor-hint">
                  Elle sera créée et associée à la sortie.
                </p>
                <FieldError id="newCategoryName" message={form.errors.newCategoryName} />
              </div>
            </section>

            <section className="sc-editor-section" aria-labelledby="links-title">
              <div className="sc-editor-section-heading">
                <h2 id="links-title">Où l’écouter</h2>
                <p>
                  {editing && release.urls.length === 0
                    ? 'Aucun lien référencé. Tu peux en ajouter un dès que la sortie est en écoute.'
                    : hasLegacyLinks && !linksTouched
                      ? 'Les liens actuels sont conservés. Leur remplacement exige des URL HTTPS.'
                      : 'Au moins un lien d’écoute HTTPS est nécessaire pour publier.'}
                </p>
              </div>
              <div className="sc-editor-links">
                {hasLegacyLinks && (
                  <details className="sc-editor-existing-links">
                    <summary>
                      Voir les liens actuellement enregistrés ({release.urls.length})
                    </summary>
                    <ul>
                      {release.urls.map((url, index) => (
                        <li key={`${url}-${index}`}>{url}</li>
                      ))}
                    </ul>
                  </details>
                )}
                {form.data.urls.map((url, index) => (
                  <div className="sc-editor-link-row" key={index}>
                    <div className="sc-editor-field">
                      <label htmlFor={`streaming-url-${index}`}>Lien d’écoute {index + 1}</label>
                      <input
                        id={`streaming-url-${index}`}
                        name={`urls[${index}]`}
                        type="url"
                        pattern="https://.*"
                        title="Utilise une adresse HTTPS."
                        required={index === 0 && linksRequired}
                        value={url}
                        onChange={(event) => {
                          setLinksTouched(true)
                          form.setData(
                            'urls',
                            form.data.urls.map((item, at) =>
                              at === index ? event.target.value : item
                            )
                          )
                        }}
                        placeholder="https://open.spotify.com/…"
                        aria-invalid={!!urlErrorAt(index)}
                        aria-describedby={fieldDescription(
                          `streaming-url-${index}`,
                          urlErrorAt(index),
                          index === 0
                        )}
                      />
                      {index === 0 && (
                        <p id="streaming-url-0-hint" className="sc-editor-hint">
                          {hasLegacyLinks && !linksTouched
                            ? 'Laisse vide pour conserver les liens actuels. Un nouveau lien remplacera la liste existante.'
                            : 'Spotify, Apple Music, YouTube ou une autre plateforme d’écoute.'}
                        </p>
                      )}
                      <FieldError id={`streaming-url-${index}`} message={urlErrorAt(index)} />
                    </div>
                    {index > 0 && (
                      <button
                        type="button"
                        className="sc-editor-remove-link"
                        aria-label={`Retirer le lien d’écoute ${index + 1}`}
                        onClick={() => {
                          setLinksTouched(true)
                          form.setData(
                            'urls',
                            form.data.urls.filter((_, at) => at !== index)
                          )
                        }}
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="sc-editor-add-link"
                  disabled={form.data.urls.length >= 12}
                  onClick={() => {
                    setLinksTouched(true)
                    form.setData('urls', [...form.data.urls, ''])
                  }}
                >
                  <Plus size={17} aria-hidden="true" /> Ajouter un lien
                </button>
                {hasLegacyLinks && linksTouched && (
                  <button
                    type="button"
                    className="sc-editor-restore-links"
                    onClick={() => {
                      form.setData('urls', [''])
                      setLinksTouched(false)
                    }}
                  >
                    Conserver les liens actuels
                  </button>
                )}
                {form.data.urls.length >= 12 && <p className="sc-editor-hint">12 liens maximum.</p>}
              </div>
            </section>
          </div>

          <aside className="sc-editor-side" aria-label="Pochette et publication">
            <div className="sc-editor-side-inner">
              <div className="sc-editor-cover-preview">
                <Artwork
                  src={previewCover}
                  name={form.data.title || previewArtist || 'Sortie'}
                  className="sc-editor-cover-art"
                />
                <div>
                  <strong>{form.data.title.trim() || 'Titre de la sortie'}</strong>
                  <span>{previewArtist?.trim() || 'Artiste principal'}</span>
                </div>
              </div>
              <div className="sc-editor-field">
                <label htmlFor="coverFile">
                  Importer une pochette <span>facultatif</span>
                </label>
                <label className="sc-editor-upload" htmlFor="coverFile">
                  <ImagePlus size={19} aria-hidden="true" />
                  <span>
                    <strong>{form.data.coverFile?.name || 'Choisir une image'}</strong>
                    <small>JPG, PNG ou WebP · 5 Mo maximum</small>
                  </span>
                </label>
                <input
                  ref={coverFileInput}
                  id="coverFile"
                  name="coverFile"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sc-editor-file-input"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    if (!file) return
                    setCoverTouched(true)
                    form.setData((data) => ({ ...data, cover: null, coverFile: file }))
                  }}
                  aria-invalid={!!form.errors.coverFile}
                  aria-describedby={fieldDescription('coverFile', form.errors.coverFile)}
                />
                <FieldError id="coverFile" message={form.errors.coverFile} />
              </div>
              <div className="sc-editor-cover-or" aria-hidden="true">
                ou
              </div>
              <div className="sc-editor-field">
                <label htmlFor="cover">
                  URL de la pochette <span>facultative</span>
                </label>
                <input
                  id="cover"
                  name="cover"
                  type="url"
                  pattern="https://.*"
                  title="Utilise une adresse HTTPS."
                  value={form.data.cover ?? ''}
                  onChange={(event) => {
                    setCoverTouched(true)
                    if (coverFileInput.current) coverFileInput.current.value = ''
                    form.setData((data) => ({
                      ...data,
                      cover: event.target.value || null,
                      coverFile: null,
                    }))
                  }}
                  placeholder="https://…/pochette.jpg"
                  aria-invalid={!!form.errors.cover}
                  aria-describedby={fieldDescription('cover', form.errors.cover, true)}
                />
                <p id="cover-hint" className="sc-editor-hint">
                  {editing && release.cover && !isHttps(release.cover) && !coverTouched
                    ? 'La pochette actuelle est conservée. Pour la remplacer, importe un fichier ou colle une adresse HTTPS.'
                    : 'Adresse HTTPS directe de l’image. Format carré conseillé.'}
                </p>
                <FieldError id="cover" message={form.errors.cover} />
                {(form.data.coverFile || previewCover) && (
                  <button
                    type="button"
                    className="sc-editor-remove-cover"
                    onClick={() => {
                      setCoverTouched(true)
                      if (coverFileInput.current) coverFileInput.current.value = ''
                      form.setData((data) => ({ ...data, cover: null, coverFile: null }))
                    }}
                  >
                    <Trash2 size={16} aria-hidden="true" /> Retirer la pochette
                  </button>
                )}
              </div>
              <div className="sc-editor-publish">
                <p>
                  {editing
                    ? 'Les corrections seront visibles dès l’enregistrement.'
                    : 'La sortie sera visible dès l’enregistrement.'}
                </p>
                <button type="submit" className="sc-button" disabled={form.processing}>
                  {form.processing
                    ? 'Enregistrement…'
                    : editing
                      ? 'Enregistrer les corrections'
                      : 'Publier la sortie'}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </EditorialLayout>
  )
}
