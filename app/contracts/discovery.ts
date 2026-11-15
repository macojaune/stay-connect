import type { TerritoryCode } from '#contracts/territories'

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
  territories: TerritoryCode[]
}

export type TimelineWeek = {
  title: string
  subtitle: string
  isUpcoming: boolean
  weekStart: string
  news: TimelineRelease[]
}
