import vine from '@vinejs/vine'

const futureDateRule = vine.createRule((value, _options, field) => {
  if (!(value instanceof Date) || !field.isValid) {
    return
  }

  if (value.getTime() < Date.now()) {
    field.report('The date must be in the future', 'future', field)
  }
})

const patternRule = vine.createRule<{ expression: RegExp; message: string }>(
  (value, { expression, message }, field) => {
    if (typeof value === 'string' && !expression.test(value)) {
      field.report(message, 'regex', field)
    }
  }
)

function pattern(expression: RegExp, message: string) {
  return patternRule({ expression, message })
}

/**
 * Custom validation rules for common use cases
 */
export const rules = {
  /**
   * Validate that a date is in the future
   */
  futureDate: vine.date().use(futureDateRule()),

  /**
   * Validate a URL with optional protocols
   */
  flexibleUrl: vine
    .string()
    .use(
      pattern(
        /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        'Invalid URL format'
      )
    ),

  /**
   * Validate a username format
   */
  username: vine
    .string()
    .use(
      pattern(
        /^[a-zA-Z0-9_-]+$/,
        'Username can only contain letters, numbers, underscores and hyphens'
      )
    )
    .minLength(3)
    .maxLength(30),

  /**
   * Validate a strong password
   */
  strongPassword: vine
    .string()
    .minLength(8)
    .use(pattern(/[A-Z]/, 'Password must contain at least one uppercase letter'))
    .use(pattern(/[a-z]/, 'Password must contain at least one lowercase letter'))
    .use(pattern(/[0-9]/, 'Password must contain at least one number'))
    .use(pattern(/[^A-Za-z0-9]/, 'Password must contain at least one special character')),

  /**
   * Validate social media URLs
   */
  socialMediaUrls: {
    facebook: vine
      .string()
      .use(
        pattern(/^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(\.)]+$/, 'Invalid Facebook URL')
      )
      .optional(),
    twitter: vine
      .string()
      .use(pattern(/^(https?:\/\/)?(www\.)?twitter\.com\/[a-zA-Z0-9_]+$/, 'Invalid Twitter URL'))
      .optional(),
    instagram: vine
      .string()
      .use(
        pattern(/^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+$/, 'Invalid Instagram URL')
      )
      .optional(),
    soundcloud: vine
      .string()
      .use(
        pattern(/^(https?:\/\/)?(www\.)?soundcloud\.com\/[a-zA-Z0-9-]+$/, 'Invalid SoundCloud URL')
      )
      .optional(),
    spotify: vine
      .string()
      .use(
        pattern(
          /^(https?:\/\/)?(open\.)?spotify\.com\/(artist|user)\/[a-zA-Z0-9-]+$/,
          'Invalid Spotify URL'
        )
      )
      .optional(),
    youtube: vine
      .string()
      .use(
        pattern(
          /^(https?:\/\/)?(www\.)?youtube\.com\/(c|channel|user)\/[a-zA-Z0-9-_]+$/,
          'Invalid YouTube URL'
        )
      )
      .optional(),
  },

  /**
   * Validate track duration format (MM:SS)
   */
  trackDuration: vine
    .string()
    .use(pattern(/^([0-5][0-9]):([0-5][0-9])$/, 'Invalid track duration format (must be MM:SS)')),

  /**
   * Validate release type
   */
  releaseType: vine.enum(['album', 'single', 'ep'] as const),

  /**
   * Validate vote value
   */
  voteValue: vine.number().withoutDecimals().min(1).max(5),
}
