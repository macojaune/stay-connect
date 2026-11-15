import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'

export const artistSuggestionMessages = new SimpleMessagesProvider({
  'required': 'Ce champ est obligatoire.',
  'name.minLength': 'Le nom doit contenir au moins 2 caractères.',
  'name.maxLength': 'Le nom ne doit pas dépasser 120 caractères.',
  'email.email': 'Saisis une adresse email valide.',
  'email.maxLength': 'Cette adresse email est trop longue.',
  'sourceUrl.required': 'Ajoute un lien vers la musique ou le profil de cet artiste.',
  'sourceUrl.url': 'Ajoute un lien valide commençant par https:// ou http://.',
  'sourceUrl.maxLength': 'Le lien ne doit pas dépasser 500 caractères.',
  'message.maxLength': 'La précision ne doit pas dépasser 1 000 caractères.',
})

export function artistSuggestionFields() {
  return {
    name: vine.string().trim().minLength(2).maxLength(120),
    sourceUrl: vine
      .string()
      .trim()
      .url({ protocols: ['http', 'https'], require_protocol: true, require_valid_protocol: true })
      .maxLength(500),
    message: vine.string().trim().maxLength(1000).optional(),
  }
}

export const artistSuggestionValidator = vine.compile(
  vine.object({
    ...artistSuggestionFields(),
    email: vine.string().trim().toLowerCase().maxLength(254).email(),
  })
)

artistSuggestionValidator.messagesProvider = artistSuggestionMessages
export type ArtistSuggestionInput = Infer<typeof artistSuggestionValidator>
