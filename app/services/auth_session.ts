import type { HttpContext } from '@adonisjs/core/http'
import type User from '#models/user'

const versionKey = 'auth_version_web'

export async function startUserSession(ctx: HttpContext, user: User) {
  await ctx.auth.use('web').login(user)
  ctx.session.put(versionKey, user.authVersion)
}

export async function enforceSessionVersion(ctx: HttpContext) {
  const guard = ctx.auth.use('web')
  const user = guard.user
  if (user && ctx.session.get(versionKey) !== user.authVersion) {
    // Sessions created before versioning also require a new login, once.
    await guard.logout()
    ctx.session.forget(versionKey)
  }
}
