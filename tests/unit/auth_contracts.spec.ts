import { test } from '@japa/runner'
import { errors } from '@vinejs/vine'
import { rejects } from 'node:assert/strict'
import { safeReturnTo, authResumePath } from '#services/auth_redirect'
import { registerValidator, resetPasswordValidator } from '#validators/auth'

test.group('Authentication input contracts', () => {
  test('resumes a failed pull-up on its public support section without replay', ({ assert }) => {
    assert.equal(
      authResumePath('/sorties/fixture-release/avis'),
      '/sorties/fixture-release#soutenir'
    )
    assert.equal(authResumePath('/mon-compte/mot-de-passe'), '/mon-compte')
    for (const path of [
      '//evil.example/avis',
      '/sorties/../../evil/avis',
      '/equipe/sorties',
      '/sorties/%2fevil/avis',
    ]) {
      assert.equal(authResumePath(path), '/')
    }
  })

  test('only resumes public discovery paths and their support anchor', ({ assert }) => {
    assert.equal(
      safeReturnTo('/sorties/jooslyf-jalou-jalouz#soutenir'),
      '/sorties/jooslyf-jalou-jalouz#soutenir'
    )
    assert.equal(safeReturnTo('/artistes/fixture-artist'), '/artistes/fixture-artist')
    assert.equal(safeReturnTo('/artistes?token=secret#other'), '/artistes')
    for (const unsafe of [
      'https://evil.example/',
      '//evil.example/',
      '/\\evil.example',
      '/%2f%2fevil.example',
      '/sorties/../../login',
      '/login',
      '/reset-password?token=secret',
      '/%0aLocation:evil',
      '/sorties/%252f%252fevil.example',
      '/sorties/test%0d%0a',
      undefined,
      42,
    ]) {
      assert.equal(safeReturnTo(unsafe), '/')
    }
  })

  test('normalizes email and rejects mismatched or oversized passwords', async ({ assert }) => {
    const input = {
      name: '  Auditeur  ',
      email: '  Listener@Example.test ',
      password: 'MyGreatPassword1!',
      password_confirmation: 'MyGreatPassword1!',
      returnTo: '/artistes',
    }
    const validated = await registerValidator.validate(input)
    assert.equal(validated.name, 'Auditeur')
    assert.equal(validated.email, 'listener@example.test')
    await rejects(
      () => registerValidator.validate({ ...input, password_confirmation: 'different' }),
      errors.E_VALIDATION_ERROR
    )
    await rejects(
      () =>
        registerValidator.validate({
          ...input,
          password: 'x'.repeat(129),
          password_confirmation: 'x'.repeat(129),
        }),
      errors.E_VALIDATION_ERROR
    )
    await rejects(
      () =>
        resetPasswordValidator.validate({
          token: 'bad-token',
          password: 'MyGreatPassword1!',
          password_confirmation: 'MyGreatPassword1!',
        }),
      errors.E_VALIDATION_ERROR
    )
  })
})
