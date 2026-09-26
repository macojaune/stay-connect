import { test } from '@japa/runner'
import { mock } from 'node:test'
import logger from '@adonisjs/core/services/logger'
import testUtils from '@adonisjs/core/services/test_utils'
import RequestLoggerMiddleware from '#middleware/request_logger'

test('request logging hides authentication headers and accepts non-Error exceptions', async ({
  assert,
}) => {
  const records: unknown[][] = []
  const info = mock.method(logger, 'info', (...args: unknown[]) => {
    records.push(args)
  })
  const error = mock.method(logger, 'error', (...args: unknown[]) => {
    records.push(args)
  })
  try {
    const ctx = await testUtils.createHttpContext()
    ctx.request.request.headers['x-api-key'] = 'fixture-cron-secret'
    ctx.request.request.headers['authorization'] = 'fixture-api-secret'
    ctx.request.request.headers['cookie'] = 'fixture-cookie-secret'
    const failure = { code: 42, message: 'Fixture failure' }

    let thrown: unknown
    try {
      await new RequestLoggerMiddleware().handle(ctx, async () => {
        throw failure
      })
    } catch (caught) {
      thrown = caught
    }

    assert.strictEqual(thrown, failure)
    const serialized = JSON.stringify(records)
    assert.notInclude(serialized, 'fixture-cron-secret')
    assert.notInclude(serialized, 'fixture-api-secret')
    assert.notInclude(serialized, 'fixture-cookie-secret')
    assert.include(serialized, '[REDACTED]')
    assert.include(serialized, 'Fixture failure')
  } finally {
    info.mock.restore()
    error.mock.restore()
  }
})
