import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateSonglinkCacheTable extends BaseSchema {
  protected tableName = 'songlink_caches'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().notNullable()
      table.text('source_url').notNullable().unique()
      table.jsonb('payload').notNullable()
      table.timestamp('fetched_at', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
