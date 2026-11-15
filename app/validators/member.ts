import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { artistSuggestionFields, artistSuggestionMessages } from '#validators/artist_suggestion'

export const memberProfileValidator = vine.compile(
  vine.object({ name: vine.string().trim().minLength(2).maxLength(50) })
)
memberProfileValidator.messagesProvider = new SimpleMessagesProvider({
  'required': 'Ton pseudo est obligatoire.',
  'name.minLength': 'Ton pseudo doit contenir au moins 2 caractères.',
  'name.maxLength': 'Ton pseudo ne doit pas dépasser 50 caractères.',
})

export const memberSuggestionValidator = vine.compile(vine.object(artistSuggestionFields()))
memberSuggestionValidator.messagesProvider = artistSuggestionMessages
