import User from '#models/user'
import { userRegistrationValidator, userUpdateValidator } from '#validators/user'

export default class UserService {
  /**
   * Create a new user
   */
  async createUser(data: unknown) {
    const validatedData = await userRegistrationValidator.validate(data)
    return await User.create({
      email: validatedData.email,
      username: validatedData.username,
      fullName: validatedData.name,
      password: validatedData.password,
    })
  }

  /**
   * Update user details
   */
  async updateUser(user: User, data: unknown) {
    const validatedData = await userUpdateValidator.validate(data, { meta: { userId: user.id } })
    return await user
      .merge({
        ...(validatedData.username !== undefined ? { username: validatedData.username } : {}),
        ...(validatedData.name !== undefined ? { fullName: validatedData.name } : {}),
        ...(validatedData.password !== undefined ? { password: validatedData.password } : {}),
      })
      .save()
  }

  /**
   * Delete a user and cleanup related data
   */
  async deleteUser(user: User) {
    // Delete related votes
    await user.related('votes').query().delete()

    // If user is an artist, handle artist deletion
    const artist = await user.related('artist').query().first()
    if (artist) {
      // Remove category associations
      await artist.related('categories').detach()
      // Delete releases
      const releases = await artist.related('releases').query()
      for (const release of releases) {
        // Remove category associations from releases
        await release.related('categories').detach()
        // Delete votes for the release
        await release.related('votes').query().delete()
        // Delete the release
        await release.delete()
      }
      // Delete the artist
      await artist.delete()
    }

    // Finally delete the user
    await user.delete()
  }

  /**
   * Get user profile with related data
   */
  async getUserProfile(user: User) {
    await user.load((loader) => {
      loader
        .load('artist', (artistQuery) => {
          artistQuery.preload('categories').preload('releases', (releaseQuery) => {
            releaseQuery.preload('categories').withCount('votes')
          })
        })
        .load('votes', (voteQuery) => {
          voteQuery.preload('release')
        })
    })

    return user
  }
}
