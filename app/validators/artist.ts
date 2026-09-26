import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

const socials = vine.record(vine.string().url())

export const artistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2),
    spotifyId: vine.string().optional(),
    description: vine.string().optional(),
    location: vine.string().optional(),
    website: vine.string().url().optional(),
    socials: socials.clone().optional(),
    isVerified: vine.boolean(),
    followers: vine
      .object({
        spotify: vine.number().optional(),
        lastUpdated: vine
          .date({ formats: ['iso8601'] })
          .transform((value) => value.toISOString())
          .optional(),
      })
      .allowUnknownProperties<unknown>()
      .optional(),
    profilePicture: vine.string().url().optional(),
    categories: vine.array(vine.string().uuid()).optional(),
  })
)

export type ArtistInput = Infer<typeof artistValidator>

// The HTTP CRUD endpoints expose fewer fields than the Spotify import service.
export const createArtistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2),
    description: vine.string().nullable().optional(),
    socials: socials.clone().nullable().optional(),
    profilePicture: vine.string().url().nullable().optional(),
    userId: vine.string().uuid().nullable().optional(),
  })
)

export const updateArtistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).optional(),
    description: vine.string().nullable().optional(),
    socials: socials.clone().nullable().optional(),
    profilePicture: vine.string().url().nullable().optional(),
    isVerified: vine.boolean().optional(),
  })
)
