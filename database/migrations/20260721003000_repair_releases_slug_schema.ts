import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'
import string from '@adonisjs/core/helpers/string'

export default class extends BaseSchema {
  protected tableName = 'releases'

  async up() {
    const hasSlugColumn = await this.schema.hasColumn(this.tableName, 'slug')

    if (!hasSlugColumn) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.string('slug').nullable()
      })
    }

    const releases = await db
      .from(this.tableName)
      .select('id', 'title', 'slug')
      .whereNull('slug')
      .orderBy('created_at', 'asc')
    const existingSlugs = await db.from(this.tableName).whereNotNull('slug').select('slug')
    const usedSlugs = new Set(existingSlugs.map((release) => release.slug))

    for (const release of releases) {
      const baseSlug = (string.slug(release.title) || 'sortie').toLowerCase()
      let slug = baseSlug
      let suffix = 1

      while (usedSlugs.has(slug)) {
        slug = `${baseSlug}-${suffix++}`
      }

      usedSlugs.add(slug)
      await db.from(this.tableName).where('id', release.id).update({ slug })
    }

    await this.schema.alterTable(this.tableName, (table) => {
      table.string('slug').notNullable().alter()
    })

    const existingConstraint = await db
      .from('pg_constraint')
      .where('conname', 'releases_slug_unique')
      .first()

    if (!existingConstraint) {
      await this.schema.alterTable(this.tableName, (table) => {
        table.unique(['slug'], 'releases_slug_unique')
      })
    }
  }

  async down() {
    // This repair intentionally preserves the column created by the original migration.
  }
}
