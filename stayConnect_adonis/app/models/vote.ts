import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { cuid } from '@adonisjs/core/helpers'
import User from './User.js'
import Release from './Release.js'

export default class Vote extends BaseModel {
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