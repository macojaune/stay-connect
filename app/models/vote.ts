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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, {
    foreignKey: 'user_id',
  })
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Release, {
    foreignKey: 'release_id',
  })
  declare release: BelongsTo<typeof Release>
}
