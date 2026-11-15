import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AdonisInertiaMiddleware from '@adonisjs/inertia/inertia_middleware'

@inject()
export default class InertiaMiddleware {
  constructor(private readonly adapter: AdonisInertiaMiddleware) {}

  async handle(ctx: HttpContext, next: NextFn) {
    await this.adapter.handle(ctx, next)
    if (
      ctx.request.method() === 'GET' &&
      [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/mon-espace',
        '/mon-compte',
        '/mon-espace/propositions',
        '/artistes',
      ].includes(ctx.request.url()) &&
      ctx.request.header('X-Inertia') &&
      ctx.response.getStatus() === 409 &&
      ctx.response.getHeader('X-Inertia-Location')
    ) {
      // Adapter 3.1 uses request.url() here, dropping reset tokens and returnTo on asset reloads.
      ctx.response.header('X-Inertia-Location', ctx.request.url(true))
    }
  }
}
