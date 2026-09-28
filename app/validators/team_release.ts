import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { DateTime } from 'luxon'

const httpsUrl = vine
  .string()
  .trim()
  .url({
    require_protocol: true,
    protocols: ['https'],
  })

const releaseFields = {
  title: vine.string().trim().minLength(1).maxLength(200),
  description: vine.string().trim().maxLength(2000).optional(),
  date: vine.date({ formats: ['YYYY-MM-DD'] }).transform((value) => DateTime.fromJSDate(value)),
  type: vine.enum(['album', 'single', 'ep']),
  cover: httpsUrl.clone().nullable().optional(),
  artistId: vine.string().uuid().nullable().optional(),
  newArtistName: vine.string().trim().minLength(2).maxLength(120).optional(),
  categoryIds: vine.array(vine.string().uuid()).maxLength(12).optional(),
  newCategoryName: vine.string().trim().minLength(2).maxLength(80).optional(),
}

export const createTeamReleaseValidator = vine.compile(
  vine.object({
    ...releaseFields,
    urls: vine.array(httpsUrl.clone()).minLength(1).maxLength(12),
  })
)

export const updateTeamReleaseValidator = vine.compile(
  vine.object({
    ...releaseFields,
    urls: vine.array(httpsUrl.clone()).maxLength(12).optional(),
  })
)

export type TeamReleaseCreateInput = Infer<typeof createTeamReleaseValidator>
export type TeamReleaseUpdateInput = Infer<typeof updateTeamReleaseValidator>
export type TeamReleaseInput = TeamReleaseCreateInput | TeamReleaseUpdateInput
