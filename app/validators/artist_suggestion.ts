import vine from '@vinejs/vine'

export const artistSuggestionValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(120),
    email: vine.string().trim().email(),
    sourceUrl: vine.string().trim().url().maxLength(500).optional(),
    message: vine.string().trim().maxLength(1000).optional(),
  })
)
