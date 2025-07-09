import type { GuardContract } from '@adonisjs/auth/types'
import { symbols, errors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

type ApiUser = { id: number; name: string }

export class ApiTokenGuard implements GuardContract<ApiUser> {
  declare [symbols.GUARD_KNOWN_EVENTS]: {
    'auth:authenticationAttempted': { guard: 'api'; user: ApiUser | undefined }
    'auth:authenticationSucceeded': { guard: 'api'; user: ApiUser }
    'auth:authenticationFailed': { guard: 'api'; user: undefined; error: Error }
    'auth:logout': { guard: 'api'; user: ApiUser | null }
  }

  #ctx: HttpContext
  driverName: 'api' = 'api'
  authenticationAttempted: boolean = false
  user?: ApiUser

  constructor(ctx: HttpContext) {
    this.#ctx = ctx
  }

  get isAuthenticated(): boolean {
    return !!this.user
  }

  async check(): Promise<boolean> {
    try {
      await this.authenticate()
    } catch {
      return false
    }
    return this.isAuthenticated
  }

  async authenticate() {
    if (this.authenticationAttempted) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Authorization header not found', {
        guardDriverName: this.driverName,
      })
    }
    this.authenticationAttempted = true

    const authHeader = this.#ctx.request.header('authorization')
    logger.info('Auth header: ' + authHeader)
    if (!authHeader) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Authorization header not found', {
        guardDriverName: this.driverName,
      })
    }

    const apiKey = env.get('API_KEY')
    logger.info('API key: ' + apiKey)
    if (!apiKey) {
      throw new Error('API_KEY environment variable not set')
    }

    if (authHeader !== apiKey) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Invalid API key', {
        guardDriverName: this.driverName,
      })
    }

    this.user = { id: 1, name: 'api-client' }
    return this.user
  }

  getUserOrFail(): ApiUser {
    if (!this.user) {
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: this.driverName,
      })
    }

    return this.user
  }

  async authenticateAsClient(user: ApiUser) {
    this.user = user
    return {
      headers: {
        authorization: env.get('API_KEY'),
      },
    }
  }
}
