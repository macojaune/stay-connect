import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('artist_suggestions', (table) => {
      // Historical suggestions remain unowned. An email match does not prove ownership.
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
      table.index(['user_id', 'created_at'])
    })
  }

  async down() {
    this.schema.alterTable('artist_suggestions', (table) => {
      table.dropIndex(['user_id', 'created_at'])
      table.dropColumn('user_id')
    })
  }
}
