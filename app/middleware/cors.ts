import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

/**
 * Middleware to handle CORS (Cross-Origin Resource Sharing)
 */
export default class CorsMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Get allowed origins from environment variables or use default
    const allowedOrigins = env.get('ALLOWED_ORIGINS', '').split(',').filter(Boolean)
    const origin = ctx.request.header('origin')

    // Check if the request origin is allowed
    if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
      ctx.response.header('Access-Control-Allow-Origin', origin)
    }

    // Handle preflight requests
    if (ctx.request.method() === 'OPTIONS') {
      ctx.response
        .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
        .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        .header('Access-Control-Max-Age', '86400') // 24 hours
        .status(204)

      return
    }

    // Set other CORS headers
    ctx.response
      .header('Access-Control-Allow-Credentials', 'true')
      .header('Access-Control-Expose-Headers', 'Content-Disposition')

    // Continue to the next middleware/route handler
    await next()
  }
}