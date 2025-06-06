import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'artists'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable().defaultTo(this.db.rawQuery('uuid_generate_v4()').knexQuery)
      table.string('name').notNullable()
      table.text('description').nullable()
      table.json('socials').nullable().defaultTo('[]')
      table.string('profile_picture').nullable()
      table.json('followers').nullable().defaultTo('{}')
      table.boolean('is_verified').defaultTo(false)
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}