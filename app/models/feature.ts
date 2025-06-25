import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { cuid } from '@adonisjs/core/helpers'
import Release from './Release.js'
import Artist from './Artist.js'

export default class Feature extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  public static assignCuid(feature: Feature) {
    feature.id = cuid()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare releaseId: string

  @column()
  declare artistId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Release)
  declare release: BelongsTo<typeof Release>

  @belongsTo(() => Artist)
  declare artist: BelongsTo<typeof Artist>
}