export type ReleaseShowProps = {
  release: {
    id: string
    title: string
    slug: string
    description: string | null
    date: string | null
    type: string
    cover: string | null
    spotifyId: string | null
    urls: string[]
    artist: {
      id: string
      name: string
      profilePicture?: string | null
      releaseCount?: number | string | null
    } | null
    categories: Array<{
      id: string
      name: string
      slug?: string
    }>
    featuredArtists: Array<{
      id: string
      artistName?: string | null
      artistId?: string | null
      releaseCount?: number | string | null
      profilePicture?: string | null
    }>
    votesSummary: {
      total: number
    }
    reviews: Array<{
      id: string
      comment: string | null
      createdAt: string | null
      user: {
        id: string
        displayName: string
      }
      isCurrentUser: boolean
    }>
    currentUserVote: {
      id: string
      comment: string | null
    } | null
  }
  shareUrl: string
}
