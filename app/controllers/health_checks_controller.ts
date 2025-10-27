import type { HttpContext } from '@adonisjs/core/http'
import { healthChecks } from '#start/health'

export default class HealthChecksController {
  async handle({ response }: HttpContext) {
    const report = await healthChecks.run()

    if (report.isHealthy) {
      return response.ok(0)
    }

    return response.serviceUnavailable(1)
  }
}
