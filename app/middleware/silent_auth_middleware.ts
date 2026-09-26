import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { enforceSessionVersion } from '#services/auth_session'

/**
 * Silent auth middleware can be used as a global middleware to silent check
 * if the user is logged-in or not.
 *
 * The request continues as usual, even when the user is not logged-in.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()
    await enforceSessionVersion(ctx)

    return next()
  }
}
