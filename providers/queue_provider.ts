import type { ApplicationService } from '@adonisjs/core/types'
import QueueService from '#services/queue_service'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

export default class QueueProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    // Register the queue service as a singleton
    this.app.container.singleton('queue.service', () => {
      return QueueService
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {
    // Boot logic if needed
  }

  /**
   * The application has been booted
   */
  async start() {
    const queueEnabled = env.get('QUEUE_ENABLED', false)

    if (queueEnabled) {
      try {
        logger.info('Starting queue service...')
        QueueService.initialize()
        QueueService.start()
        logger.info('Queue service started successfully')
      } catch (error) {
        logger.error('Failed to start queue service: ' + error.message)
      }
    } else {
      logger.info('Queue service disabled. Set QUEUE_ENABLED=true to enable.')
    }
  }

  /**
   * The process has been started
   */
  async ready() {
    // Ready logic if needed
  }

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {
    // Only end queue if it is enabled
    const queueEnabled = env.get('QUEUE_ENABLED', false)

    if (queueEnabled) {
      try {
        logger.info('Shutting down queue service...')
        QueueService.stop()
        logger.info('Queue service stopped')
      } catch (error) {
        logger.error('Error stopping queue service: ' + error.message)
      }
    }
  }
}
