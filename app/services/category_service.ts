import Category from '#models/category'
import { CategoryValidator } from '#validators/category'

export default class CategoryService {
  /**
   * Create a new category
   */
  async createCategory(data: any) {
    const validatedData = await CategoryValidator.validate(data)
    const category = await Category.create(validatedData)

    await category.load((loader) => {
      loader
        .load('artists')
        .load('releases')
    })

    return category
  }

  /**
   * Update category details
   */
  async updateCategory(category: Category, data: any) {
    const validatedData = await CategoryValidator.validate(data)
    await category.merge(validatedData).save()

    await category.load((loader) => {
      loader
        .load('artists')
        .load('releases')
    })

    return category
  }

  /**
   * Delete a category and cleanup relationships
   */
  async deleteCategory(category: Category) {
    // Remove associations with artists and releases
    await category.related('artists').detach()
    await category.related('releases').detach()
    
    // Delete the category
    await category.delete()
  }

  /**
   * Get category details with related data
   */
  async getCategoryDetails(category: Category) {
    await category.load((loader) => {
      loader
        .load('artists', (artistQuery) => {
          artistQuery.preload('releases', (releaseQuery) => {
            releaseQuery.withCount('votes')
          })
        })
        .load('releases', (releaseQuery) => {
          releaseQuery
            .preload('artist')
            .withCount('votes')
        })
    })

    return category
  }

  /**
   * Get popular categories based on artist and release counts
   */
  async getPopularCategories(limit: number = 10) {
    const categories = await Category.query()
      .withCount('artists')
      .withCount('releases')
      .orderBy('artists_count', 'desc')
      .orderBy('releases_count', 'desc')
      .limit(limit)

    return categories
  }

  /**
   * Find a category by slug or ID
   */
  async findBySlugOrId(identifier: string) {
    const category = await Category.query()
      .where('id', identifier)
      .orWhere('slug', identifier)
      .firstOrFail()

    return category
  }
}