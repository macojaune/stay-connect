import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { cuid } from '@adonisjs/core/helpers'
import Artist from './Artist.js'
import Category from './Category.js'

export default class ArtistCategory extends BaseModel {
  @beforeCreate()
  public static assignCuid(artistCategory: ArtistCategory) {
    artistCategory.id = cuid()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare artistId: string

  @column()
  declare categoryId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Artist)
  declare artist: BelongsTo<typeof Artist>

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>
}