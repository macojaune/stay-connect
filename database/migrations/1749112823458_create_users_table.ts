import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.string('full_name').nullable() // Matches fullName in model
      table.string('email', 254).notNullable().unique()
      table.string('username').notNullable().unique()
      table.string('password').notNullable()
      table.timestamp('confirmed_at').nullable()
      table.boolean('is_loxymore').defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}