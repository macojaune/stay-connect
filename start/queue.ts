import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import queue from '@rlanz/bull-queue/services/main'
import SpotifyCheckReleasesJob from '#jobs/spotify_check_releases_job'
import SpotifySyncArtistsJob from '#jobs/spotify_sync_artists_job'
import WeeklyRecapEmailJob from '#jobs/weekly_recap_email_job'

await app.booted(async () => {
  const queueEnabled = env.get('QUEUE_ENABLED')

  if (!queueEnabled) {
    logger.info('[queue] Scheduling disabled. Set QUEUE_ENABLED=true to enable background jobs.')
    return
  }

  const schedules = [
    {
      job: SpotifyCheckReleasesJob,
      payload: {},
      options: {
        jobId: 'spotify-check-releases',
        repeat: { pattern: '0 */6 * * *' },
      },
      description: 'Spotify release check',
    },
    {
      job: SpotifySyncArtistsJob,
      payload: {},
      options: {
        jobId: 'spotify-sync-artists',
        repeat: { pattern: '0 2 * * *' },
      },
      description: 'Spotify artist sync',
    },
    {
      job: WeeklyRecapEmailJob,
      payload: { sendLater: false },
      options: {
        jobId: 'weekly-recap-email',
        repeat: { pattern: '0 9 * * 1' },
      },
      description: 'Weekly recap email',
    },
  ] as const

  for (const schedule of schedules) {
    try {
      await queue.dispatch(schedule.job, schedule.payload, schedule.options)
      logger.info(`[queue] Scheduled ${schedule.description}`)
    } catch (error) {
      logger.error(
        error,
        `[queue] Failed to schedule ${schedule.description}.`
      )
    }
  }
})
