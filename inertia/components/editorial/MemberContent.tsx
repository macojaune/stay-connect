import { Link } from '@inertiajs/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { MemberPagination, MemberSuggestion } from '#contracts/member'

export function memberDate(value: string | null) {
  if (!value) return 'Date non renseignée'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date non renseignée'
    : date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
}

const statuses: Record<MemberSuggestion['status'], string> = {
  pending: 'À vérifier',
  accepted: 'Acceptée',
  rejected: 'Non retenue',
}

export function SuggestionStatus({ status }: { status: MemberSuggestion['status'] }) {
  return (
    <span className={`sc-suggestion-status sc-suggestion-status-${status}`}>
      <span aria-hidden="true" />
      {statuses[status]}
    </span>
  )
}

export function MemberPaginationNav({
  pagination,
  href,
}: {
  pagination: MemberPagination
  href: string
}) {
  if (pagination.lastPage < 2) return null
  return (
    <nav className="sc-member-pagination" aria-label="Pages de résultats">
      {pagination.page > 1 ? (
        <Link href={`${href}?page=${pagination.page - 1}`}>
          <ArrowLeft size={16} aria-hidden="true" /> Précédent
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {pagination.page} sur {pagination.lastPage}
      </span>
      {pagination.page < pagination.lastPage ? (
        <Link href={`${href}?page=${pagination.page + 1}`}>
          Suivant <ArrowRight size={16} aria-hidden="true" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
