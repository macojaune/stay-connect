import type { ReactNode } from 'react'
import { Head, Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import EditorialLayout from '~/layouts/EditorialLayout'
import PullUpRecord from '~/components/editorial/PullUpRecord'
import '~/css/auth-editorial.css'

type Props = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  returnTo: string
}

export function authHref(path: '/login' | '/register' | '/forgot-password', returnTo: string) {
  return returnTo === '/' ? path : `${path}?${new URLSearchParams({ returnTo })}`
}

export default function AuthLayout({ title, description, children, footer, returnTo }: Props) {
  const backHref = returnTo.startsWith('/mon-') ? '/' : returnTo
  return (
    <EditorialLayout>
      <Head title={title}>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="referrer" content="no-referrer" />
      </Head>
      <div className="sc-shell sc-auth-shell">
        <Link className="sc-auth-back" href={backHref}>
          <ArrowLeft size={17} aria-hidden="true" />
          {returnTo.startsWith('/sorties/') ? 'Revenir à la sortie' : 'Revenir aux découvertes'}
        </Link>
        <div className="sc-auth-grid">
          <aside
            className="sc-auth-poster"
            aria-label="Les sorties des Antilles-Guyane et de leurs diasporas"
          >
            <p className="sc-display sc-auth-poster-title">
              Les sorties
              <br />
              d’ici.
              <br />
              Chaque semaine.
            </p>
            <div className="sc-auth-record">
              <PullUpRecord />
            </div>
            <p className="sc-auth-poster-note">
              Antilles, Guyane et diasporas.
              <br />
              Découvre les nouveautés, retrouve celles qui te parlent.
            </p>
          </aside>
          <section className="sc-auth-content" aria-labelledby="auth-title">
            <header className="sc-auth-heading">
              <h1 id="auth-title" className="sc-display">
                {title}
              </h1>
              <p>{description}</p>
            </header>
            {children}
            <div className="sc-auth-footer">{footer}</div>
          </section>
        </div>
      </div>
    </EditorialLayout>
  )
}
