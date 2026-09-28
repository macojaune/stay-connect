import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'artist_territories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.uuid('artist_id').notNullable().references('id').inTable('artists').onDelete('CASCADE')
      table.string('territory_code', 2).notNullable()
      table.string('source_kind', 32).notNullable()
      table.text('source_reference').nullable()
      table.text('source_note').notNullable()
      table
        .uuid('verified_by_user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('RESTRICT')
      table.timestamp('verified_at').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
      table.unique(['artist_id', 'territory_code'])
      table.check("territory_code in ('GP', 'MQ', 'GF')")
      table.check("source_kind in ('artist_declaration', 'public_source')")
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
