import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'

export default class extends BaseSchema {
  async up() {
    const hasArtistNameColumn = await this.schema.hasColumn('features', 'artist_name')
    if (!hasArtistNameColumn) {
      await this.schema.alterTable('features', (table) => {
        table.string('artist_name').nullable()
      })
    }

    const hasSpotifyArtistIdColumn = await this.schema.hasColumn('features', 'spotify_artist_id')
    if (!hasSpotifyArtistIdColumn) {
      await this.schema.alterTable('features', (table) => {
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
  }

  async down() {
    const hasSpotifyArtistIdColumn = await this.schema.hasColumn('features', 'spotify_artist_id')
    if (hasSpotifyArtistIdColumn) {
      await this.schema.alterTable('features', (table) => {
        table.dropColumn('spotify_artist_id')
      })
    }
  }
}
