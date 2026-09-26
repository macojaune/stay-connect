import type { ReactNode } from 'react'
import { Head, Link, usePage } from '@inertiajs/react'
import type { SharedProps } from '@adonisjs/inertia/types'
import { ArrowLeft, AudioLines, LogOut, Plus, UserRound } from 'lucide-react'
import EditorialLayout from '~/layouts/EditorialLayout'
import '~/css/member-editorial.css'

type Props = { title: string; description: string; children: ReactNode }

const links = [
  { href: '/mon-espace', label: 'Mes pull-ups', icon: AudioLines },
  { href: '/mon-espace/propositions', label: 'Mes propositions', icon: Plus },
  { href: '/mon-compte', label: 'Mon compte', icon: UserRound },
]

export default function MemberLayout({ title, description, children }: Props) {
  const {
    props: { auth },
    url,
  } = usePage<SharedProps>()
  const path = url.split(/[?#]/)[0]
  const name = auth.user?.fullName || auth.user?.username || 'Ton espace'
  return (
    <EditorialLayout>
      <Head title={title}>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="sc-shell sc-member-shell">
        <aside className="sc-member-sidebar">
          <Link href="/" className="sc-member-back">
            <ArrowLeft size={16} aria-hidden="true" /> Les sorties
          </Link>
          <div className="sc-member-identity">
            <span className="sc-member-avatar" aria-hidden="true">
              {name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <strong>{name}</strong>
              <span>Ton espace StayConnect</span>
            </div>
          </div>
          <nav aria-label="Ton espace">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={path === href ? 'page' : undefined}>
                <Icon size={18} aria-hidden="true" /> {label}
              </Link>
            ))}
          </nav>
          <Link href="/logout" method="post" as="button" className="sc-member-logout">
            <LogOut size={16} aria-hidden="true" /> Se déconnecter
          </Link>
        </aside>
        <div className="sc-member-main">
          <header className="sc-member-heading">
            <h1 className="sc-display">{title}</h1>
            <p>{description}</p>
          </header>
          {children}
        </div>
      </div>
    </EditorialLayout>
  )
}
