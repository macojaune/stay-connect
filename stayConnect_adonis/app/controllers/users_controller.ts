import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class UsersController {
  /**
   * Display a list of users
   */
  async index({ response }: HttpContext) {
    const users = await User.all()
    return response.json(users)
  }

  /**
   * Display a single user
   */
  async show({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return response.json(user)
  }

  /**
   * Update user details
   */
  async update({ params, request, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const data = request.only(['fullName', 'email', 'username'])
    
    await user.merge(data).save()
    return response.json(user)
  }

  /**
   * Delete a user
   */
  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.noContent()
  }
}