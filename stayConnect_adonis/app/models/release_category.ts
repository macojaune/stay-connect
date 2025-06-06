import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { cuid } from '@adonisjs/core/helpers'
import Release from './Release.js'
import Category from './Category.js'

export default class ReleaseCategory extends BaseModel {
  @beforeCreate()
  public static assignCuid(releaseCategory: ReleaseCategory) {
    releaseCategory.id = cuid()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare releaseId: string

  @column()
  declare categoryId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Release)
  declare release: BelongsTo<typeof Release>

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>
}