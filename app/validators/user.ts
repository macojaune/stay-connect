import vine from '@vinejs/vine'

export const userRegistrationValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(8).confirmed(),
    username: vine
      .string()
      .minLength(3)
      .maxLength(30)
      .unique(async (db, value) => {
        const user = await db.from('users').where('username', value).first()
        return !user
      }),
    name: vine.string().minLength(2).maxLength(50),
    avatar: vine.string().url().optional(),
    bio: vine.string().maxLength(500).optional(),
  })
)

export const userUpdateValidator = vine.compile(
  vine.object({
    username: vine
      .string()
      .minLength(3)
      .maxLength(30)
      .unique(async (db, value, field) => {
        const user = await db
          .from('users')
          .where('username', value)
          .whereNot('id', field.meta.userId)
          .first()
        return !user
      })
      .optional(),
    name: vine.string().minLength(2).maxLength(50).optional(),
    avatar: vine.string().url().optional(),
    bio: vine.string().maxLength(500).optional(),
    currentPassword: vine.string().optional().requiredIfExists('password'),
    password: vine.string().minLength(8).confirmed().optional(),
  })
)
