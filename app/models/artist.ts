import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  hasMany,
  manyToMany,
  belongsTo,
  beforeCreate,
  computed,
} from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'node:crypto'
import Category from '#models/category'
import Release from '#models/release'
import User from '#models/user'

export type ArtistFollowers = {
  spotify?: number
  lastUpdated?: string
} & Record<string, unknown>

export default class Artist extends BaseModel {
  static selfAssignPrimaryKey = true

  @beforeCreate()
  static assignUuid(artist: Artist) {
    artist.id = randomUUID()
  }
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({
    prepare: (value: Record<string, string> | null) => (value ? JSON.stringify(value) : null),
    // consume: (value: string | null) => (value ? JSON.parse(value) : {}),
  })
  declare socials: Record<string, string> | null

  @column()
  declare profilePicture: string | null

  @column({
    prepare: (value: ArtistFollowers | null) => (value ? JSON.stringify(value) : null),
    // consume: (value: string | null) => (value ? JSON.parse(value) : {}),
  })
  declare followers: ArtistFollowers | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare isVerified: boolean

  @column()
  declare spotifyId: string | null

  @column.dateTime()
  declare lastSpotifyCheck: DateTime | null

  @column()
  declare userId: string | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Category, {
    pivotTable: 'artist_categories',
    localKey: 'id',
    pivotForeignKey: 'artist_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'category_id',
    pivotTimestamps: true,
  })
  declare categories: ManyToMany<typeof Category>

  @hasMany(() => Release)
  declare releases: HasMany<typeof Release>

  @manyToMany(() => Release, {
    pivotTable: 'features',
    localKey: 'id',
    pivotForeignKey: 'artist_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'release_id',
    pivotTimestamps: true,
  })
  declare featured: ManyToMany<typeof Release>

  @computed()
  get releaseCount(): number | null {
    const raw: unknown = this.$extras?.releases_count ?? this.$extras?.release_count

    if (raw === null || raw === undefined) {
      return null
    }

    if (typeof raw === 'number') {
      return Number.isFinite(raw) ? raw : null
    }

    if (typeof raw === 'string') {
      const parsed = Number.parseInt(raw, 10)
      return Number.isFinite(parsed) ? parsed : null
    }

    return null
  }
}
