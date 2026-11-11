import { createHash, timingSafeEqual } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'

export function acceptsControlToken(expected: string | undefined, actual: string | undefined) {
  if (!expected || expected.length < 32 || !actual) return false
  const digest = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(expected), digest(actual))
}

export default class ControlAuthMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    response.header('Cache-Control', 'no-store')
    if (
      !acceptsControlToken(
        env.get('STAYCONNECT_CONTROL_TOKEN'),
        request.header('authorization')?.startsWith('Bearer ')
          ? request.header('authorization')!.slice(7)
          : undefined
      )
    ) {
      return response.unauthorized({ error: 'Service non autorisé.' })
    }
    return next()
  }
}
