import vine from '@vinejs/vine'
import { DateTime } from 'luxon'

/**
 * Custom validation rules for common use cases
 */
export const rules = {
  /**
   * Validate that a date is in the future
   */
  futureDate: vine.date().custom(async (value, _, field) => {
    const date = DateTime.fromJSDate(value)
    if (date < DateTime.now()) {
      field.report('The date must be in the future', 'future', { value })
    }
  }),

  /**
   * Validate a URL with optional protocols
   */
  flexibleUrl: vine
    .string()
    .regex(/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/, 'Invalid URL format'),

  /**
   * Validate a username format
   */
  username: vine
    .string()
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores and hyphens'
    )
    .minLength(3)
    .maxLength(30),

  /**
   * Validate a strong password
   */
  strongPassword: vine
    .string()
    .minLength(8)
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),

  /**
   * Validate social media URLs
   */
  socialMediaUrls: {
    facebook: vine
      .string()
      .regex(/^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.)]+$/, 'Invalid Facebook URL')
      .optional(),
    twitter: vine
      .string()
      .regex(/^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/, 'Invalid Twitter URL')
      .optional(),
    instagram: vine
      .string()
      .regex(/^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/, 'Invalid Instagram URL')
      .optional(),
    soundcloud: vine
      .string()
      .regex(/^(https?:\/\/)?(www\.)?soundcloud\.com\/[a-zA-Z0-9-]+$/, 'Invalid SoundCloud URL')
      .optional(),
    spotify: vine
      .string()
      .regex(
        /^(https?:\/\/)?(open\.)?spotify\.com\/(artist|user)\/[a-zA-Z0-9-]+$/,
        'Invalid Spotify URL'
      )
      .optional(),
    youtube: vine
      .string()
      .regex(
        /^(https?:\/\/)?(www\.)?youtube\.com\/(c|channel|user)\/[a-zA-Z0-9-_]+$/,
        'Invalid YouTube URL'
      )
      .optional(),
  },

  /**
   * Validate track duration format (MM:SS)
   */
  trackDuration: vine
    .string()
    .regex(/^([0-5][0-9]):([0-5][0-9])$/, 'Invalid track duration format (must be MM:SS)'),

  /**
   * Validate release type
   */
  releaseType: vine.enum(['album', 'single', 'ep'] as const),

  /**
   * Validate vote value
   */
  voteValue: vine.number().integer().min(1).max(5),
}
