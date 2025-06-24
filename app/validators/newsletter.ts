import vine from '@vinejs/vine'

export const createLeadValidator = vine.compile(
  vine.object({
    type: vine.string().in(['user', 'artist']),
    username: vine
      .string()
      .trim()
      .notIn(['admin', 'root', 'superadmin'])
      .optional()
      .requiredWhen('type', '=', 'user'),
    email: vine.string().trim().email(),
    artistName: vine.string().trim().optional().requiredWhen('type', '=', 'artist'),
    role: vine.string().trim().optional().requiredWhen('type', '=', 'artist'),
  })
)
