import { HttpContext } from '@adonisjs/core/http'
import Release from '#models/release'
import Category from '#models/category'

export default class ReleasesController {
  /**
   * Display a list of releases
   */
  async index({ response }: HttpContext) {
    const releases = await Release.query()
      .preload('artist')
      .preload('categories')
    return response.json(releases)
  }

  /**
   * Create a new release
   */
  async store({ request, response }: HttpContext) {
    const data = request.only([
      'title',
      'description',
      'date',
      'type',
      'urls',
      'cover',
      'isSecret',
      'isAutomated',
      'artistId'
    ])

    const release = await Release.create(data)
    await release.load('artist')
    await release.load('categories')
    return response.json(release)
  }

  /**
   * Display a single release
   */
  async show({ params, response }: HttpContext) {
    const release = await Release.findOrFail(params.id)
    await release.load('artist')
    await release.load('categories')
    await release.load('votes')
    return response.json(release)
  }

  /**
   * Update release details
   */
  async update({ params, request, response }: HttpContext) {
    const release = await Release.findOrFail(params.id)
    const data = request.only([
      'title',
      'description',
      'date',
      'type',
      'urls',
      'cover',
      'isSecret',
      'isAutomated'
    ])
    
    await release.merge(data).save()
    await release.load('artist')
    await release.load('categories')
    return response.json(release)
  }

  /**
   * Delete a release
   */
  async destroy({ params, response }: HttpContext) {
    const release = await Release.findOrFail(params.id)
    await release.delete()
    return response.noContent()
  }

  /**
   * Add a category to a release
   */
  async addCategory({ params, request, response }: HttpContext) {
    const release = await Release.findOrFail(params.id)
    const categoryId = request.input('categoryId')
    const category = await Category.findOrFail(categoryId)
    
    await release.related('categories').attach([category.id])
    await release.load('categories')
    return response.json(release)
  }

  /**
   * Remove a category from a release
   */
  async removeCategory({ params, response }: HttpContext) {
    const release = await Release.findOrFail(params.id)
    await release.related('categories').detach([params.categoryId])
    await release.load('categories')
    return response.json(release)
  }
}