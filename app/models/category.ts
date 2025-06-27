import { BaseModel, beforeCreate, beforeSave, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import string from '@adonisjs/core/helpers/string'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import Artist from '#models/artist'
import Release from '#models/release'

export default class Category extends BaseModel {
  static selfAssignPrimaryKey = true
  @beforeCreate()
  static assignUuid(category: Category) {
    category.id = randomUUID()
  }
  @beforeSave()
  public static async generateSlug(category: Category) {
    if (category.name) {
      category.slug = string.slug(category.name)
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
    pivotTimestamps: true,
  })
  declare artists: ManyToMany<typeof Artist>

  @manyToMany(() => Release, {
    pivotTable: 'release_categories',
    localKey: 'id',
    pivotForeignKey: 'category_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'release_id',
    pivotTimestamps: true,
  })
  declare releases: ManyToMany<typeof Release>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
