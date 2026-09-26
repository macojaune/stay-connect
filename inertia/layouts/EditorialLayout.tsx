import type { ReactNode } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import { ArrowUpRight, Mail } from 'lucide-react'
import type { SharedProps } from '@adonisjs/inertia/types'
import '~/css/editorial.css'

export default function EditorialLayout({ children }: { children: ReactNode }) {
  const { auth } = usePage<SharedProps>().props
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
            <Link href="/">Les sorties</Link>
            <Link href="/artistes">Les artistes</Link>
            <Link href="/#newsletter-section" className="sc-nav-recap">
              <Mail size={16} aria-hidden="true" /> Le récap
            </Link>
          </nav>
          {auth?.user ? (
            <Link className="sc-account" href="/logout" method="post" as="button">
              Déconnexion
            </Link>
          ) : (
            <Link className="sc-account" href="/login">
              Connexion <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>
      <main id="contenu">{children}</main>
      <footer className="sc-footer">
        <div className="sc-shell sc-footer-top">
          <Link href="/" className="sc-logo">
            #StayConnect<span aria-hidden="true">●</span>
          </Link>
          <p>
            La musique d’ici.
            <br />
            Partout où tu es.
          </p>
          <Link href="/artistes">
            Explorer les artistes <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </div>
        <div className="sc-shell sc-footer-bottom">
          <span>Antilles · Guyane · Diasporas</span>
          <span>
            Développé entre deux écoutes par{' '}
            <a href="https://marvinl.com" target="_blank" rel="noreferrer">
              MarvinL.com
            </a>
          </span>
        </div>
      </footer>
    </div>
  )
}
