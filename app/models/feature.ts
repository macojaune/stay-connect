import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import Artist from '#models/artist'
import Release from '#models/release'

export default class Feature extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  public static assignUuid(feature: Feature) {
    feature.id = randomUUID()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare releaseId: string

  @column({ columnName: 'artist_id' })
  declare artistId: string | null

  @column({ columnName: 'artist_name' })
  declare artistName: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Release)
  declare release: BelongsTo<typeof Release>

  @belongsTo(() => Artist, {
    foreignKey: 'artistId',
  })
  declare artist: BelongsTo<typeof Artist>
}
