import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'artists'

  async up() {
    // Add Spotify ID to artists table
    this.schema.alterTable(this.tableName, (table) => {
      table.string('spotify_id').nullable().unique()
      table.timestamp('last_spotify_check').nullable()
    })

    // Add Spotify ID to releases table
    this.schema.alterTable('releases', (table) => {
      table.string('spotify_id').nullable().unique()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('spotify_id')
      table.dropColumn('last_spotify_check')
    })

    this.schema.alterTable('releases', (table) => {
      table.dropColumn('spotify_id')
    })
  }
}
