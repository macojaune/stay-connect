import vine from '@vinejs/vine'
import BaseValidator from './base_validator'

export class ArtistValidator extends BaseValidator {
  protected static schema = vine.object({
    name: vine.string()
      .minLength(2)
      .maxLength(100)
      .unique(async (db, value, field) => {
        const query = db.from('artists').where('name', value)
        if (field.meta?.artistId) {
          query.whereNot('id', field.meta.artistId)
        }
        const artist = await query.first()
        return !artist
      })
      .required(),
    bio: vine.string()
      .maxLength(1000)
      .optional(),
    location: vine.string()
      .maxLength(100)
      .optional(),
    website: vine.string()
      .url()
      .optional(),
    socialLinks: vine.object({
      facebook: vine.string().url().optional(),
      twitter: vine.string().url().optional(),
      instagram: vine.string().url().optional(),
      soundcloud: vine.string().url().optional(),
      spotify: vine.string().url().optional(),
      youtube: vine.string().url().optional()
    }).optional(),
    categories: vine.array(vine.string().uuid()).optional(),
    features: vine.array(
      vine.object({
        name: vine.string().maxLength(50).required(),
        value: vine.string().maxLength(200).required()
      })
    ).optional()
  })
}