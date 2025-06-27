import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'
import { BaseModel, beforeCreate, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import Artist from '#models/artist'
import Vote from '#models/vote'
import type { HasOne, HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  public static assignUuid(user: User) {
    user.id = randomUUID()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare fullName: string | null

  @column()
  declare email: string
  @column({ serializeAs: null })
  declare password: string
  @column()
  declare username: string

  @column({
    serializeAs: null,
  })
  declare hashedPassword: string

  @column.dateTime()
  declare confirmedAt: DateTime | null

  @column()
  declare isLoxymore: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relationships
  @hasOne(() => Artist)
  declare artist: HasOne<typeof Artist>

  @hasMany(() => Vote)
  declare votes: HasMany<typeof Vote>
}
