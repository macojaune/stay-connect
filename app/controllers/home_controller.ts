import env from '#start/env'
import { createLeadValidator } from '#validators/newsletter'
import type { HttpContext } from '@adonisjs/core/http'
import { ContactsApi, ContactsApiApiKeys } from '@getbrevo/brevo'

export default class HomeController {
  index({ inertia }: HttpContext) {
    // todo fetch today news
    // todo fetch past news
    return inertia.render('home', { errors: undefined })
  }

  async subscribe({ inertia, request }: HttpContext) {
    const data = request.all()
    const [errors, payload] = await createLeadValidator.tryValidate(data)
    if (!errors) {
      const contactsApi = new ContactsApi()
      contactsApi.setApiKey(ContactsApiApiKeys.apiKey, env.get('BREVO_API_KEY'))

      const res = await contactsApi.createContact({
        email: payload?.email,
        listIds: [3],
        attributes: {
          IS_ARTIST: payload.type === 'artist',
          ARTIST_NAME: payload.artistName,
          ROLE: payload.role,
          USERNAME: payload.username,
        },
      })
    }
      
    return inertia.render('home', { errors: errors?.messages })
  }
}
