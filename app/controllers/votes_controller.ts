import { HttpContext } from '@adonisjs/core/http'
import Vote from '#models/vote'
import Release from '#models/release'

export default class VotesController {
  /**
   * Create a new vote
   */
  async store({ params, auth, request, response }: HttpContext) {
    const release = await Release.findOrFail(params.id)
    const user = auth.user!
    
    // Check if user already voted
    const existingVote = await Vote.query()
      .where('user_id', user.id)
      .where('release_id', release.id)
      .first()

    if (existingVote) {
      return response.badRequest({
        message: 'User has already voted for this release'
      })
    }

    const data = {
      vote: request.input('vote'),
      userId: user.id,
      releaseId: release.id
    }

    const vote = await Vote.create(data)
    
    // Update release vote count
    await release.merge({
      voteCount: release.voteCount + 1
    }).save()

    return response.json(vote)
  }

  /**
   * Update a vote
   */
  async update({ params, auth, request, response }: HttpContext) {
    const release = await Release.findOrFail(params.id)
    const user = auth.user!

    const vote = await Vote.query()
      .where('user_id', user.id)
      .where('release_id', release.id)
      .firstOrFail()

    await vote.merge({
      vote: request.input('vote')
    }).save()

    return response.json(vote)
  }

  /**
   * Delete a vote
   */
  async destroy({ params, auth, response }: HttpContext) {
    const release = await Release.findOrFail(params.id)
    const user = auth.user!

    const vote = await Vote.query()
      .where('user_id', user.id)
      .where('release_id', release.id)
      .firstOrFail()

    await vote.delete()

    // Update release vote count
    await release.merge({
      voteCount: release.voteCount - 1
    }).save()

    return response.noContent()
  }
}