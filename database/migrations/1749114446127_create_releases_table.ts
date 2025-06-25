import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'releases'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.string('title').notNullable()
      table.text('description').notNullable()
      table.timestamp('date').notNullable()
      table.string('type').notNullable()
      table.json('urls').notNullable()
      table.string('cover').nullable()
      table.boolean('is_secret').defaultTo(false)
      table.boolean('is_automated').defaultTo(false)
      table.uuid('artist_id').references('id').inTable('artists').onDelete('CASCADE')
      table.integer('vote_count').notNullable().defaultTo(0)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
