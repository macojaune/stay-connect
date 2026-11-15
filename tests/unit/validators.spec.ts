import { test } from '@japa/runner'
import { rejects } from 'node:assert/strict'
import vine, { errors } from '@vinejs/vine'
import { DateTime } from 'luxon'
import { artistValidator, createArtistValidator, updateArtistValidator } from '#validators/artist'
import { categoryAssignmentValidator } from '#validators/category'
import { createReleaseValidator, updateReleaseValidator } from '#validators/release'
import { rules } from '#validators/rules'
import { voteValidator } from '#validators/vote'

test.group('Typed input validation', () => {
  test('future dates are checked against the current time, not only the day', async ({
    assert,
  }) => {
    const validator = vine.compile(vine.object({ date: rules.futureDate.clone() }))
    const future = DateTime.now().plus({ minutes: 5 }).toFormat('yyyy-MM-dd HH:mm:ss')
    const past = DateTime.now().minus({ minutes: 5 }).toFormat('yyyy-MM-dd HH:mm:ss')

    const result = await validator.validate({ date: future })
    assert.instanceOf(result.date, Date)
    await rejects(async () => {
      await validator.validate({ date: past })
    }, errors.E_VALIDATION_ERROR)
    await rejects(async () => {
      await validator.validate({ date: 'not-a-date' })
    }, errors.E_VALIDATION_ERROR)
  })

  test('vote values must remain whole numbers from one through five', async ({ assert }) => {
    const validator = vine.compile(vine.object({ vote: rules.voteValue.clone() }))

    const minimum = await validator.validate({ vote: 1 })
    const maximum = await validator.validate({ vote: 5 })
    assert.equal(minimum.vote, 1)
    assert.equal(maximum.vote, 5)
    for (const vote of [0, 6, 1.5, 'invalid']) {
      await rejects(async () => {
        await validator.validate({ vote })
      }, errors.E_VALIDATION_ERROR)
    }
  })

  test('custom string rules preserve their restrictions and error messages', async ({ assert }) => {
    const validator = vine.compile(
      vine.object({
        username: rules.username.clone(),
        password: rules.strongPassword.clone(),
        duration: rules.trackDuration.clone(),
      })
    )
    const valid = { username: 'user_971', password: 'StrongPass1!', duration: '03:59' }
    assert.deepEqual(await validator.validate(valid), valid)

    for (const invalid of [
      { ...valid, username: 'user name' },
      { ...valid, password: 'strongpass1!' },
      { ...valid, password: 'STRONGPASS1!' },
      { ...valid, password: 'StrongPass!' },
      { ...valid, password: 'StrongPass1' },
      { ...valid, duration: '03:60' },
    ]) {
      await rejects(async () => {
        await validator.validate(invalid)
      }, errors.E_VALIDATION_ERROR)
    }

    const [error] = await validator.tryValidate({ ...valid, username: 'user name' })
    assert.deepInclude(error?.messages, {
      field: 'username',
      rule: 'regex',
      message: 'Username can only contain letters, numbers, underscores and hyphens',
    })
  })

  test('artist imports normalize follower dates and validate every social URL', async ({
    assert,
  }) => {
    const payload = {
      name: 'Demo artist',
      isVerified: false,
      followers: { spotify: 24, lastUpdated: '2026-09-26T12:00:00.000Z', other: { total: 3 } },
      socials: { spotify: 'https://open.spotify.com/artist/demo', website: 'https://example.test' },
      categories: ['b50bf42a-fb66-4a5d-afda-8e1a8c73135e'],
    }
    const result = await artistValidator.validate(payload)
    assert.equal(result.followers?.lastUpdated, '2026-09-26T12:00:00.000Z')
    assert.deepEqual(result.followers?.other, { total: 3 })
    assert.deepEqual(result.categories, payload.categories)

    for (const invalid of [
      { ...payload, socials: { spotify: 12 } },
      { ...payload, socials: { website: 'javascript:alert(1)' } },
      { ...payload, followers: { spotify: 'many' } },
      { ...payload, categories: ['not-a-uuid'] },
    ]) {
      await rejects(async () => {
        await artistValidator.validate(invalid)
      }, errors.E_VALIDATION_ERROR)
    }
  })

  test('artist imports accept an unknown follower count without substituting zero', async ({
    assert,
  }) => {
    const result = await artistValidator.validate({ name: 'Demo artist', isVerified: false })
    assert.deepEqual(result, { name: 'Demo artist', isVerified: false })
  })

  test('artist HTTP schemas keep their distinct create and update allowlists', async ({
    assert,
  }) => {
    const userId = 'b50bf42a-fb66-4a5d-afda-8e1a8c73135e'
    const created = await createArtistValidator.validate({ name: 'Demo', userId, isVerified: true })
    assert.deepEqual(created, { name: 'Demo', userId })

    const updated = await updateArtistValidator.validate({ isVerified: true, userId })
    assert.deepEqual(updated, { isVerified: true })
    assert.deepEqual(await updateArtistValidator.validate({}), {})
    await rejects(async () => {
      await createArtistValidator.validate({})
    }, errors.E_VALIDATION_ERROR)
  })

  test('release payloads contain a valid Luxon date and URL array', async ({ assert }) => {
    const payload = {
      title: 'Demo release',
      description: '',
      date: '2026-09-26',
      type: 'single',
      urls: ['https://example.test/listen'],
    }
    const result = await createReleaseValidator.validate(payload)
    assert.isTrue(DateTime.isDateTime(result.date))
    assert.isTrue(result.date.isValid)
    assert.equal(result.date.toISODate(), '2026-09-26')

    for (const invalid of [
      { ...payload, date: 'invalid' },
      { ...payload, urls: 'https://example.test/listen' },
      { ...payload, urls: ['javascript:alert(1)'] },
    ]) {
      await rejects(async () => {
        await createReleaseValidator.validate(invalid)
      }, errors.E_VALIDATION_ERROR)
    }
  })

  test('release updates cannot change artist or support count through extra fields', async ({
    assert,
  }) => {
    const result = await updateReleaseValidator.validate({
      title: 'New title',
      artistId: 'b50bf42a-fb66-4a5d-afda-8e1a8c73135e',
      voteCount: 999,
      spotifyId: 'arbitrary',
    })
    assert.deepEqual(result, { title: 'New title' })
    assert.deepEqual(await updateReleaseValidator.validate({}), {})
  })

  test('category assignments require a UUID', async () => {
    await rejects(async () => {
      await categoryAssignmentValidator.validate({ categoryId: ['invalid'] })
    }, errors.E_VALIDATION_ERROR)
  })

  test('pull-up input only accepts a trimmed optional comment within its length limit', async ({
    assert,
  }) => {
    assert.deepEqual(await voteValidator.validate({ comment: '  Big tune  ', vote: 99 }), {
      comment: 'Big tune',
    })
    assert.deepEqual(await voteValidator.validate({}), {})
    await rejects(async () => {
      await voteValidator.validate({ comment: 'x'.repeat(1001) })
    }, errors.E_VALIDATION_ERROR)
  })
})
