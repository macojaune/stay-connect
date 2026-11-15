import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import ApiResponseMiddleware from '#middleware/api_response'

test.group('API response content types', () => {
  test('wraps a JSON response with charset parameters', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()
    const payload = { releases: [] }

    await new ApiResponseMiddleware().handle(ctx, async () => {
      ctx.response.header('content-type', 'application/json; charset=utf-8').send(payload)
    })

    assert.deepEqual(ctx.response.getBody(), { status: 'success', data: payload })
  })

  test('recognizes JSON when the header is represented as an array', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()
    const payload = { count: 3 }

    await new ApiResponseMiddleware().handle(ctx, async () => {
      ctx.response.header('content-type', ['application/json; charset=utf-8']).send(payload)
    })

    assert.deepEqual(ctx.response.getBody(), { status: 'success', data: payload })
  })

  test('preserves a non-JSON response', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()

    await new ApiResponseMiddleware().handle(ctx, async () => {
      ctx.response.header('content-type', 'text/plain').send('ready')
    })

    assert.equal(ctx.response.getBody(), 'ready')
  })

  test('does not throw when a content-type header is numeric', async ({ assert }) => {
    const ctx = await testUtils.createHttpContext()

    await new ApiResponseMiddleware().handle(ctx, async () => {
      ctx.response.response.setHeader('content-type', 42)
      assert.strictEqual(ctx.response.getHeader('content-type'), 42)
      ctx.response.send('ready')
    })

    assert.equal(ctx.response.getBody(), 'ready')
  })
})
