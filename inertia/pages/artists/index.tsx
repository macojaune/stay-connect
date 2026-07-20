import { Head, Link, useForm } from '@inertiajs/react'
import { FormEvent } from 'react'
import AppLayout from '~/layouts/AppLayout'
import { Button } from '~/components/ui/Button'
import { Input } from '~/components/ui/Input'

type Artist = {
  id: string
  name: string
  profilePicture: string | null
  releaseCount: number
  latestRelease: {
    id: string
    title: string
    slug: string
    date: string | null
    type: string
    cover: string | null
  } | null
}

type ArtistsIndexProps = {
  artists: Artist[]
  flash?: { success?: string }
}

const formatReleaseDate = (date: string | null) => {
  if (!date) return null

  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ArtistsIndex({ artists, flash }: ArtistsIndexProps) {
  const form = useForm({ name: '', email: '', sourceUrl: '', message: '' })

  const submitSuggestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    form.post('/artistes/suggestions', {
      preserveScroll: true,
      onSuccess: () => form.reset(),
    })
  }

  return (
    <AppLayout>
      <Head title="Artistes" />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="border-b border-zinc-200 pb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand">Répertoire</p>
          <h1 className="mt-2 text-3xl font-bold text-zinc-900">Artistes référencés</h1>
          <p className="mt-3 max-w-2xl text-zinc-600">
            Retrouve les sorties publiées sur StayConnect et les profils déjà répertoriés.
          </p>
        </section>

        {artists.length > 0 ? (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artistes/${artist.id}`}
                className="group flex min-h-36 gap-4 border border-zinc-200 bg-white p-4 transition hover:border-brand hover:shadow-sm"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-zinc-100">
                  {artist.profilePicture ? (
                    <img
                      src={artist.profilePicture}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-brand">
                      {artist.name[0]?.toUpperCase() ?? '?'}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-zinc-900 group-hover:text-brand">
                    {artist.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {artist.releaseCount === 1
                      ? '1 sortie référencée'
                      : `${artist.releaseCount} sorties référencées`}
                  </p>
                  {artist.latestRelease && (
                    <p className="mt-3 truncate text-sm text-zinc-700">
                      Dernière sortie: {artist.latestRelease.title}
                      {formatReleaseDate(artist.latestRelease.date)
                        ? `, ${formatReleaseDate(artist.latestRelease.date)}`
                        : ''}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <p className="mt-8 text-zinc-600">Aucun artiste n’est encore référencé.</p>
        )}

        <section className="mt-14 grid gap-8 border-t border-zinc-200 pt-10 lg:grid-cols-[1fr_minmax(0,1.1fr)]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand">Manquant ?</p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900">Proposer un artiste</h2>
            <p className="mt-3 max-w-md text-zinc-600">
              Envoie-nous le nom de l’artiste et un lien utile. La proposition est vérifiée avant
              d’être ajoutée au répertoire.
            </p>
          </div>
          <form
            onSubmit={submitSuggestion}
            className="grid gap-4 bg-white p-5 shadow-sm ring-1 ring-zinc-200"
          >
            {flash?.success && (
              <p className="text-sm font-medium text-emerald-700">{flash.success}</p>
            )}
            <Input
              id="artist-name"
              label="Nom de l’artiste"
              value={form.data.name}
              onChange={(event) => form.setData('name', event.target.value)}
              error={form.errors.name}
              required
            />
            <Input
              id="artist-email"
              type="email"
              label="Ton adresse email"
              value={form.data.email}
              onChange={(event) => form.setData('email', event.target.value)}
              error={form.errors.email}
              required
            />
            <Input
              id="artist-source-url"
              type="url"
              label="Lien utile (facultatif)"
              placeholder="Spotify, Instagram, site officiel..."
              value={form.data.sourceUrl}
              onChange={(event) => form.setData('sourceUrl', event.target.value)}
              error={form.errors.sourceUrl}
            />
            <label className="space-y-2 text-sm font-medium text-zinc-900" htmlFor="artist-message">
              Précision (facultatif)
              <textarea
                id="artist-message"
                value={form.data.message}
                onChange={(event) => form.setData('message', event.target.value)}
                maxLength={1000}
                className="min-h-24 w-full resize-y border border-zinc-300 px-3 py-2 text-sm font-normal outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {form.errors.message && (
                <span className="block text-sm text-red-600">{form.errors.message}</span>
              )}
            </label>
            <Button
              type="submit"
              disabled={form.processing}
              loading={form.processing}
              className="justify-self-start"
            >
              Envoyer la proposition
            </Button>
          </form>
        </section>
      </div>
    </AppLayout>
  )
}
