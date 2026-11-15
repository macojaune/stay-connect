import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { copyFile, mkdir, open, stat, unlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { TeamReleaseInputError } from '#services/team_release_service'
import type { TeamReleaseInput } from '#validators/team_release'

type CoverFile = NonNullable<TeamReleaseInput['coverFile']>

const MAX_BYTES = 5 * 1024 * 1024
const STORED_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/

function extension(bytes: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg'
  if (
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.toString('ascii', 12, 16) === 'IHDR'
  )
    return 'png'
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP')
    return 'webp'
  return null
}

export default class CoverStorage {
  static directory() {
    return join(resolve(env.get('UPLOAD_PATH') ?? app.makePath('uploads')), 'covers')
  }

  static pathFor(name: string): string | null {
    return STORED_NAME.test(name) ? join(this.directory(), name) : null
  }

  static async save(file: CoverFile): Promise<{ name: string; url: string }> {
    if (!file.tmpPath) throw new TeamReleaseInputError('coverFile', 'Le fichier est introuvable.')
    const info = await stat(file.tmpPath)
    if (info.size < 32 || info.size > MAX_BYTES)
      throw new TeamReleaseInputError('coverFile', 'Choisis une image de 5 Mo maximum.')

    const handle = await open(file.tmpPath, 'r')
    let bytes: Buffer
    try {
      bytes = Buffer.alloc(16)
      await handle.read(bytes, 0, bytes.length, 0)
    } finally {
      await handle.close()
    }
    const ext = extension(bytes)
    if (!ext)
      throw new TeamReleaseInputError('coverFile', 'Choisis une image JPEG, PNG ou WebP valide.')

    const name = `${randomUUID()}.${ext}`
    const url = new URL(`/covers/${name}`, env.get('APP_URL')).toString()
    await mkdir(this.directory(), { recursive: true })
    await copyFile(file.tmpPath, join(this.directory(), name), constants.COPYFILE_EXCL)
    return { name, url }
  }

  static async remove(name: string): Promise<void> {
    const path = this.pathFor(name)
    if (path) await unlink(path)
  }
}
