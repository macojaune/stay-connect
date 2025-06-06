import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { errors } from '@vinejs/vine'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (error, { inertia }) => inertia.render('errors/not_found', { error }),
    '500..599': (error, { inertia }) => inertia.render('errors/server_error', { error }),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    // Handle Vine validation errors
    if (error instanceof errors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.messages
      })
    }

    // Handle authentication errors
    if ((error as any).code === 'E_UNAUTHORIZED_ACCESS') {
      return ctx.response.status(401).json({
        status: 'error',
        message: 'Unauthorized access',
        error: (error as Error).message
      })
    }

    // Handle not found errors
    if ((error as any).code === 'E_ROW_NOT_FOUND') {
      return ctx.response.status(404).json({
        status: 'error',
        message: 'Resource not found',
        error: (error as Error).message
      })
    }

    // Handle database errors
    if ((error as any).code?.startsWith('ER_')) {
      return ctx.response.status(500).json({
        status: 'error',
        message: 'Database error occurred',
        error: this.debug ? (error as Error).message : 'Internal server error'
      })
    }

    // Handle business logic errors
    if ((error as any).code === 'E_BUSINESS_RULE') {
      return ctx.response.status(400).json({
        status: 'error',
        message: (error as Error).message,
        error: (error as any).details
      })
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    // Log error details
    console.error('Error:', {
      message: (error as Error).message,
      stack: (error as Error).stack,
      url: ctx.request.url(),
      method: ctx.request.method(),
      ip: ctx.request.ip(),
      timestamp: new Date().toISOString()
    })

    return super.report(error, ctx)
  }
}
