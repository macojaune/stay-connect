import type { HttpContext } from '@adonisjs/core/http'

/** Keep flash feedback when the installed Inertia adapter asks for an asset reload. */
export async function renderPage<Props extends object>(
  ctx: HttpContext,
  component: string,
  props: Props,
  title: string
) {
  const page = await ctx.inertia.render(component, props, { title })
  if (
    ctx.request.header('X-Inertia') &&
    typeof page === 'object' &&
    ctx.request.header('X-Inertia-Version', '') !== String(page.version)
  ) {
    ctx.session.reflash()
  }
  return page
}
