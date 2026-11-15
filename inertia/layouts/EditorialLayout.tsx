import type { ReactNode } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import { ArrowUpRight, Mail, UserRound } from 'lucide-react'
import type { SharedProps } from '@adonisjs/inertia/types'
import SiteSignature from '~/components/SiteSignature'
import '~/css/editorial.css'

export default function EditorialLayout({ children }: { children: ReactNode }) {
  const {
    props: { auth },
    url,
  } = usePage<SharedProps>()
  const path = url.split(/[?#]/)[0]
  return (
    <div className="sc-editorial">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <a className="sc-skip" href="#contenu">
        Aller au contenu
      </a>
      {import.meta.env.VITE_DEMO_MODE === 'true' && (
        <div className="sc-demo">Prototype local · régions, dates et soutiens simulés</div>
      )}
      <header className="sc-header">
        <div className="sc-shell sc-nav">
          <Link href="/" className="sc-logo" aria-label="StayConnect, accueil">
            #StayConnect<span aria-hidden="true">●</span>
          </Link>
          <nav aria-label="Navigation principale">
            <Link
              href="/"
              aria-current={path === '/' || path.startsWith('/sorties/') ? 'page' : undefined}
            >
              Les sorties
            </Link>
            <Link href="/artistes" aria-current={path.startsWith('/artistes') ? 'page' : undefined}>
              Les artistes
            </Link>
            <Link href="/#newsletter-section" className="sc-nav-recap">
              <Mail size={16} aria-hidden="true" /> Le récap
            </Link>
          </nav>
          {auth?.user ? (
            <Link
              className="sc-account"
              href="/mon-espace"
              aria-current={path.startsWith('/mon-') ? 'page' : undefined}
            >
              <UserRound size={16} aria-hidden="true" /> Mon espace
            </Link>
          ) : (
            <Link className="sc-account" href="/login?returnTo=%2Fmon-espace">
              Connexion <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>
      <main id="contenu">{children}</main>
      <footer className="sc-footer">
        <div className="sc-shell">
          <SiteSignature />
        </div>
        <div className="sc-shell sc-footer-top">
          <Link href="/" className="sc-logo">
            #StayConnect<span aria-hidden="true">●</span>
          </Link>
          <p>
            La musique d’ici.
            <br />
            Partout où tu es.
          </p>
          <div className="sc-footer-links">
            <Link href="/artistes">
              Explorer les artistes <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
            <Link href="/artistes#proposer">
              Proposer un artiste <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className="sc-shell sc-footer-bottom">
          <span>Antilles · Guyane</span>
        </div>
      </footer>
    </div>
  )
}
