import vine from '@vinejs/vine'
import BaseValidator from '#validators/base_validator'

export const artistValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2),
    spotifyId: vine.string().optional(),
    description: vine.string().optional(),
    location: vine.string().optional(),
    website: vine.string().url().optional(),
    socials: vine
      .object({
        facebook: vine.string().url().optional(),
        twitter: vine.string().url().optional(),
        instagram: vine.string().url().optional(),
        soundcloud: vine.string().url().optional(),
        spotify: vine.string().url().optional(),
        youtube: vine.string().url().optional(),
      })
      .allowUnknownProperties()
      .optional(),
    isVerified: vine.boolean(),
    followers: vine
      .object({
        spotify: vine.number().optional(),
        lastUpdated: vine.date({ formats: ['iso8601'] }).optional(),
      })
      .allowUnknownProperties(),
    profilePicture: vine.string().url().optional(),
  })
)
