import { Head, Link } from '@inertiajs/react'
import { BadgeCheck, ExternalLink } from 'lucide-react'
import AppLayout from '~/layouts/AppLayout'

type ArtistShowProps = {
  artist: {
    id: string
    name: string
    description: string | null
    profilePicture: string | null
    socials: Record<string, string> | null
    isVerified: boolean
    categories: Array<{ id: string; name: string }>
    releases: Array<{
      id: string
      title: string
      slug: string
      date: string | null
      type: string
      cover: string | null
    }>
  }
}

const formatReleaseDate = (date: string | null) => {
  if (!date) return null

  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function ArtistShow({ artist }: ArtistShowProps) {
  const socialLinks = Object.entries(artist.socials ?? {}).filter(([, url]) => Boolean(url))

  return (
    <AppLayout>
      <Head title={artist.name} />
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/artistes" className="text-sm font-medium text-brand hover:underline">
          Retour aux artistes
        </Link>

        <section className="mt-6 grid gap-6 border-b border-zinc-200 pb-10 md:grid-cols-[160px_minmax(0,1fr)]">
          <div className="aspect-square w-40 overflow-hidden rounded-full bg-zinc-100">
            {artist.profilePicture ? (
              <img src={artist.profilePicture} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl font-bold text-brand">
                {artist.name[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <div className="min-w-0 self-center">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold text-zinc-900">{artist.name}</h1>
              {artist.isVerified && (
                <BadgeCheck className="h-6 w-6 text-brand" aria-label="Profil vérifié" />
              )}
            </div>
            {artist.categories.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {artist.categories.map((category) => (
                  <span
                    key={category.id}
                    className="border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
            {artist.description ? (
              <p className="mt-5 max-w-3xl whitespace-pre-line text-zinc-700">
                {artist.description}
              </p>
            ) : (
              <p className="mt-5 max-w-3xl text-zinc-500">
                Cet artiste n’a pas encore ajouté de présentation.
              </p>
            )}
            {socialLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-3">
                {socialLinks.map(([label, url]) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                  >
                    {label} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-zinc-900">Sorties référencées</h2>
          {artist.releases.length > 0 ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {artist.releases.map((release) => (
                <Link
                  key={release.id}
                  href={`/sorties/${release.slug}`}
                  className="group overflow-hidden border border-zinc-200 bg-white transition hover:border-brand hover:shadow-sm"
                >
                  <div className="aspect-square bg-zinc-100">
                    {release.cover ? (
                      <img src={release.cover} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-4 text-center text-sm text-zinc-500">
                        Pas de visuel
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="truncate font-semibold text-zinc-900 group-hover:text-brand">
                      {release.title}
                    </h3>
                    <p className="mt-1 text-sm capitalize text-zinc-500">
                      {[release.type, formatReleaseDate(release.date)].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-zinc-600">Aucune sortie publique n’est encore référencée.</p>
          )}
        </section>
      </div>
    </AppLayout>
  )
}
