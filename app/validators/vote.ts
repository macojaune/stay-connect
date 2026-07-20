import vine from '@vinejs/vine'

export const voteValidator = vine.compile(
  vine.object({
    vote: vine.number().min(1).max(5),
    comment: vine.string().trim().maxLength(1000).optional(),
  })
)
