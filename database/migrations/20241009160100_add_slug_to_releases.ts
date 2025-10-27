import { BaseSchema } from '@adonisjs/lucid/schema'
import db from '@adonisjs/lucid/services/db'
import string from '@adonisjs/core/helpers/string'
import logger from '@adonisjs/core/services/logger'

export default class AddSlugToReleases extends BaseSchema {
  protected tableName = 'releases'

  public async up() {
    // logger.info('[migration] Adding slug column to releases…')
    // await this.schema.alterTable(this.tableName, (table) => {
    //   table.string('slug').nullable()
    // })
    // logger.info('[migration] done!')

    await db.transaction(async (trx) => {
      logger.info('[migration] start transaction…')

      const releases = await trx
        .from(this.tableName)
        .select('id', 'title', 'artist_id')
        .orderBy('created_at', 'asc')

      const releaseIds = releases.map((release) => release.id)
      const artistIds = releases
        .map((release) => release.artist_id)
        .filter((artistId): artistId is string => typeof artistId === 'string')

      const artists = artistIds.length
        ? await trx.from('artists').select('id', 'name').whereIn('id', artistIds)
        : []
      const features = releaseIds.length
        ? await trx
          .from('features')
          .leftJoin('artists', 'features.artist_id', 'artists.id')
          .select(
            'features.release_id as releaseId',
            'features.artist_name as featureName',
            'artists.name as artistName'
          )
          .whereIn('features.release_id', releaseIds)
        : []
      const artistMap = new Map<string, string>()
      for (const artist of artists) {
        if (artist?.id) {
          artistMap.set(artist.id, artist.name)
        }
      }

      const releaseFeaturesMap = new Map<string, string[]>()
      for (const feature of features) {
        const name = feature.featureName || feature.artistName
        if (!name) {
          continue
        }
        const previous = releaseFeaturesMap.get(feature.releaseId) || []
        if (!previous.includes(name)) {
          previous.push(name)
          releaseFeaturesMap.set(feature.releaseId, previous)
        }
      }

      if (releases.length === 0) {
        logger.info('[migration] No releases found, skipping slug backfill.')
        return
      }

      const usedSlugs = new Set<string>()
      logger.info(`[migration] Backfilling slugs for ${releases.length} releases…`)

      for (const [index, release] of releases.entries()) {
        const artistName =
          release.artist_id && artistMap.has(release.artist_id)
            ? artistMap.get(release.artist_id)!
            : null
        const featureNames = releaseFeaturesMap.get(release.id) || []
        const slugSource = [artistName, ...featureNames, release.title].filter(Boolean).join(' ')
        const baseSlug = string.slug(slugSource).toLowerCase()
        let candidate = baseSlug
        let attempt = 1

        while (usedSlugs.has(candidate)) {
          candidate = `${baseSlug}-${attempt++}`
        }

        usedSlugs.add(candidate)

        await trx.from(this.tableName).where('id', release.id).update({ slug: candidate })

        if ((index + 1) % 50 === 0 || index === releases.length - 1) {
          logger.info(
            `[migration] Processed ${index + 1}/${releases.length} releases (latest slug: ${candidate}).`
          )
        }
      }
    })

    logger.info('[migration] Finalizing slug column constraints…')
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
    } else {
      logger.info('[migration] Unique constraint releases_slug_unique already exists, skipping.')
    }
    logger.info('[migration] Slug migration finished successfully.')
  }

  public async down() {
    await this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('slug')
    })
  }
}
