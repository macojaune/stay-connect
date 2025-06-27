import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'release_categories'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
    })
  }
}