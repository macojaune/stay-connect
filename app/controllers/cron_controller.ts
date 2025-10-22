import type { HttpContext } from '@adonisjs/core/http'
import SpotifyService from '#services/spotify_service'
import env from '#start/env'
import logger from '@adonisjs/core/services/logger'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export default class CronController {
  /**
   * Execute Spotify releases check via HTTP endpoint
   * Secured with API key and IP whitelist
   */
  async spotifyReleases({ request, response }: HttpContext) {
    try {
      if (!this.ensureAuthorized(request, response)) {
        return
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
   * Trigger weekly recap email command via HTTP endpoint
   */
  async weeklyRecap({ request, response }: HttpContext) {
    try {
      if (!this.ensureAuthorized(request, response)) {
        return
      }

      const clientIP = request.ip()
      logger.info(`Starting weekly recap command via HTTP endpoint from IP: ${clientIP}`)

      const args = ['ace', 'email:weekly-recap', '--send-later']
      const commandDisplay = ['node', ...args].join(' ')
      logger.info('Executing weekly recap command', { command: commandDisplay })

      const { stdout, stderr } = await execFileAsync('node', args, {
        cwd: process.cwd(),
        timeout: 10 * 60 * 1000, // 10 minutes
      })

      logger.info('Weekly recap command completed successfully', { stdout, stderr })

      return response.ok({
        success: true,
        message: 'Weekly recap command executed successfully',
        command: commandDisplay,
        output: stdout?.trim() || undefined,
        warnings: stderr?.trim() || undefined,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      const execError = error as Error & { stdout?: string; stderr?: string }

      logger.error('Failed to execute weekly recap command via HTTP endpoint', {
        error: execError.message,
        stdout: execError.stdout,
        stderr: execError.stderr,
        stack: execError.stack,
      })

      return response.internalServerError({
        success: false,
        error: 'Failed to execute weekly recap command',
        message: execError.message,
        stderr: execError.stderr,
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

  private ensureAuthorized(request: HttpContext['request'], response: HttpContext['response']) {
    const apiKey = request.header('x-api-key') || request.input('api_key')
    const expectedApiKey = env.get('CRON_API_KEY')

    if (!expectedApiKey) {
      logger.error('CRON_API_KEY not configured in environment')
      response.internalServerError({
        error: 'Cron API not properly configured',
      })
      return false
    }

    if (!apiKey || apiKey !== expectedApiKey) {
      logger.warn(`Unauthorized cron access attempt from IP: ${request.ip()}`)
      response.unauthorized({
        error: 'Invalid API key',
      })
      return false
    }

    return true
  }
}
