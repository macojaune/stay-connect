import vine from '@vinejs/vine'
import { CustomErrorReporter } from './reporter'
import { messages } from './messages'

export default class BaseValidator {
  protected static schema: any

  /**
   * Validate data against the schema
   */
  static async validate(data: any) {
    const validator = vine.compile(this.schema)
    validator.errorReporter = () => new CustomErrorReporter()
    validator.messagesProvider = vine.messagesProvider(messages)
    return await validator.validate(data)
  }
}