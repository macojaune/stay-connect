import { HttpContext } from "@adonisjs/core/http"
import Artist from "../models/artist"
import Category from "#models/category"

export default class ArtistsController {
  /**
   * Display a list of artists
   */
  async index({ response }: HttpContext) {
    const artists = await Artist.query().preload("categories")
    return response.json(artists)
  }

  /**
   * Create a new artist
   */
  async store({ request, response }: HttpContext) {
    const data = request.only([
      "name",
      "description",
      "socials",
      "profilePicture",
      "userId",
    ])
    const artist = await Artist.create(data)
    await artist.load("categories")
    return response.json(artist)
  }

  /**
   * Display a single artist
   */
  async show({ params, response }: HttpContext) {
    const artist = await Artist.findOrFail(params.id)
    await artist.load("categories")
    return response.json(artist)
  }

  /**
   * Update artist details
   */
  async update({ params, request, response }: HttpContext) {
    const artist = await Artist.findOrFail(params.id)
    const data = request.only([
      "name",
      "description",
      "socials",
      "profilePicture",
      "isVerified",
    ])

    await artist.merge(data).save()
    await artist.load("categories")
    return response.json(artist)
  }

  /**
   * Delete an artist
   */
  async destroy({ params, response }: HttpContext) {
    const artist = await Artist.findOrFail(params.id)
    await artist.delete()
    return response.noContent()
  }

  /**
   * Add a category to an artist
   */
  async addCategory({ params, request, response }: HttpContext) {
    const artist = await Artist.findOrFail(params.id)
    const categoryId = request.input("categoryId")
    const category = await Category.findOrFail(categoryId)

    await artist.related("categories").attach([category.id])
    await artist.load("categories")
    return response.json(artist)
  }

  /**
   * Remove a category from an artist
   */
  async removeCategory({ params, response }: HttpContext) {
    const artist = await Artist.findOrFail(params.id)
    await artist.related("categories").detach([params.categoryId])
    await artist.load("categories")
    return response.json(artist)
  }
}
