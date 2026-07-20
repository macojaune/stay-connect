import { BaseModel, beforeCreate, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

export default class ArtistSuggestion extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(suggestion: ArtistSuggestion) {
    suggestion.id = randomUUID()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare sourceUrl: string | null

  @column()
  declare message: string | null

  @column()
  declare status: 'pending' | 'accepted' | 'rejected'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
