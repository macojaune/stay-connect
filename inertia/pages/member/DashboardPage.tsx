import { Link } from '@inertiajs/react'
import { ArrowRight, ArrowUpRight, AudioLines, MessageSquare } from 'lucide-react'
import type { MemberDashboardProps } from '#contracts/member'
import MemberLayout from '~/layouts/MemberLayout'
import Artwork from '~/components/editorial/Artwork'
import {
  MemberPaginationNav,
  SuggestionStatus,
  memberDate,
} from '~/components/editorial/MemberContent'

export default function DashboardPage({
  stats,
  pullUps,
  pagination,
  suggestions,
  latestReleases,
}: MemberDashboardProps) {
  return (
    <MemberLayout
      title="Tes pull-ups"
      description="Les sorties que tu soutiens, à retrouver et à réécouter."
    >
      <div className="sc-member-summary">
        <span>
          <AudioLines size={17} aria-hidden="true" />
          <strong>{stats.pullUps}</strong>{' '}
          {stats.pullUps === 1 ? 'sortie soutenue' : 'sorties soutenues'}
        </span>
        <span>
          <MessageSquare size={16} aria-hidden="true" />
          <strong>{stats.comments}</strong> {stats.comments === 1 ? 'commentaire' : 'commentaires'}
        </span>
        <Link href="/">
          Découvrir les sorties <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="sc-member-dashboard">
        <section aria-label="Tes sorties soutenues">
          {pullUps.length > 0 ? (
            <>
              <ol className="sc-member-pullups">
                {pullUps.map(({ id, release, comment, createdAt }) => (
                  <li key={id}>
                    <Link href={`/sorties/${release.slug}`} className="sc-member-release-link">
                      <Artwork src={release.cover} name={release.artist?.name ?? release.title} />
                      <div>
                        <span className="sc-member-release-type">
                          {release.type} · {memberDate(release.date)}
                        </span>
                        <h2>{release.title}</h2>
                        <p>
                          {release.artist?.name ?? 'Artiste non renseigné'}
                          {release.featuredArtists.length > 0 && (
                            <span> feat. {release.featuredArtists.join(', ')}</span>
                          )}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={20}
                        className="sc-member-release-arrow"
                        aria-hidden="true"
                      />
                    </Link>
                    {comment && <blockquote>{comment}</blockquote>}
                    <div className="sc-member-pullup-footer">
                      <span>Pull-up du {memberDate(createdAt)}</span>
                      <Link
                        href={`/sorties/${release.slug}#soutenir`}
                        aria-label={`Gérer mon pull-up pour ${release.title}`}
                      >
                        Gérer mon pull-up <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
              <MemberPaginationNav pagination={pagination} href="/mon-espace" />
            </>
          ) : (
            <div className="sc-member-empty">
              <AudioLines size={44} strokeWidth={1.4} aria-hidden="true" />
              <h2 className="sc-display">La prochaine découverte t’attend.</h2>
              <p>
                Un morceau te plaît ? Donne-lui un pull-up depuis sa fiche. Tu le retrouveras ici,
                avec ton commentaire si tu en laisses un.
              </p>
              <Link href="/" className="sc-button">
                Explorer les sorties <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
        <aside className="sc-member-discovery">
          <section>
            <h2>Les dernières sorties</h2>
            {latestReleases.length > 0 ? (
              <ul className="sc-member-latest">
                {latestReleases.slice(0, 4).map((release) => (
                  <li key={release.id}>
                    <Link href={`/sorties/${release.slug}`}>
                      <Artwork src={release.cover} name={release.title} />
                      <span>
                        <strong>{release.title}</strong>
                        <span>{release.artist?.name ?? 'Artiste non renseigné'}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sc-muted">
                Les prochaines sorties apparaîtront ici dès leur référencement.
              </p>
            )}
            <Link href="/" className="sc-member-text-link">
              Toutes les sorties <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
          <section className="sc-member-recap">
            <h2>Une semaine de musique, dans ta boîte mail.</h2>
            <p>Reçois le récap des sorties des Antilles-Guyane et de leurs diasporas.</p>
            <Link href="/#newsletter-section">
              M’inscrire au récap <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </section>
          <section>
            <h2>
              Tes propositions <span className="sc-member-count">{stats.suggestions}</span>
            </h2>
            {suggestions.length > 0 ? (
              <ul className="sc-member-recent-suggestions">
                {suggestions.map((item) => (
                  <li key={item.id}>
                    <strong>{item.name}</strong>
                    <SuggestionStatus status={item.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sc-muted">
                Un artiste manque au catalogue ? Partage un lien pour le proposer.
              </p>
            )}
            <Link href="/mon-espace/propositions" className="sc-member-text-link">
              {suggestions.length > 0 ? 'Suivre mes propositions' : 'Proposer un artiste'}{' '}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </div>
    </MemberLayout>
  )
}
