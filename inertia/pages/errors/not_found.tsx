import { Head, Link } from '@inertiajs/react'
import { ArrowLeft, Music2, SearchX } from 'lucide-react'
import AppLayout from '~/layouts/AppLayout'
import { Button } from '~/components/ui/Button'

type NotFoundProps = {
  title?: string
  message?: string
}

export default function NotFound({
  title = 'Page introuvable',
  message = 'La page que tu cherches n’existe pas ou a été déplacée.',
}: NotFoundProps) {
  return (
    <AppLayout>
      <Head title={title}>
        <meta name="robots" content="noindex" />
      </Head>

      <section className="flex min-h-[58vh] items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-7 flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
            <SearchX className="size-8" aria-hidden="true" />
          </div>

          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand">
            Erreur 404
          </p>
          <h1 className="text-3xl font-bold text-zinc-900 sm:text-4xl">{title}</h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-zinc-600">{message}</p>

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/">
                <Music2 aria-hidden="true" />
                Voir les sorties
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/" preserveScroll>
                <ArrowLeft aria-hidden="true" />
                Retour à l’accueil
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
