// User types
export interface User {
  id: number
  email: string
  fullName?: string
  createdAt: string
  updatedAt: string
}

// Artist types
export interface Artist {
  id: number
  name: string
  bio?: string
  imageUrl?: string
  spotifyId?: string
  genres: string[]
  socialLinks?: {
    twitter?: string
    instagram?: string
    facebook?: string
    website?: string
  }
  totalVotes: number
  averageRating: number
  releases: Release[]
  createdAt: string
  updatedAt: string
}

// Release types
export interface Release {
  id: number
  title: string
  type: 'album' | 'single' | 'ep'
  releaseDate: string
  coverImageUrl?: string
  spotifyId?: string
  description?: string
  artistId: number
  artist: Artist
  tracks: Track[]
  totalVotes: number
  averageRating: number
  createdAt: string
  updatedAt: string
}

// Track types
export interface Track {
  id: number
  title: string
  duration?: number // in seconds
  trackNumber: number
  spotifyId?: string
  previewUrl?: string
  releaseId: number
  createdAt: string
  updatedAt: string
}

// Vote types
export interface Vote {
  id: number
  rating: number // 1-5 scale
  comment?: string
  userId: number
  user: User
  artistId?: number
  releaseId?: number
  createdAt: string
  updatedAt: string
}

// Category types
export interface Category {
  id: number
  name: string
  description?: string
  createdAt: string
  updatedAt: string
}

// Feature types
export interface Feature {
  id: number
  title: string
  description: string
  imageUrl?: string
  isActive: boolean
  artistId?: number
  releaseId?: number
  createdAt: string
  updatedAt: string
}

// Pagination types
export interface PaginationMeta {
  total: number
  perPage: number
  currentPage: number
  lastPage: number
  firstPage: number
  firstPageUrl: string
  lastPageUrl: string
  nextPageUrl?: string
  previousPageUrl?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

// Form types
export interface LoginForm {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterForm {
  email: string
  password: string
  passwordConfirmation: string
  fullName?: string
}

export interface VoteForm {
  rating: number
  comment?: string
}

export interface SearchFilters {
  query?: string
  genre?: string
  releaseType?: 'album' | 'single' | 'ep'
  sortBy?: 'name' | 'releaseDate' | 'rating' | 'votes'
  sortOrder?: 'asc' | 'desc'
  page?: number
  perPage?: number
}

// Inertia page props
export interface PageProps {
  auth?: {
    user?: User
  }
  flash?: {
    success?: string
    error?: string
    info?: string
    warning?: string
  }
  errors?: Record<string, string>
}

// Component props
export interface ArtistCardProps {
  artist: Artist
  showVoting?: boolean
  className?: string
}

export interface ReleaseCardProps {
  release: Release
  showVoting?: boolean
  className?: string
}

export interface VotingComponentProps {
  targetId: number
  targetType: 'artist' | 'release'
  currentVote?: Vote
  onVoteSubmit?: (vote: VoteForm) => void
}

// Spotify integration types
export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  preview_url?: string
  track_number: number
  album: SpotifyAlbum
  artists: SpotifyArtist[]
  explicit: boolean
  type: 'track'
  external_urls: {
    [key: string]: string
  }
}
export interface SpotifyAlbum {
  id: string
  name: string
  release_date: string
  album_type: 'album' | 'single' | 'compilation'
  images: Array<{
    url: string
    height: number
    width: number
  }>
  artists: Array<{
    id: string
    name: string
  }>
  tracks: {
    items: Array<{
      id: string
      name: string
      duration_ms: number
      preview_url?: string
      track_number: number
    }>
  }
  external_urls: {
    [key: string]: string
  }
}
export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: Array<{
    url: string
    height: number
    width: number
  }>
  followers: {
    total: number
  }
  external_urls: {
    [key: string]: string
  }
}

export interface SpotifyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

// Search-related interfaces
export interface SpotifySearchResult {
  id: string
  name: string
  genres: string[]
  followers: number
  images: Array<{
    url: string
    height: number
    width: number
  }>
  spotifyUrl: string
}

export interface CreateArtistOptions {
  description?: string
  socials?: string[]
  categories?: string[]
}

export interface SearchAndCreateResult {
  searchResults: SpotifySearchResult[]
  createdArtist?: Artist
  error?: string
}
