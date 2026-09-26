export type ArtistDirectorySort = 'name' | 'recent'

export interface ArtistPagination {
  page: number
  perPage: number
  total: number
  lastPage: number
}

export interface ArtistReleasePreview {
  id: string
  title: string
  slug: string
  date: string | null
  type: string
  cover: string | null
}

export interface ArtistDirectoryEntry {
  id: string
  name: string
  profilePicture: string | null
  releaseCount: number
  latestRelease: ArtistReleasePreview | null
}

export interface ArtistIndexProps {
  artists: ArtistDirectoryEntry[]
  filters: { q: string; sort: ArtistDirectorySort }
  pagination: ArtistPagination
  flash: { success?: string }
}

export interface ArtistCredit {
  id: string | null
  name: string
}

export interface ArtistRelease extends ArtistReleasePreview {
  artist: ArtistCredit | null
  featuredArtists: ArtistCredit[]
  role: 'main' | 'featured'
}

export interface ArtistShowProps {
  artist: {
    id: string
    name: string
    description: string | null
    profilePicture: string | null
    categories: { id: string; name: string }[]
    links: { label: string; url: string }[]
  }
  releases: ArtistRelease[]
  pagination: ArtistPagination
}
