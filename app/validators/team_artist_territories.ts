import vine, { SimpleMessagesProvider } from '@vinejs/vine'
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

teamArtistTerritoriesValidator.messagesProvider = new SimpleMessagesProvider({
  'required': 'Ce champ est obligatoire.',
  'string': 'Saisis un texte valide.',
  'boolean': 'Confirme la vérification des affiliations.',
  'array': 'Choisis les territoires vérifiés.',
  'enum': 'Choisis une valeur proposée.',
  'url': 'Utilise une adresse HTTPS valide pour la source.',
  'minLength': 'Précise ce que la source établit en au moins 10 caractères.',
  'maxLength': 'Ce champ est trop long.',
  'territories.maxLength': 'Choisis au maximum les trois territoires proposés.',
})

export type TeamArtistTerritoriesInput = Infer<typeof teamArtistTerritoriesValidator>
