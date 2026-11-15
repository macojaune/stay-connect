import vine from '@vinejs/vine'

export const categoryValidator = vine.withMetaData<{ categoryId?: string }>().compile(
  vine.object({
    name: vine
      .string()
      .minLength(2)
      .maxLength(50)
      .unique(async (db, value, field) => {
        const query = db.from('categories').where('name', value)
        if (field.meta?.categoryId) {
          query.whereNot('id', field.meta.categoryId)
        }
        const category = await query.first()
        return !category
      }),
    description: vine.string().maxLength(500).optional(),
  })
)

export const categoryAssignmentValidator = vine.compile(
  vine.object({ categoryId: vine.string().uuid() })
)
