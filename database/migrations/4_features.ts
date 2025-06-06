import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'features'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.uuid('release_id').references('id').inTable('releases').onDelete('CASCADE')
      table.uuid('artist_id').references('id').inTable('artists').onDelete('CASCADE')
      table.unique(['release_id', 'artist_id'])
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}