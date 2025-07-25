import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'features'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('artist_id').nullable().alter()
      table.string('artist_name').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('artist_id').notNullable().alter()
      table.dropColumn('artist_name')
    })
  }
}