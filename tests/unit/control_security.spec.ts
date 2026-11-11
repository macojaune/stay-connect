import { test } from '@japa/runner'
import { rejects } from 'node:assert/strict'
import ControlAuthMiddleware, { acceptsControlToken } from '#middleware/control_auth_middleware'
import { controlOperationValidator } from '#validators/control'
import env from '#start/env'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Macobot service identity', () => {
  test('denies absent, short, mismatched and user-session credentials', async ({ assert }) => {
    const token = 'test-service-identity-'.repeat(3)
    assert.isTrue(acceptsControlToken(token, token))
    for (const [expected, actual] of [
      [undefined, token],
      [token, undefined],
      ['short', 'short'],
      [token, 'session-cookie'],
      [token, token + 'x'],
    ]) {
      assert.isFalse(acceptsControlToken(expected, actual))
    }
    const previous = env.get('STAYCONNECT_CONTROL_TOKEN')
    env.set('STAYCONNECT_CONTROL_TOKEN', token)
    try {
      const ctx = await testUtils.createHttpContext()
      let entered = false
      await new ControlAuthMiddleware().handle(ctx, async () => {
        entered = true
      })
      assert.isFalse(entered)
      assert.equal(ctx.response.getStatus(), 401)
      ctx.request.request.headers.authorization = `Bearer ${token}`
      await new ControlAuthMiddleware().handle(ctx, async () => {
        entered = true
      })
      assert.isTrue(entered)
    } finally {
      env.set('STAYCONNECT_CONTROL_TOKEN', previous)
    }
  })
  test('accepts only bounded operations and refuses arbitrary commands', async ({ assert }) => {
    assert.deepEqual(
      await controlOperationValidator.validate({ action: 'refresh-releases', days: 10 }),
      { action: 'refresh-releases', days: 10 }
    )
    for (const input of [
      { action: 'shell' },
      { action: 'email:weekly-recap' },
      { action: 'refresh-releases', days: 0 },
      { action: 'refresh-releases', days: 31 },
      { action: 'refresh-releases', days: 1.5 },
      { action: 'add-artist', spotifyId: '../bad' },
    ]) {
      await rejects(() => controlOperationValidator.validate(input))
    }
  })
})
