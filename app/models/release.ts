import Artist from '#models/artist'
import Category from '#models/category'
import Feature from '#models/feature'
import Vote from '#models/vote'
import {
  BaseModel,
  beforeCreate,
  belongsTo,
  column,
  hasMany,
  manyToMany,
} from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'
import { randomUUID } from 'node:crypto'

export default class Release extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  public static assignUuid(release: Release) {
    release.id = randomUUID()
  }

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare title: string

  @column()
  declare description: string

  @column.dateTime()
  declare date: DateTime

  @column()
  declare type: string

  @column({
    prepare: (value: string[]) => JSON.stringify(value),
    // consume: (value: string) => JSON.parse(value),
    serializeAs: 'urls',
  })
  declare urls: string[]

  @column()
  declare cover: string | null

  @column({ columnName: 'is_secret' })
  declare isSecret: boolean

  @column({ columnName: 'is_automated' })
  declare isAutomated: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column({ columnName: 'vote_count' })
  declare voteCount: number

  @column()
  declare spotifyId: string | null

  @column()
  declare artistId: string | null

  @hasMany(() => Vote)
  declare votes: HasMany<typeof Vote>

  @manyToMany(() => Category, {
    pivotTable: 'release_categories',
    localKey: 'id',
    pivotForeignKey: 'release_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'category_id',
  })
  declare categories: ManyToMany<typeof Category>

  @belongsTo(() => Artist, {
    foreignKey: 'artistId',
  })
  declare artist: BelongsTo<typeof Artist>

  @hasMany(() => Feature, {
    localKey: 'id',
    foreignKey: 'releaseId',
  })
  declare features: HasMany<typeof Feature>
}
