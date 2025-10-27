import { DateTime } from 'luxon'
import {
  BaseModel,
  beforeCreate,
  column,
} from '@adonisjs/lucid/orm'
import { randomUUID } from 'node:crypto'

export default class SonglinkCache extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  public static assignUuid(cache: SonglinkCache) {
    cache.id = randomUUID()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare sourceUrl: string

  @column()
  declare payload: Record<string, unknown>

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ columnName: 'fetched_at' })
  declare fetchedAt: DateTime
}
