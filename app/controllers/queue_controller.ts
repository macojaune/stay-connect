import type { HttpContext } from '@adonisjs/core/http'
import QueueService from '#services/queue_service'

export default class QueueController {
  /**
   * Get queue status for monitoring
   */
  async status({ response }: HttpContext) {
    try {
      const jobs = QueueService.getAllJobsStatus()
      
      const status = {
        timestamp: new Date().toISOString(),
        totalJobs: jobs.length,
        runningJobs: jobs.filter(job => job.isRunning).length,
        enabledJobs: jobs.filter(job => job.enabled).length,
        disabledJobs: jobs.filter(job => !job.enabled).length,
        jobs: jobs.map(job => ({
          id: job.id,
          name: job.name,
          status: job.isRunning ? 'running' : job.enabled ? 'enabled' : 'disabled',
          schedule: job.schedule,
          lastRun: job.lastRun?.toISO() || null,
          nextRun: job.nextRun.toISO(),
          retryCount: job.retryCount,
          maxRetries: job.maxRetries,
        })),
      }
      
      return response.ok(status)
    } catch (error) {
      return response.internalServerError({
        error: 'Failed to get queue status',
        message: error.message,
      })
    }
  }

  /**
   * Trigger a specific job manually
   */
  async trigger({ request, response }: HttpContext) {
    try {
      const { jobId } = request.only(['jobId'])
      
      if (!jobId) {
        return response.badRequest({
          error: 'Job ID is required',
        })
      }
      
      await QueueService.triggerJob(jobId)
      
      return response.ok({
        message: `Job ${jobId} triggered successfully`,
      })
    } catch (error) {
      return response.badRequest({
        error: 'Failed to trigger job',
        message: error.message,
      })
    }
  }

  /**
   * Enable or disable a job
   */
  async toggle({ request, response }: HttpContext) {
    try {
      const { jobId, enabled } = request.only(['jobId', 'enabled'])
      
      if (!jobId || typeof enabled !== 'boolean') {
        return response.badRequest({
          error: 'Job ID and enabled status are required',
        })
      }
      
      QueueService.setJobEnabled(jobId, enabled)
      
      return response.ok({
        message: `Job ${jobId} ${enabled ? 'enabled' : 'disabled'} successfully`,
      })
    } catch (error) {
      return response.badRequest({
        error: 'Failed to toggle job',
        message: error.message,
      })
    }
  }

  /**
   * Health check endpoint
   */
  async health({ response }: HttpContext) {
    try {
      const jobs = QueueService.getAllJobsStatus()
      const runningJobs = jobs.filter(job => job.isRunning)
      const enabledJobs = jobs.filter(job => job.enabled)
      
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        queue: {
          totalJobs: jobs.length,
          runningJobs: runningJobs.length,
          enabledJobs: enabledJobs.length,
          healthy: enabledJobs.length > 0,
        },
      }
      
      return response.ok(health)
    } catch (error) {
      return response.internalServerError({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      })
    }
  }
}