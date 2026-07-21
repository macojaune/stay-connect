import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      const hasArtistNameColumn = await db.schema.hasColumn('features', 'artist_name')
      if (!hasArtistNameColumn) {
        await db.schema.alterTable('features', (table) => {
          table.string('artist_name').nullable()
        })
      }

      const hasSpotifyArtistIdColumn = await db.schema.hasColumn('features', 'spotify_artist_id')
      if (!hasSpotifyArtistIdColumn) {
        await db.schema.alterTable('features', (table) => {
          table.string('spotify_artist_id').nullable()
        })
      }

      await db.rawQuery(`
        UPDATE features
        SET artist_name = COALESCE(NULLIF(trim(features.artist_name), ''), artists.name),
            spotify_artist_id = artists.spotify_id,
            updated_at = NOW()
        FROM artists
        WHERE features.artist_id = artists.id
          AND (
            features.artist_name IS NULL
            OR trim(features.artist_name) = ''
            OR features.spotify_artist_id IS NULL
          )
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      const hasSpotifyArtistIdColumn = await db.schema.hasColumn('features', 'spotify_artist_id')
      if (hasSpotifyArtistIdColumn) {
        await db.schema.alterTable('features', (table) => {
          table.dropColumn('spotify_artist_id')
        })
      }
    })
  }
}
