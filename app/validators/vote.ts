import vine from '@vinejs/vine'
import BaseValidator from './base_validator'

export class VoteValidator extends BaseValidator {
  protected static schema = vine.object({
    vote: vine.number()
      .integer()
      .min(1)
      .max(5)
      .required()
  })
}