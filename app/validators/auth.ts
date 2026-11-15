import vine, { SimpleMessagesProvider } from '@vinejs/vine'

const messages = new SimpleMessagesProvider({
  'required': 'Ce champ est obligatoire.',
  'string': 'Saisis un texte valide.',
  'email': 'Saisis une adresse email valide.',
  'name.minLength': 'Ton nom doit contenir au moins 2 caractères.',
  'name.maxLength': 'Ton nom ne doit pas dépasser 50 caractères.',
  'email.maxLength': 'Cette adresse email est trop longue.',
  'password.minLength': 'Choisis un mot de passe d’au moins 8 caractères.',
  'password.maxLength': 'Le mot de passe ne doit pas dépasser 128 caractères.',
  'password.confirmed': 'Les deux mots de passe doivent être identiques.',
  'token.regex': 'Ce lien est invalide ou a expiré. Demande un nouveau lien.',
})

const email = () => vine.string().trim().toLowerCase().maxLength(254).email()
const returnTo = () => vine.string().maxLength(1000).optional()
const newPassword = () => vine.string().minLength(8).maxLength(128).confirmed()

export const loginValidator = vine.compile(
  vine.object({
    email: email(),
    // Do not reject a valid legacy password merely because today's signup policy changed.
    password: vine.string().minLength(1).maxLength(128),
    returnTo: returnTo(),
  })
)

export const registerValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(50),
    email: email(),
    password: newPassword(),
    returnTo: returnTo(),
  })
)

export const forgotPasswordValidator = vine.compile(
  vine.object({ email: email(), returnTo: returnTo() })
)

export const resetPasswordValidator = vine.compile(
  vine.object({
    token: vine.string().regex(/^[a-zA-Z0-9_-]{43}$/),
    password: newPassword(),
    returnTo: returnTo(),
  })
)

for (const validator of [
  loginValidator,
  registerValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
]) {
  validator.messagesProvider = messages
}
