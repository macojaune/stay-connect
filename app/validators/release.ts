import vine from '@vinejs/vine'
import BaseValidator from './base_validator'

export class ReleaseValidator extends BaseValidator {
  protected static schema = vine.object({
    title: vine.string()
      .minLength(1)
      .maxLength(200)
      .unique(async (db, value, field) => {
        const query = db.from('releases')
          .where('title', value)
          .where('artist_id', field.meta.artistId)
        if (field.meta?.releaseId) {
          query.whereNot('id', field.meta.releaseId)
        }
        const release = await query.first()
        return !release
      })
      .required(),
    description: vine.string()
      .maxLength(1000)
      .optional(),
    releaseDate: vine.date()
      .required(),
    type: vine.enum(['album', 'single', 'ep'])
      .required(),
    coverArt: vine.string()
      .url()
      .optional(),
    streamingLinks: vine.object({
      spotify: vine.string().url().optional(),
      appleMusic: vine.string().url().optional(),
      soundcloud: vine.string().url().optional(),
      youtube: vine.string().url().optional(),
      bandcamp: vine.string().url().optional(),
      other: vine.array(
        vine.object({
          platform: vine.string().required(),
          url: vine.string().url().required()
        })
      ).optional()
    }).optional(),
    categories: vine.array(vine.string().uuid()).optional(),
    features: vine.array(
      vine.object({
        name: vine.string().maxLength(50).required(),
        value: vine.string().maxLength(200).required()
      })
    ).optional(),
    tracks: vine.array(
      vine.object({
        title: vine.string().maxLength(200).required(),
        duration: vine.string().regex(/^\d{2}:\d{2}$/).required(),
        trackNumber: vine.number().min(1).required(),
        previewUrl: vine.string().url().optional()
      })
    ).optional()
  })
}