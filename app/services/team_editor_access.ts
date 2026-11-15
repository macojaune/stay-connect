import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'

/** Native sign-up does not verify email ownership, so access is bound to user IDs. */
export function canManageCatalog(userId: string | null | undefined): boolean {
  if (!userId) return false
  return (env.get('STAYCONNECT_EDITOR_USER_IDS') ?? '')
    .split(',')
    .some((allowedId) => allowedId.trim() === userId)
}

export function renderCatalogForbidden(ctx: HttpContext) {
  ctx.response.status(403)
  ctx.response.header('Cache-Control', 'no-store')
  ctx.response.header('X-Robots-Tag', 'noindex, nofollow')
  return ctx.inertia.render('errors/forbidden', {})
}

export function renderCatalogNotFound(ctx: HttpContext) {
  ctx.response.status(404)
  ctx.response.header('Cache-Control', 'no-store')
  ctx.response.header('X-Robots-Tag', 'noindex, nofollow')
  return ctx.inertia.render('errors/not_found', {})
}
