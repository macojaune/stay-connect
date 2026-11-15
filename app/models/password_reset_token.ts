import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class PasswordResetToken extends BaseModel {
  @column({ isPrimary: true })
  declare userId: string

  @column({ serializeAs: null })
  declare tokenHash: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
