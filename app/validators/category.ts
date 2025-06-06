import vine from '@vinejs/vine'
import BaseValidator from './base_validator'

export class CategoryValidator extends BaseValidator {
  protected static schema = vine.object({
    name: vine.string()
      .minLength(2)
      .maxLength(50)
      .unique(async (db, value, field) => {
        const query = db.from('categories').where('name', value)
        if (field.meta?.categoryId) {
          query.whereNot('id', field.meta.categoryId)
        }
        const category = await query.first()
        return !category
      })
      .required(),
    description: vine.string()
      .maxLength(500)
      .optional()
  })
}