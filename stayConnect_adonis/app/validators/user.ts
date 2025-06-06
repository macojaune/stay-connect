import vine from '@vinejs/vine'
import BaseValidator from './base_validator'

export class UserRegistrationValidator extends BaseValidator {
  protected static schema = vine.object({
    email: vine.string()
      .email()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      })
      .required(),
    password: vine.string()
      .minLength(8)
      .confirmed()
      .required(),
    username: vine.string()
      .minLength(3)
      .maxLength(30)
      .unique(async (db, value) => {
        const user = await db.from('users').where('username', value).first()
        return !user
      })
      .required(),
    name: vine.string()
      .minLength(2)
      .maxLength(50)
      .required(),
    avatar: vine.string()
      .url()
      .optional(),
    bio: vine.string()
      .maxLength(500)
      .optional()
  })
}

export class UserUpdateValidator extends BaseValidator {
  protected static schema = vine.object({
    username: vine.string()
      .minLength(3)
      .maxLength(30)
      .unique(async (db, value, field) => {
        const user = await db.from('users')
          .where('username', value)
          .whereNot('id', field.meta.userId)
          .first()
        return !user
      })
      .optional(),
    name: vine.string()
      .minLength(2)
      .maxLength(50)
      .optional(),
    avatar: vine.string()
      .url()
      .optional(),
    bio: vine.string()
      .maxLength(500)
      .optional(),
    currentPassword: vine.string()
      .requiredWhen('password', (value) => !!value),
    password: vine.string()
      .minLength(8)
      .confirmed()
      .optional()
  })
}