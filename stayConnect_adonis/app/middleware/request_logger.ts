import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import logger from '@adonisjs/core/services/logger'

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
    const { method, url, headers, body } = ctx.request

    logger.info('API Request', {
      requestId: ctx.request.id(),
      method: method,
      url: url,
      headers: this.sanitizeHeaders(headers),
      body: this.sanitizeBody(body),
      ip: ctx.request.ip(),
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log response details
   */
  private logResponse(ctx: HttpContext, startTime: [number, number]) {
    const responseTime = this.calculateResponseTime(startTime)
    const statusCode = ctx.response.getStatus()

    logger.info('API Response', {
      requestId: ctx.request.id(),
      statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Log error details
   */
  private logError(ctx: HttpContext, error: any, startTime: [number, number]) {
    const responseTime = this.calculateResponseTime(startTime)

    logger.error('API Error', {
      requestId: ctx.request.id(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    })
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
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie']
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
  private sanitizeBody(body: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'confirmPassword', 'currentPassword', 'token', 'apiKey']
    const sanitized = { ...body }

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    }

    return sanitized
  }
}