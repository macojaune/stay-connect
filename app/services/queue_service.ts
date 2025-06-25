import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export interface QueueJob {
  id: string
  name: string
  command: string
  schedule: string // cron-like schedule
  lastRun?: DateTime
  nextRun: DateTime
  isRunning: boolean
  retryCount: number
  maxRetries: number
  enabled: boolean
}

export default class QueueService {
  private static jobs: Map<string, QueueJob> = new Map()
  private static isProcessing = false
  private static processingInterval: NodeJS.Timeout | null = null

  /**
   * Initialize the queue service with predefined jobs
   */
  static initialize() {
    // Define Spotify-related jobs
    this.addJob({
      id: 'spotify-check-releases',
      name: 'Check Spotify Releases',
      command: 'node ace spotify:check-releases',
      schedule: '0 */6 * * *', // Every 6 hours
      nextRun: this.getNextRunTime('0 */6 * * *'),
      isRunning: false,
      retryCount: 0,
      maxRetries: 3,
      enabled: true,
    })

    this.addJob({
      id: 'spotify-sync-artists',
      name: 'Sync Spotify Artists',
      command: 'node ace spotify:sync-artists',
      schedule: '0 2 * * *', // Daily at 2 AM
      nextRun: this.getNextRunTime('0 2 * * *'),
      isRunning: false,
      retryCount: 0,
      maxRetries: 3,
      enabled: true,
    })

    logger.info('Queue service initialized with Spotify jobs')
  }

  /**
   * Add a job to the queue
   */
  static addJob(job: QueueJob) {
    this.jobs.set(job.id, job)
    logger.info(`Added job: ${job.name}`)
  }

  /**
   * Start the queue processor
   */
  static start() {
    if (this.processingInterval) {
      logger.warn('Queue processor is already running')
      return
    }

    this.processingInterval = setInterval(() => {
      this.processJobs()
    }, 60000) // Check every minute

    logger.info('Queue processor started')
  }

  /**
   * Stop the queue processor
   */
  static stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
      logger.info('Queue processor stopped')
    }
  }

  /**
   * Process pending jobs
   */
  private static async processJobs() {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true
    const now = DateTime.now()

    try {
      for (const [jobId, job] of this.jobs) {
        if (!job.enabled || job.isRunning || job.nextRun > now) {
          continue
        }

        logger.info(`Starting job: ${job.name}`)
        await this.executeJob(job)
      }
    } catch (error) {
      logger.error('Error processing jobs:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Execute a specific job
   */
  private static async executeJob(job: QueueJob) {
    job.isRunning = true
    job.lastRun = DateTime.now()

    try {
      logger.info(`Executing command: ${job.command}`)
      const { stdout, stderr } = await execAsync(job.command, {
        cwd: process.cwd(),
        timeout: 30 * 60 * 1000, // 30 minutes timeout
      })

      if (stdout) {
        logger.info(`Job ${job.name} output:`, stdout)
      }
      if (stderr) {
        logger.warn(`Job ${job.name} stderr:`, stderr)
      }

      // Reset retry count on success
      job.retryCount = 0
      job.nextRun = this.getNextRunTime(job.schedule)
      
      logger.info(`Job ${job.name} completed successfully. Next run: ${job.nextRun.toISO()}`)
    } catch (error) {
      logger.error(`Job ${job.name} failed:`, error)
      
      job.retryCount++
      
      if (job.retryCount >= job.maxRetries) {
        logger.error(`Job ${job.name} exceeded max retries (${job.maxRetries}). Disabling.`)
        job.enabled = false
      } else {
        // Retry in 5 minutes
        job.nextRun = DateTime.now().plus({ minutes: 5 })
        logger.info(`Job ${job.name} will retry in 5 minutes (attempt ${job.retryCount}/${job.maxRetries})`)
      }
    } finally {
      job.isRunning = false
    }
  }

  /**
   * Get next run time based on cron-like schedule
   * Simplified implementation for common patterns
   */
  private static getNextRunTime(schedule: string): DateTime {
    const now = DateTime.now()
    
    // Parse simple cron patterns
    const parts = schedule.split(' ')
    if (parts.length !== 5) {
      throw new Error(`Invalid schedule format: ${schedule}`)
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

    // Handle some common patterns
    if (schedule === '0 */6 * * *') {
      // Every 6 hours
      const nextHour = Math.ceil(now.hour / 6) * 6
      return now.set({ hour: nextHour, minute: 0, second: 0, millisecond: 0 })
        .plus(nextHour >= 24 ? { days: 1 } : {})
    }

    if (schedule === '0 2 * * *') {
      // Daily at 2 AM
      let next = now.set({ hour: 2, minute: 0, second: 0, millisecond: 0 })
      if (next <= now) {
        next = next.plus({ days: 1 })
      }
      return next
    }

    // Default: run in 1 hour for unknown patterns
    logger.warn(`Unknown schedule pattern: ${schedule}. Defaulting to 1 hour.`)
    return now.plus({ hours: 1 })
  }

  /**
   * Get job status
   */
  static getJobStatus(jobId: string): QueueJob | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Get all jobs status
   */
  static getAllJobsStatus(): QueueJob[] {
    return Array.from(this.jobs.values())
  }

  /**
   * Enable/disable a job
   */
  static setJobEnabled(jobId: string, enabled: boolean) {
    const job = this.jobs.get(jobId)
    if (job) {
      job.enabled = enabled
      logger.info(`Job ${job.name} ${enabled ? 'enabled' : 'disabled'}`)
    }
  }

  /**
   * Manually trigger a job
   */
  static async triggerJob(jobId: string) {
    const job = this.jobs.get(jobId)
    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    if (job.isRunning) {
      throw new Error(`Job ${job.name} is already running`)
    }

    logger.info(`Manually triggering job: ${job.name}`)
    await this.executeJob(job)
  }
}