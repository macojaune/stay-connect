import { ErrorReporterContract, FieldContext, ErrorReporterResponse } from '@vinejs/vine'
import { messages } from './messages'

/**
 * Custom error reporter for formatting validation error messages
 */
export class CustomErrorReporter implements ErrorReporterContract {
  /**
   * A collection of validation error messages
   */
  private errors: Record<string, any> = {}

  /**
   * Report a validation error for a field
   */
  report(
    message: string,
    rule: string,
    field: FieldContext,
    meta?: Record<string, any>
  ) {
    const fieldName = field.wildCardPath || field.name

    /**
     * Normalize the error message by replacing placeholders
     */
    const normalizedMessage = this.normalizeMessage(
      message,
      field.name,
      rule,
      meta || {}
    )

    /**
     * Handle nested fields using dot notation
     */
    if (fieldName.includes('.')) {
      this.handleNestedField(fieldName, normalizedMessage)
      return
    }

    /**
     * Add error message to the collection
     */
    this.errors[fieldName] = this.errors[fieldName] || []
    this.errors[fieldName].push(normalizedMessage)
  }

  /**
   * Create the error response
   */
  createError(): ErrorReporterResponse {
    return {
      errors: this.errors
    }
  }

  /**
   * Handle nested field errors using dot notation
   */
  private handleNestedField(fieldPath: string, message: string) {
    const parts = fieldPath.split('.')
    let current = this.errors

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i]
      current[part] = current[part] || {}
      current = current[part]
    }

    const lastPart = parts[parts.length - 1]
    current[lastPart] = current[lastPart] || []
    current[lastPart].push(message)
  }

  /**
   * Replace message placeholders with actual values
   */
  private normalizeMessage(
    message: string,
    field: string,
    rule: string,
    meta: Record<string, any>
  ): string {
    // Get custom message from messages object if available
    const customMessage = this.getCustomMessage(field, rule)
    message = customMessage || message

    // Replace field placeholder
    message = message.replace(/{{\s*field\s*}}/g, field)

    // Replace other placeholders from meta object
    Object.keys(meta).forEach((key) => {
      const value = meta[key]
      message = message.replace(
        new RegExp(`{{\\s*${key}\\s*}}`, 'g'),
        Array.isArray(value) ? value.join(', ') : String(value)
      )
    })

    return message
  }

  /**
   * Get custom message from messages object
   */
  private getCustomMessage(field: string, rule: string): string | undefined {
    // Check for field-specific message
    const fieldMessage = messages[field]?.[rule]
    if (fieldMessage) return fieldMessage

    // Check for rule-specific message
    return messages[rule]
  }
}