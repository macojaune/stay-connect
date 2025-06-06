import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany, belongsTo, beforeCreate } from '@adonisjs/lucid/orm'
import type { HasMany, ManyToMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import { cuid } from '@adonisjs/core/helpers'
import User from './User'
import Category from './Category'
import Release from './Release'
import ArtistCategory from './ArtistCategory'
import Feature from './Feature'

export default class Artist extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({
    prepare: (value: string[] | null) => value ? JSON.stringify(value) : null,
    consume: (value: string | null) => value ? JSON.parse(value) : [],
  })
  declare socials: string[] | null

  @column()
  declare profilePicture: string | null

  @column({
    prepare: (value: Record<string, any> | null) => value ? JSON.stringify(value) : null,
    consume: (value: string | null) => value ? JSON.parse(value) : {},
  })
  declare followers: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime

  @column()
  declare isVerified: boolean

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => Category, {
    pivotTable: 'artist_categories',
    localKey: 'id',
    pivotForeignKey: 'artist_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'category_id',
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
  })
  declare featured: ManyToMany<typeof Release>
}