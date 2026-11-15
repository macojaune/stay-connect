import { Job } from '@rlanz/bull-queue'
import SpotifyService from '#services/spotify_service'

export type ControlOperation = {
  action: 'add-artist' | 'refresh-releases'
  spotifyId?: string
  artistId?: string
  days?: number
}
export default class ControlOperationJob extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  async handle(input: ControlOperation) {
    const spotify = new SpotifyService()
    if (input.action === 'add-artist') {
      const existing = await spotify.findExistingArtistBySpotifyId(input.spotifyId!)
      const artist =
        existing ??
        (await spotify.createArtistFromSpotify(await spotify.getArtistDetails(input.spotifyId!)))
      await this.getJob().updateProgress({
        done: true,
        artist: { id: artist.id, name: artist.name },
        alreadyExists: !!existing,
      })
    } else {
      const stats = await spotify.checkForNewReleases(input.artistId, input.days ?? 4)
      await this.getJob().updateProgress({ done: true, stats })
    }
  }

  async rescue(_input: ControlOperation, _error: Error) {
    this.logger.error('[control] Opération échouée. Consulter les logs privés du worker.')
  }
}
