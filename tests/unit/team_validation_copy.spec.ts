import { test } from '@japa/runner'
import { errors } from '@vinejs/vine'
import { createTeamReleaseValidator } from '#validators/team_release'
import { teamArtistTerritoriesValidator } from '#validators/team_artist_territories'

async function messages(validate: () => Promise<unknown>) {
  try {
    await validate()
  } catch (error) {
    if (error instanceof errors.E_VALIDATION_ERROR)
      return error.messages as Array<{ field: string; message: string }>
    throw error
  }
  throw new Error('Expected a validation error')
}

test.group('Team form validation copy', () => {
  test('explains invalid streaming links and short artist names in French', async ({ assert }) => {
    const result = await messages(() =>
      createTeamReleaseValidator.validate({
        title: 'Fixture',
        date: '2026-09-30',
        type: 'single',
        newArtistName: 'A',
        urls: ['https://example.test/listen', 'https://localhost/b'],
      })
    )
    assert.include(
      result.find(({ field }) => field === 'newArtistName')?.message ?? '',
      'au moins 2 caractères'
    )
    assert.include(result.find(({ field }) => field === 'urls.1')?.message ?? '', 'HTTPS')
  })

  test('explains the source HTTPS rule and minimum evidence in French', async ({ assert }) => {
    const result = await messages(() =>
      teamArtistTerritoriesValidator.validate({
        reviewConfirmed: true,
        territories: [
          {
            territoryCode: 'GP',
            sourceKind: 'public_source',
            sourceReference: 'http://example.test/source',
            sourceNote: 'court',
          },
        ],
      })
    )
    assert.include(
      result.find(({ field }) => field.endsWith('sourceReference'))?.message ?? '',
      'HTTPS'
    )
    assert.include(
      result.find(({ field }) => field.endsWith('sourceNote'))?.message ?? '',
      'au moins 10 caractères'
    )
  })
})
