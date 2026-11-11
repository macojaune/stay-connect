import type { HttpContext } from '@adonisjs/core/http'
import queue from '@rlanz/bull-queue/services/main'
import ControlOperationJob from '#jobs/control_operation_job'
import SpotifyService from '#services/spotify_service'
import Artist from '#models/artist'
import { controlOperationValidator, controlSearchValidator } from '#validators/control'

const operationId = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default class ControlController {
  async search({ request, response }: HttpContext) {
    const { query } = await request.validateUsing(controlSearchValidator)
    const spotify = new SpotifyService()
    const results = await spotify.searchArtistsFormatted(query, 4)
    const known = results.length
      ? await Artist.query().whereIn(
          'spotifyId',
          results.map((artist) => artist.id)
        )
      : []
    return response.ok({
      artists: results.map((artist) => ({
        spotifyId: artist.id,
        name: artist.name,
        genres: artist.genres ?? [],
        spotifyUrl: artist.spotifyUrl,
        alreadyExists: known.some((row) => row.spotifyId === artist.id),
      })),
    })
  }

  async create({ request, response }: HttpContext) {
    const id = request.header('idempotency-key') ?? ''
    if (!operationId.test(id))
      return response.badRequest({ error: 'Identifiant de requête UUID v4 requis.' })
    const input = await request.validateUsing(controlOperationValidator)
    if (
      (input.action === 'add-artist' && (!input.spotifyId || input.artistId || input.days)) ||
      (input.action === 'refresh-releases' && input.spotifyId)
    ) {
      return response.unprocessableEntity({ error: 'Paramètres incompatibles avec cette action.' })
    }
    if (input.artistId && !(await Artist.find(input.artistId)))
      return response.notFound({ error: 'Artiste introuvable.' })
    // Retain jobs for seven days, so a lost HTTP response can be replayed safely.
    await queue.dispatch(ControlOperationJob, input, {
      jobId: `control-${id}`,
      attempts: 1,
      removeOnComplete: { age: 7 * 86400 },
      removeOnFail: { age: 7 * 86400 },
    })
    const stored = await queue.getOrSet().getJob(`control-${id}`)
    if (!stored || JSON.stringify(stored.data) !== JSON.stringify(input)) {
      return response.conflict({ error: 'Identifiant déjà utilisé pour une autre opération.' })
    }
    return response.accepted({ id, state: await stored.getState() })
  }

  async show({ params, response }: HttpContext) {
    const id = String(params.id)
    if (!operationId.test(id)) return response.notFound({ error: 'Opération introuvable.' })
    const job = await queue.getOrSet().getJob(`control-${id}`)
    if (!job) return response.notFound({ error: 'Opération introuvable ou expirée.' })
    const state = await job.getState()
    return response.ok({
      id,
      action: job.data.action,
      state,
      result: state === 'completed' ? job.progress : null,
      error:
        state === 'failed' ? 'Le traitement a échoué. Vérifier le worker avant de relancer.' : null,
    })
  }
}
