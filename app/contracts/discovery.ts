export type TimelineRelease = {
  id: string
  title: string
  slug: string
  artist: string
  date: string
  dateIso: string
  boostCount: number
  type: string
  category: string
  imageUrl: string | null
  featuredArtists: string[]
}

export type TimelineWeek = {
  title: string
  subtitle: string
  isUpcoming: boolean
  weekStart: string
  news: TimelineRelease[]
}
