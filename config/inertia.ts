import env from '#start/env'
import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'
import type { HttpContext } from '@adonisjs/core/http'

function serializeAuth(ctx?: HttpContext) {
  const user = ctx?.auth?.use('web').user

  if (!user) return { user: null }

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
    },
  }
}

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    umamiURL: env.get('UMAMI_SCRIPT_URL', ''),
    umamiID: env.get('UMAMI_WEBSITE_ID', ''),
    auth: (ctx) => {
      // Inertia also resolves shared props while rendering an error page, without a request context.
      return ctx?.inertia ? ctx.inertia.always(() => serializeAuth(ctx)) : serializeAuth(ctx)
    },
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: true,
    entrypoint: 'inertia/app/ssr.tsx',
  },
})

export default inertiaConfig

// Inertia 3.1 does not unwrap an AlwaysProp union with its error-page fallback.
// Infer auth from the serializer used by both branches, never from a duplicate user interface.
type AppSharedProps = Omit<InferSharedProps<typeof inertiaConfig>, 'auth'> & {
  auth: ReturnType<typeof serializeAuth>
}

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends AppSharedProps {}
}
