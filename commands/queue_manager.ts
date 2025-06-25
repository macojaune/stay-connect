import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import QueueService from '#services/queue_service'
import logger from '@adonisjs/core/services/logger'

export default class QueueManager extends BaseCommand {
  static commandName = 'queue:manage'
  static description = 'Manage the background job queue'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
    staysAlive: true, // Keep the process alive for queue processing
  }

  @flags.string({ description: 'Action to perform: start, stop, status, trigger' })
  declare action: string

  @flags.string({ description: 'Job ID for trigger action' })
  declare jobId?: string

  @flags.boolean({ description: 'Run in daemon mode (keeps running)' })
  declare daemon: boolean

  async run() {
    if (!this.action) {
      this.logger.error('Action is required. Use --action=start|stop|status|trigger')
      this.exitCode = 1
      return
    }

    try {
      switch (this.action.toLowerCase()) {
        case 'start':
          await this.startQueue()
          break
        case 'stop':
          await this.stopQueue()
          break
        case 'status':
          await this.showStatus()
          break
        case 'trigger':
          await this.triggerJob()
          break
        default:
          this.logger.error(`Unknown action: ${this.action}`)
          this.exitCode = 1
      }
    } catch (error) {
      this.logger.error('Queue management failed:', error)
      this.exitCode = 1
    }
  }

  private async startQueue() {
    this.logger.info('Initializing queue service...')
    QueueService.initialize()
    QueueService.start()
    
    this.logger.info('Queue service started successfully')
    
    if (this.daemon) {
      this.logger.info('Running in daemon mode. Press Ctrl+C to stop.')
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        this.logger.info('Received SIGINT. Stopping queue service...')
        QueueService.stop()
        process.exit(0)
      })
      
      process.on('SIGTERM', () => {
        this.logger.info('Received SIGTERM. Stopping queue service...')
        QueueService.stop()
        process.exit(0)
      })
      
      // Keep the process alive
      await new Promise(() => {}) // This will run indefinitely
    }
  }

  private async stopQueue() {
    this.logger.info('Stopping queue service...')
    QueueService.stop()
    this.logger.info('Queue service stopped')
  }

  private async showStatus() {
    const jobs = QueueService.getAllJobsStatus()
    
    if (jobs.length === 0) {
      this.logger.info('No jobs configured')
      return
    }

    this.logger.info('Queue Status:')
    this.logger.info('=============')
    
    for (const job of jobs) {
      const status = job.isRunning ? 'RUNNING' : job.enabled ? 'ENABLED' : 'DISABLED'
      const lastRun = job.lastRun ? job.lastRun.toFormat('yyyy-MM-dd HH:mm:ss') : 'Never'
      const nextRun = job.nextRun.toFormat('yyyy-MM-dd HH:mm:ss')
      
      this.logger.info(`
Job: ${job.name}`)
      this.logger.info(`  ID: ${job.id}`)
      this.logger.info(`  Status: ${status}`)
      this.logger.info(`  Schedule: ${job.schedule}`)
      this.logger.info(`  Last Run: ${lastRun}`)
      this.logger.info(`  Next Run: ${nextRun}`)
      this.logger.info(`  Retry Count: ${job.retryCount}/${job.maxRetries}`)
    }
  }

  private async triggerJob() {
    if (!this.jobId) {
      this.logger.error('Job ID is required for trigger action. Use --job-id=<id>')
      this.exitCode = 1
      return
    }

    this.logger.info(`Triggering job: ${this.jobId}`)
    await QueueService.triggerJob(this.jobId)
    this.logger.info('Job triggered successfully')
  }
}