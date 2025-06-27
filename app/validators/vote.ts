import vine from '@vinejs/vine'

export const voteValidator = vine.compile(
  vine.object({
    vote: vine.number().min(1).max(5),
  })
)
