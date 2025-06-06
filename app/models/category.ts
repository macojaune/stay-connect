import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany, beforeSave } from '@adonisjs/lucid/orm'
import { string } from '@adonisjs/core/helpers'
import Artist from './artist.js'
import Release from './release.js'

export default class Category extends BaseModel {
  @beforeSave()
  public static async generateSlug(category: Category) {
    if (category.name) {
      category.slug = string.slugify(category.name)
    }
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string

  @manyToMany(() => Artist, {
    pivotTable: 'artist_categories',
    localKey: 'id',
    pivotForeignKey: 'category_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'artist_id',
  })
  declare artists: ManyToMany<typeof Artist>

  @manyToMany(() => Release, {
    pivotTable: 'release_categories',
    localKey: 'id',
    pivotForeignKey: 'category_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'release_id',
  })
  declare releases: ManyToMany<typeof Release>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}