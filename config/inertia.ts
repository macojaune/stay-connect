import env from '#start/env'
import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'

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
      const serializeAuth = () => {
        const user = ctx?.auth?.user

        if (!user || !('email' in user)) {
          return { user: null }
        }

        return {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            username: user.username,
          },
        }
      }

      // Inertia also resolves shared props while rendering an error page, without a request context.
      return ctx?.inertia ? ctx.inertia.always(serializeAuth) : serializeAuth()
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

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}
