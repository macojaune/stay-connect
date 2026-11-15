export interface MemberPagination {
  page: number
  perPage: number
  total: number
  lastPage: number
}

export interface MemberRelease {
  id: string
  slug: string
  title: string
  cover: string | null
  date: string | null
  type: string
  artist: { id: string; name: string } | null
  featuredArtists: string[]
  pullUpCount: number
}

export interface MemberPullUp {
  id: string
  comment: string | null
  createdAt: string | null
  release: MemberRelease
}

export interface MemberSuggestion {
  id: string
  name: string
  sourceUrl: string | null
  message: string | null
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string | null
  updatedAt: string | null
}

export interface MemberDashboardProps {
  displayName: string
  stats: { pullUps: number; comments: number; suggestions: number }
  pullUps: MemberPullUp[]
  pagination: MemberPagination
  suggestions: MemberSuggestion[]
  latestReleases: MemberRelease[]
}

export interface MemberAccountProps {
  profile: { fullName: string | null; username: string; email: string }
  status?: 'updated' | 'reset-link-sent'
}

export interface MemberSuggestionsProps {
  suggestions: MemberSuggestion[]
  pagination: MemberPagination
  status?: 'submitted'
}
