import type { HttpContext } from '@adonisjs/core/http'
import SpotifyService from '#services/spotify_service'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'

export default class CronController {
  /**
   * Execute Spotify releases check via HTTP endpoint
   * Secured with API key and IP whitelist
   */
  async spotifyReleases({ request, response }: HttpContext) {
    try {
      // Security check: Verify API key
      const apiKey = request.header('x-api-key') || request.input('api_key')
      const expectedApiKey = env.get('CRON_API_KEY')

      if (!expectedApiKey) {
        logger.error('CRON_API_KEY not configured in environment')
        return response.internalServerError({
          error: 'Cron API not properly configured',
        })
      }

      if (!apiKey || apiKey !== expectedApiKey) {
        logger.warn(`Unauthorized cron access attempt from IP: ${request.ip()}`)
        return response.unauthorized({
          error: 'Invalid API key',
        })
      }

      // // Security check: IP whitelist (optional)
      // const allowedIPs = env.get('CRON_ALLOWED_IPS', '127.0.0.1,::1').split(',')
      const clientIP = request.ip()

      // if (!allowedIPs.includes(clientIP)) {
      //   logger.warn(`Cron access denied for IP: ${clientIP}`)
      //   return response.forbidden({
      //     error: 'IP not allowed'
      //   })
      // }

      logger.info(`Starting Spotify releases check via HTTP endpoint from IP: ${clientIP}`)

      // Execute the Spotify service
      const spotifyService = new SpotifyService()
      const stats = await spotifyService.checkForNewReleases()

      logger.info('Spotify releases check completed successfully via HTTP endpoint', {
        stats,
      })

      return response.ok({
        success: true,
        message: 'Spotify releases check completed successfully',
        stats: {
          processed: stats.processed,
          newReleases: stats.newReleases,
          errors: stats.errors,
          timestamp: new Date().toISOString(),
        },
      })
    } catch (error) {
      logger.error('Failed to execute Spotify releases check via HTTP endpoint', {
        error: error.message,
        stack: error.stack,
      })

      return response.internalServerError({
        success: false,
        error: 'Failed to execute Spotify releases check',
        message: error.message,
      })
    }
  }

  /**
   * Health check endpoint for cron monitoring
   */
  async health({ response }: HttpContext) {
    return response.ok({
      status: 'healthy',
      service: 'cron-endpoints',
      timestamp: new Date().toISOString(),
    })
  }
}
