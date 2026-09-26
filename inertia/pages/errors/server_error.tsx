import { Head, Link } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
import EditorialLayout from '~/layouts/EditorialLayout'
import '~/css/error-editorial.css'

type ServerErrorProps = {
  message?: string
  requestId?: string
  error?: {
    message?: string
  }
}

export default function ServerError(props: ServerErrorProps) {
  const message =
    props.message ??
    props.error?.message ??
    'Une erreur du serveur empêche l’affichage de cette page.'

  return (
    <EditorialLayout>
      <Head title="Erreur serveur">
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <section className="sc-shell sc-error-shell" aria-labelledby="error-title">
        <div className="sc-error-layout">
          <div className="sc-display sc-error-code" aria-hidden="true">
            500
          </div>
          <div className="sc-error-content">
            <h1 className="sc-display" id="error-title">
              <span className="sr-only">Erreur 500. </span>
              Impossible d’afficher cette page
            </h1>
            <p className="sc-error-description">{message}</p>
            <p className="sc-error-description">
              Tu peux revenir aux sorties ou réessayer plus tard.
            </p>
            <div className="sc-error-actions">
              <Link className="sc-button" href="/">
                Voir les sorties <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="sc-error-secondary" href="/artistes">
                Explorer les artistes
              </Link>
            </div>
            {props.requestId && (
              <p className="sc-error-reference">Référence de l’erreur : {props.requestId}</p>
            )}
          </div>
        </div>
      </section>
    </EditorialLayout>
  )
}
