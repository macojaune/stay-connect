import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.integer('auth_version').notNullable().defaultTo(0)
    })

    this.schema.createTable('password_reset_tokens', (table) => {
      table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE')
      table.string('token_hash', 64).notNullable().unique()
      table.timestamp('expires_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable('password_reset_tokens')
    this.schema.alterTable('users', (table) => {
      table.dropColumn('auth_version')
    })
  }
}
