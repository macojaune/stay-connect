import Vote from '#models/vote'
import Release from '#models/release'
import User from '#models/user'
import { VoteValidator } from '#validators/vote'

export default class VoteService {
  /**
   * Create a new vote
   */
  async createVote(data: any, userId: string, releaseId: string) {
    const validatedData = await VoteValidator.validate(data)
    
    // Check if user already voted
    const existingVote = await Vote.query()
      .where('user_id', userId)
      .where('release_id', releaseId)
      .first()

    if (existingVote) {
      throw new Error('User has already voted for this release')
    }

    const vote = await Vote.create({
      ...validatedData,
      userId,
      releaseId
    })

    // Update release vote count
    const release = await Release.findOrFail(releaseId)
    await release.merge({ voteCount: release.voteCount + 1 }).save()

    await vote.load((loader) => {
      loader
        .load('user')
        .load('release')
    })

    return vote
  }

  /**
   * Update an existing vote
   */
  async updateVote(vote: Vote, data: any) {
    const validatedData = await VoteValidator.validate(data)
    await vote.merge(validatedData).save()

    await vote.load((loader) => {
      loader
        .load('user')
        .load('release')
    })

    return vote
  }

  /**
   * Delete a vote and update release vote count
   */
  async deleteVote(vote: Vote) {
    const release = await Release.findOrFail(vote.releaseId)
    await vote.delete()

    // Update release vote count
    await release.merge({ voteCount: release.voteCount - 1 }).save()
  }

  /**
   * Get vote details with related data
   */
  async getVoteDetails(vote: Vote) {
    await vote.load((loader) => {
      loader
        .load('user')
        .load('release', (releaseQuery) => {
          releaseQuery.preload('artist')
        })
    })

    return vote
  }

  /**
   * Get votes for a specific release
   */
  async getVotesForRelease(releaseId: string) {
    const votes = await Vote.query()
      .where('release_id', releaseId)
      .preload('user')

    return votes
  }

  /**
   * Get votes by a specific user
   */
  async getVotesByUser(userId: string) {
    const votes = await Vote.query()
      .where('user_id', userId)
      .preload('release', (releaseQuery) => {
        releaseQuery.preload('artist')
      })

    return votes
  }
}