import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import Artist from '#models/artist'
import User from '#models/user'
import type { TerritoryCode, TerritorySourceKind } from '#contracts/territories'

export default class ArtistTerritory extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(affiliation: ArtistTerritory) {
    affiliation.id = randomUUID()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare artistId: string

  @column()
  declare territoryCode: TerritoryCode

  @column()
  declare sourceKind: TerritorySourceKind

  @column()
  declare sourceReference: string | null

  @column()
  declare sourceNote: string

  @column()
  declare verifiedByUserId: string

  @column.dateTime()
  declare verifiedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Artist)
  declare artist: BelongsTo<typeof Artist>

  @belongsTo(() => User, { foreignKey: 'verifiedByUserId' })
  declare verifier: BelongsTo<typeof User>
}
