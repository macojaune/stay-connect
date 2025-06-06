import { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'

export default class CategoriesController {
  /**
   * Display a list of categories
   */
  async index({ response }: HttpContext) {
    const categories = await Category.query()
      .preload('artists')
      .preload('releases')
    return response.json(categories)
  }

  /**
   * Create a new category
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['name', 'description'])
    const category = await Category.create(data)
    
    await category.load('artists')
    await category.load('releases')
    return response.json(category)
  }

  /**
   * Display a single category
   */
  async show({ params, response }: HttpContext) {
    // Allow finding by ID or slug
    const category = await Category.query()
      .where('id', params.id)
      .orWhere('slug', params.id)
      .firstOrFail()

    await category.load('artists')
    await category.load('releases')
    return response.json(category)
  }

  /**
   * Update category details
   */
  async update({ params, request, response }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    const data = request.only(['name', 'description'])
    
    await category.merge(data).save()
    await category.load('artists')
    await category.load('releases')
    return response.json(category)
  }

  /**
   * Delete a category
   */
  async destroy({ params, response }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    await category.delete()
    return response.noContent()
  }
}