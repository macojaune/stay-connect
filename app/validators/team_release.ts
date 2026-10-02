import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import type { Infer } from '@vinejs/vine/types'
import { DateTime } from 'luxon'

const httpsUrl = vine
  .string()
  .trim()
  .url({
    require_protocol: true,
    protocols: ['https'],
  })

const releaseFields = {
  title: vine.string().trim().minLength(1).maxLength(200),
  description: vine.string().trim().maxLength(2000).optional(),
  date: vine.date({ formats: ['YYYY-MM-DD'] }).transform((value) => DateTime.fromJSDate(value)),
  type: vine.enum(['album', 'single', 'ep']),
  cover: httpsUrl.clone().nullable().optional(),
  // MIME and file extension are untrusted. CoverStorage checks the actual bytes.
  coverFile: vine.file({ size: '5mb' }).optional(),
  artistId: vine.string().uuid().nullable().optional(),
  newArtistName: vine.string().trim().minLength(2).maxLength(120).optional(),
  categoryIds: vine.array(vine.string().uuid()).maxLength(12).optional(),
  newCategoryName: vine.string().trim().minLength(2).maxLength(80).optional(),
}

export const createTeamReleaseValidator = vine.compile(
  vine.object({
    ...releaseFields,
    urls: vine.array(httpsUrl.clone()).minLength(1).maxLength(12),
  })
)

export const updateTeamReleaseValidator = vine.compile(
  vine.object({
    ...releaseFields,
    // A correction submits the full category selection. Missing input must not
    // silently detach the categories already linked to the release.
    categoryIds: vine.array(vine.string().uuid()).maxLength(12),
    urls: vine.array(httpsUrl.clone()).maxLength(12).optional(),
  })
)

const messages = new SimpleMessagesProvider({
  'required': 'Ce champ est obligatoire.',
  'string': 'Saisis un texte valide.',
  'array': 'Choisis une liste valide.',
  'enum': 'Choisis un format proposé.',
  'uuid': 'Choisis un élément du catalogue.',
  'date': 'Saisis une date de sortie valide.',
  'url': 'Utilise une adresse HTTPS valide.',
  'title.minLength': 'Saisis le titre de la sortie.',
  'title.maxLength': 'Le titre ne doit pas dépasser 200 caractères.',
  'description.maxLength': 'La description ne doit pas dépasser 2 000 caractères.',
  'cover.maxLength': 'L’adresse de la pochette est trop longue.',
  'file': 'Choisis un fichier image valide.',
  'file.size': 'La pochette ne doit pas dépasser 5 Mo.',
  'newArtistName.minLength': 'Le nom de l’artiste doit contenir au moins 2 caractères.',
  'newArtistName.maxLength': 'Le nom de l’artiste ne doit pas dépasser 120 caractères.',
  'newCategoryName.minLength': 'Le nom de la catégorie doit contenir au moins 2 caractères.',
  'newCategoryName.maxLength': 'Le nom de la catégorie ne doit pas dépasser 80 caractères.',
  'categoryIds.maxLength': 'Choisis au maximum 12 catégories, nouvelle catégorie comprise.',
  'urls.minLength': 'Ajoute au moins un lien d’écoute HTTPS.',
  'urls.maxLength': 'Ajoute au maximum 12 liens d’écoute.',
})
for (const validator of [createTeamReleaseValidator, updateTeamReleaseValidator]) {
  validator.messagesProvider = messages
}

export type TeamReleaseCreateInput = Infer<typeof createTeamReleaseValidator>
export type TeamReleaseUpdateInput = Infer<typeof updateTeamReleaseValidator>
export type TeamReleaseInput = TeamReleaseCreateInput | TeamReleaseUpdateInput
