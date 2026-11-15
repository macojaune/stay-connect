import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import WeeklyRecapService from '#services/weekly_recap_service'

test.group('Weekly recap date contracts', () => {
  test('rejects an invalid reference before querying releases', async ({ assert }) => {
    const service = new WeeklyRecapService('https://stayconnect.example.test')

    await assert.rejects(async () => {
      await service.buildDataset(DateTime.invalid('invalid test reference'))
    }, /Invalid weekly recap reference date: invalid test reference/)
  })

  test('keeps valid ISO dates and the French period label in the email payload', ({ assert }) => {
    const service = new WeeklyRecapService('https://stayconnect.example.test')
    const periodStart = DateTime.fromISO('2026-09-14T00:00:00Z', { zone: 'utc' })
    if (!periodStart.isValid) {
      throw new Error('Invalid weekly recap test fixture')
    }

    const payload = service.buildPayload(
      { email: 'subscriber@example.test', username: 'auditeur' },
      {
        periodStart,
        periodEnd: periodStart.endOf('week'),
        totalNewReleases: 3,
        releases: [],
      }
    )

    assert.deepEqual(payload.period, {
      startIso: '2026-09-14T00:00:00.000Z',
      endIso: '2026-09-20T23:59:59.999Z',
      label: '14 sept. → 20 sept. 2026',
    })
    assert.equal(payload.user.fullName, 'auditeur')
    assert.equal(payload.summary.totalNewReleases, 3)
  })
})
