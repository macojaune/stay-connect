import vine from '@vinejs/vine'

export const controlSearchValidator = vine.compile(
  vine.object({
    query: vine.string().trim().minLength(2).maxLength(120),
  })
)
export const controlOperationValidator = vine.compile(
  vine.object({
    action: vine.enum(['add-artist', 'refresh-releases']),
    spotifyId: vine
      .string()
      .regex(/^[A-Za-z0-9]{22}$/)
      .optional(),
    artistId: vine.string().uuid().optional(),
    days: vine.number({ strict: true }).withoutDecimals().min(1).max(30).optional(),
  })
)
