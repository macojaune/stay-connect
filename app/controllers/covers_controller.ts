import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import type { HttpContext } from '@adonisjs/core/http'
import CoverStorage from '#services/cover_storage'

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export default class CoversController {
  async show({ params, response }: HttpContext) {
    const path = CoverStorage.pathFor(params.name)
    if (!path) return response.notFound()
    try {
      const file = await stat(path)
      if (!file.isFile()) return response.notFound()
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT')
        return response.notFound()
      throw error
    }
    const ext = params.name.slice(params.name.lastIndexOf('.') + 1)
    response.header('Content-Type', CONTENT_TYPES[ext])
    response.header('X-Content-Type-Options', 'nosniff')
    response.header('Cache-Control', 'public, max-age=31536000, immutable')
    return response.stream(createReadStream(path))
  }
}
