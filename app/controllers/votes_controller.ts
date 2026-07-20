import { HttpContext } from '@adonisjs/core/http'
import Vote from '#models/vote'
import Release from '#models/release'
import { voteValidator } from '#validators/vote'

export default class VotesController {
  /**
   * Create a new vote
   */
  async store({ params, auth, request, response }: HttpContext) {
    const release = await Release.findOrFail(params.releaseId || params.id)
    const user = auth.user!
    const payload = await request.validateUsing(voteValidator)

    // Check if user already voted
    const existingVote = await Vote.query()
      .where('user_id', user.id)
      .where('release_id', release.id)
      .first()

    if (existingVote) {
      return response.redirect().back()
    }

    const data = {
      vote: payload.vote,
      comment: payload.comment || null,
      userId: user.id,
      releaseId: release.id,
    }

    await Vote.create(data)

    // Update release vote count
    await release
      .merge({
        voteCount: release.voteCount + 1,
      })
      .save()

    return response.redirect().back()
  }

  /**
   * Update a vote
   */
  async update({ params, auth, request, response }: HttpContext) {
    const release = await Release.findOrFail(params.releaseId || params.id)
    const user = auth.user!
    const payload = await request.validateUsing(voteValidator)

    const vote = await Vote.query()
      .where('user_id', user.id)
      .where('release_id', release.id)
      .firstOrFail()

    await vote
      .merge({
        vote: payload.vote,
        comment: payload.comment || null,
      })
      .save()

    return response.redirect().back()
  }

  /**
   * Delete a vote
   */
  async destroy({ params, auth, response }: HttpContext) {
    const release = await Release.findOrFail(params.releaseId || params.id)
    const user = auth.user!

    const vote = await Vote.query()
      .where('user_id', user.id)
      .where('release_id', release.id)
      .firstOrFail()

    await vote.delete()

    // Update release vote count
    await release
      .merge({
        voteCount: Math.max(0, release.voteCount - 1),
      })
      .save()

    return response.redirect().back()
  }
}
