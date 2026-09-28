import vine from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { territoryCodes, territorySourceKinds } from '#contracts/territories'

export const teamArtistTerritoriesValidator = vine.compile(
  vine.object({
    reviewConfirmed: vine.boolean(),
    territories: vine
      .array(
        vine.object({
          territoryCode: vine.enum(territoryCodes),
          sourceKind: vine.enum(territorySourceKinds),
          sourceReference: vine
            .string()
            .trim()
            .url({ require_protocol: true, protocols: ['https'] })
            .maxLength(1000)
            .nullable()
            .optional(),
          sourceNote: vine.string().trim().minLength(10).maxLength(500),
        })
      )
      .maxLength(territoryCodes.length),
  })
)

export type TeamArtistTerritoriesInput = Infer<typeof teamArtistTerritoriesValidator>
