import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'
import { errorDetails } from '#exceptions/error_details'
import type { IncomingHttpHeaders } from 'node:http'

/**
 * Middleware to log API requests for debugging and monitoring
 */
export default class RequestLoggerMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const startTime = process.hrtime()

    try {
      // Log request details
      this.logRequest(ctx)

      // Continue to the next middleware/route handler
      await next()

      // Log response details
      this.logResponse(ctx, startTime)
    } catch (error) {
      // Log error details
      this.logError(ctx, error, startTime)

      // Re-throw the error to be handled by the exception handler
      throw error
    }
  }

  /**
   * Log request details
   */
  private logRequest(ctx: HttpContext) {
    logger.info(
      {
        requestId: ctx.request.id(),
        method: ctx.request.method(),
        url: ctx.request.url(),
        headers: this.sanitizeHeaders(ctx.request.headers()),
        body: this.sanitizeBody(ctx.request.body()),
        ip: ctx.request.ip(),
        timestamp: new Date().toISOString(),
      },
      'API Request'
    )
  }

  /**
   * Log response details
   */
  private logResponse(ctx: HttpContext, startTime: [number, number]) {
    const responseTime = this.calculateResponseTime(startTime)
    const statusCode = ctx.response.getStatus()

    logger.info(
      {
        requestId: ctx.request.id(),
        statusCode,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
      'API Response'
    )
  }

  /**
   * Log error details
   */
  private logError(ctx: HttpContext, error: unknown, startTime: [number, number]) {
    const responseTime = this.calculateResponseTime(startTime)

    logger.error(
      {
        requestId: ctx.request.id(),
        error: errorDetails(error),
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
      'API Error'
    )
  }

  /**
   * Calculate response time in milliseconds
   */
  private calculateResponseTime(startTime: [number, number]): number {
    const [seconds, nanoseconds] = process.hrtime(startTime)
    return seconds * 1000 + nanoseconds / 1000000
  }

  /**
   * Remove sensitive information from headers
   */
  private sanitizeHeaders(headers: IncomingHttpHeaders): IncomingHttpHeaders {
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'set-cookie',
      'x-api-key',
      'api-key',
      'x-csrf-token',
      'x-xsrf-token',
      // Reset links may contain a bearer credential in their query string.
      'referer',
    ]
    const sanitized = { ...headers }

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    }

    return sanitized
  }

  /**
   * Remove sensitive information from request body
   */
  private sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = [
      'password',
      'password_confirmation',
      'confirmPassword',
      'currentPassword',
      'token',
      'apiKey',
      'api_key',
    ]
    const sanitized = { ...body }

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }
}
