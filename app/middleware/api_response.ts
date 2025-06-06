import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to standardize API responses
 */
export default class ApiResponseMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    try {
      // Continue to the next middleware/route handler
      await next()

      // Get the response
      const response = ctx.response.getBody()

      // Skip formatting for non-JSON responses
      if (!ctx.response.getHeader('content-type')?.includes('application/json')) {
        return
      }

      // Format successful response
      ctx.response.send({
        status: 'success',
        data: response
      })
    } catch (error) {
      // Let the exception handler deal with errors
      throw error
    }
  }
}