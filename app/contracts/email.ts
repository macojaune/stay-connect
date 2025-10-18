export interface ReleaseHighlight {
  id: string
  title: string
  slug: string
  artistName: string | null
  type: string | null
  releaseDate?: string | null
  releaseDateLabel?: string | null
  detailUrl: string
  coverUrl?: string | null
  categories: string[]
  primaryUrl?: string | null
}

export interface WeeklyRecapEmailPayload {
  user: {
    email: string
    fullName?: string | null
  }
  period: {
    startIso: string
    endIso: string
    label: string
  }
  summary: {
    totalNewReleases: number
  }
  releases: ReleaseHighlight[]
}
