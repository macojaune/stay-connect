import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { DateTime } from 'luxon'

export const releaseValidator = vine
  .withMetaData<{ artistId: string | null; releaseId?: string }>()
  .compile(
    vine.object({
      title: vine
        .string()
        .minLength(1)
        .maxLength(200)
        .unique(async (db, value, field) => {
          const query = db
            .from('releases')
            .where('title', value)
            .where('artist_id', field.meta.artistId)
          if (field.meta?.releaseId) {
            query.whereNot('id', field.meta.releaseId)
          }
          const release = await query.first()
          return !release
        }),
      description: vine.string().maxLength(1000).optional(),
      releaseDate: vine.date(),
      type: vine.enum(['album', 'single', 'ep']),
      coverArt: vine.string().url().optional(),
      streamingLinks: vine
        .object({
          spotify: vine.string().url().optional(),
          appleMusic: vine.string().url().optional(),
          soundcloud: vine.string().url().optional(),
          youtube: vine.string().url().optional(),
          bandcamp: vine.string().url().optional(),
          other: vine
            .array(
              vine.object({
                platform: vine.string(),
                url: vine.string().url(),
              })
            )
            .optional(),
        })
        .optional(),
      categories: vine.array(vine.string().uuid()).optional(),
      features: vine
        .array(
          vine.object({
            name: vine.string().maxLength(50),
            value: vine.string().maxLength(200),
          })
        )
        .optional(),
      tracks: vine
        .array(
          vine.object({
            title: vine.string().maxLength(200),
            duration: vine.string().regex(/^\d{2}:\d{2}$/),
            trackNumber: vine.number().min(1),
            previewUrl: vine.string().url().optional(),
          })
        )
        .optional(),
    })
  )

export type ReleaseInput = Infer<typeof releaseValidator>

const releaseProperties = {
  title: vine.string().minLength(1).maxLength(200),
  description: vine.string().maxLength(1000),
  date: vine.date().transform((value) => DateTime.fromJSDate(value)),
  type: vine.enum(['album', 'single', 'ep']),
  urls: vine.array(vine.string().url()),
  cover: vine.string().url().nullable().optional(),
  isSecret: vine.boolean().optional(),
  isAutomated: vine.boolean().optional(),
}

// These are the column names accepted by the existing HTTP CRUD endpoints.
export const createReleaseValidator = vine.compile(
  vine.object({
    ...releaseProperties,
    artistId: vine.string().uuid().nullable().optional(),
  })
)

export const updateReleaseValidator = vine.compile(
  vine.object({
    ...releaseProperties,
    title: releaseProperties.title.clone().optional(),
    description: releaseProperties.description.clone().optional(),
    date: releaseProperties.date.clone().optional(),
    type: releaseProperties.type.clone().optional(),
    urls: releaseProperties.urls.clone().optional(),
  })
)
