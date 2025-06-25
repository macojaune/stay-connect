import {
  BaseModel,
  column,
  hasMany,
  manyToMany,
  belongsTo,
  beforeCreate,
} from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import { cuid } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import Vote from './vote.js'
import Category from './category.js'
import Artist from './artist.js'
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
    foreignKey: 'artist_id',
  })
  declare artist: BelongsTo<typeof Artist>

  @manyToMany(() => Artist, {
    pivotTable: 'features',
    localKey: 'id',
    pivotForeignKey: 'release_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'artist_id',
  })
  declare featurings: ManyToMany<typeof Artist>
}
