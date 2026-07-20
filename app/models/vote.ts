import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import Release from '#models/release'
import User from '#models/user'

export default class Vote extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  public static assignUuid(vote: Vote) {
    vote.id = randomUUID()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare vote: number

  @column()
  declare comment: string | null

  @column({ columnName: 'user_id' })
  declare userId: string

  @column({ columnName: 'release_id' })
  declare releaseId: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Release, { foreignKey: 'releaseId' })
  declare release: BelongsTo<typeof Release>
}
