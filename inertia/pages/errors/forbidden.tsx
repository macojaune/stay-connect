import { Head, Link } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
import EditorialLayout from '~/layouts/EditorialLayout'
import '~/css/error-editorial.css'

export default function Forbidden() {
  return (
    <EditorialLayout>
      <Head title="Accès réservé à l’équipe">
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <section className="sc-shell sc-error-shell" aria-labelledby="error-title">
        <div className="sc-error-layout">
          <div className="sc-display sc-error-code" aria-hidden="true">
            403
          </div>
          <div className="sc-error-content">
            <h1 className="sc-display" id="error-title">
              <span className="sr-only">Erreur 403. </span>Accès réservé à l’équipe
            </h1>
            <p className="sc-error-description">
              Ton compte ne permet pas de modifier le catalogue. Tu peux retrouver tes pull-ups et
              tes propositions dans ton espace.
            </p>
            <div className="sc-error-actions">
              <Link className="sc-button" href="/mon-espace">
                Revenir à mon espace <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link className="sc-error-secondary" href="/">
                Voir les sorties
              </Link>
            </div>
          </div>
        </div>
      </section>
    </EditorialLayout>
  )
}
