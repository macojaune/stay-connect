import { errors } from '@adonisjs/core/http'
import { test } from '@japa/runner'

import HttpExceptionHandler from '#exceptions/handler'

test.group('HttpExceptionHandler report', () => {
  test('skips logging ignored route-not-found exceptions', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const logs: unknown[][] = []

    await handler.report(new errors.E_ROUTE_NOT_FOUND(['GET', '/.env']), {
      logger: {
        log: (...args: unknown[]) => logs.push(args),
      },
      request: {
        id: () => 'req-route-not-found',
      },
    } as any)

    assert.lengthOf(logs, 0)
  })

  test('logs reportable server errors', async ({ assert }) => {
    const handler = new HttpExceptionHandler()
    const logs: unknown[][] = []

    await handler.report(new Error('boom'), {
      logger: {
        log: (...args: unknown[]) => logs.push(args),
      },
      request: {
        id: () => 'req-server-error',
      },
    } as any)

    assert.lengthOf(logs, 1)
    assert.equal(logs[0]?.[0], 'error')
    assert.equal(logs[0]?.[2], 'boom')
  })
})
