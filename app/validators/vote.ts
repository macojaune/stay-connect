import vine from '@vinejs/vine'

export const voteValidator = vine.compile(
  vine.object({
    comment: vine.string().trim().maxLength(1000).optional(),
  })
)
