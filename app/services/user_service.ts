import User from "#models/user"
import {
  UserRegistrationValidator,
  UserUpdateValidator,
} from "../validators/user"

export default class UserService {
  /**
   * Create a new user
   */
  async createUser(data: any) {
    const validatedData = await UserRegistrationValidator.validate(data)
    return await User.create(validatedData)
  }

  /**
   * Update user details
   */
  async updateUser(user: User, data: any) {
    const validatedData = await UserUpdateValidator.validate(data)
    return await user.merge(validatedData).save()
  }

  /**
   * Delete a user and cleanup related data
   */
  async deleteUser(user: User) {
    // Delete related votes
    await user.related("votes").query().delete()

    // If user is an artist, handle artist deletion
    const artist = await user.related("artist").query().first()
    if (artist) {
      // Remove category associations
      await artist.related("categories").detach()
      // Delete releases
      const releases = await artist.related("releases").query()
      for (const release of releases) {
        // Remove category associations from releases
        await release.related("categories").detach()
        // Delete votes for the release
        await release.related("votes").query().delete()
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
        .load("artist", (artistQuery) => {
          artistQuery
            .preload("categories")
            .preload("releases", (releaseQuery) => {
              releaseQuery.preload("categories").withCount("votes")
            })
        })
        .load("votes", (voteQuery) => {
          voteQuery.preload("release")
        })
    })

    return user
  }
}
