import { test } from '@japa/runner'
import { rejects } from 'node:assert/strict'
import { errors } from '@vinejs/vine'
import { artistSuggestionValidator } from '#validators/artist_suggestion'
import { memberProfileValidator, memberSuggestionValidator } from '#validators/member'
import { safeReturnTo } from '#services/auth_redirect'
import { memberPage } from '#services/member_service'

test.group('Member input contracts', () => {
  test('only the public display name can be updated', async ({ assert }) => {
    const result = await memberProfileValidator.validate({
      name: '  Nouveau pseudo  ',
      email: 'changed@example.test',
      userId: 'another-user',
      username: 'admin',
      password: 'InjectedPassword1!',
      authVersion: 0,
      isLoxymore: true,
    })
    assert.deepEqual(result, { name: 'Nouveau pseudo' })
    await rejects(() => memberProfileValidator.validate({ name: ' ' }), errors.E_VALIDATION_ERROR)
  })

  test('public and member suggestions require an HTTP source and reject dangerous protocols', async ({
    assert,
  }) => {
    const valid = {
      name: 'Fixture artist',
      email: 'contact@example.test',
      sourceUrl: 'https://example.test/music',
    }
    await artistSuggestionValidator.validate(valid)
    const member = await memberSuggestionValidator.validate({
      ...valid,
      userId: 'injected',
      status: 'accepted',
    })
    assert.deepEqual(member, { name: 'Fixture artist', sourceUrl: valid.sourceUrl })
    for (const sourceUrl of [
      undefined,
      '',
      'javascript:alert(1)',
      'data:text/html,fixture',
      'ftp://example.test/artist',
    ]) {
      await rejects(
        () => artistSuggestionValidator.validate({ ...valid, sourceUrl }),
        errors.E_VALIDATION_ERROR
      )
      await rejects(
        () => memberSuggestionValidator.validate({ ...valid, sourceUrl }),
        errors.E_VALIDATION_ERROR
      )
    }
  })

  test('member destinations are allowlisted and pagination is bounded', ({ assert }) => {
    for (const path of ['/mon-espace', '/mon-espace/propositions', '/mon-compte']) {
      assert.equal(safeReturnTo(path), path)
    }
    assert.equal(safeReturnTo('/mon-compte/supprimer'), '/')
    assert.equal(memberPage('2'), 2)
    for (const page of [undefined, 'bad', '-1', '1.2', '10001', {}, []])
      assert.equal(memberPage(page), 1)
  })
})
