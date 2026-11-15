import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { errors } from '@vinejs/vine'
import { errorDetails } from '#exceptions/error_details'
import {
  authValidationUrl,
  authPageUrl,
  safeReturnTo,
  authResumePath,
} from '#services/auth_redirect'

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
    '500..599': (error, { inertia, request }) =>
      inertia.render('errors/server_error', {
        message:
          this.debug && typeof error.message === 'string'
            ? error.message
            : 'Une erreur serveur est survenue.',
        requestId: request.id(),
      }),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    const details = errorDetails(error)
    // Handle Vine validation errors
    if (error instanceof errors.E_VALIDATION_ERROR) {
      if (this.wantsWebResponse(ctx)) {
        const fields: Record<string, string> = {}
        for (const message of error.messages) {
          if (
            typeof message === 'object' &&
            message !== null &&
            'field' in message &&
            typeof message.field === 'string' &&
            'message' in message &&
            typeof message.message === 'string' &&
            !fields[message.field]
          ) {
            fields[message.field] = message.message
          }
        }
        ctx.session.flashErrors(fields)
        const authDestination = authValidationUrl(
          ctx.request.url(),
          ctx.request.input('returnTo'),
          ctx.request.input('token')
        )
        if (authDestination) return ctx.response.redirect().toPath(authDestination)
        return ctx.response.redirect().back()
      }
      return ctx.response.status(422).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.messages,
      })
    }

    // Handle authentication errors
    if (details.code === 'E_UNAUTHORIZED_ACCESS') {
      if (this.wantsWebResponse(ctx)) {
        const requestedPage = authResumePath(ctx.request.url())
        return ctx.response.redirect().toPath(authPageUrl('/login', safeReturnTo(requestedPage)))
      }
      return ctx.response.status(401).json({
        status: 'error',
        message: 'Unauthorized access',
        error: details.message,
      })
    }

    // Handle not found errors
    if (details.code === 'E_ROW_NOT_FOUND') {
      if (this.wantsWebResponse(ctx)) {
        ctx.response.status(404)
        const page = await ctx.inertia.render('errors/not_found')
        return ctx.response.send(page)
      }
      return ctx.response.status(404).json({
        status: 'error',
        message: 'Resource not found',
        error: details.message,
      })
    }

    // Handle database errors
    if (details.code?.startsWith('ER_')) {
      return ctx.response.status(500).json({
        status: 'error',
        message: 'Database error occurred',
        error: this.debug ? details.message : 'Internal server error',
      })
    }

    // Handle business logic errors
    if (details.code === 'E_BUSINESS_RULE') {
      return ctx.response.status(400).json({
        status: 'error',
        message: details.message,
        error:
          typeof error === 'object' && error !== null && 'details' in error
            ? error.details
            : undefined,
      })
    }

    return super.handle(error, ctx)
  }

  private wantsWebResponse(ctx: HttpContext) {
    return (
      !ctx.request.url().startsWith('/api/') &&
      (Boolean(ctx.request.header('X-Inertia')) || ctx.request.accepts(['html', 'json']) === 'html')
    )
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
      ...errorDetails(error),
      url: ctx.request.url(),
      method: ctx.request.method(),
      ip: ctx.request.ip(),
      timestamp: new Date().toISOString(),
    })

    return super.report(error, ctx)
  }
}
