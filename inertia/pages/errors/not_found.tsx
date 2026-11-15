import { Head, Link } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
import EditorialLayout from '~/layouts/EditorialLayout'
import '~/css/error-editorial.css'

type NotFoundProps = {
  title?: string
  message?: string
}

export default function NotFound({
  title = 'Page introuvable',
  message = 'Cette adresse ne correspond à aucune page. Retrouve les dernières sorties ou explore les artistes.',
}: NotFoundProps) {
  return (
    <EditorialLayout>
      <Head title={title}>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <section className="sc-shell sc-error-shell" aria-labelledby="error-title">
        <div className="sc-error-layout">
          <div className="sc-display sc-error-code" aria-hidden="true">
            404
          </div>
          <div className="sc-error-content">
            <h1 className="sc-display" id="error-title">
              <span className="sr-only">Erreur 404. </span>
              {title}
            </h1>
            <p className="sc-error-description">{message}</p>
            <div className="sc-error-actions">
              <Link className="sc-button" href="/">
                Voir les sorties <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="sc-error-secondary" href="/artistes">
                Explorer les artistes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </EditorialLayout>
  )
}
