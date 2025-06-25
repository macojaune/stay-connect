import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, beforeCreate, hasOne, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { cuid } from '@adonisjs/core/helpers' // Import cuid for UUID generation
import { DateTime } from 'luxon'
import Artist from './artist.js'
import Vote from './vote.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  public static assignCuid(user: User) {
    user.id = cuid()
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
