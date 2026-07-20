import User from '#models/user'
import { loginValidator, registerValidator } from '#validators/auth'
import string from '@adonisjs/core/helpers/string'
import type { HttpContext } from '@adonisjs/core/http'

export default class AuthController {
  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/LoginPage', {}, { title: 'Connexion' })
  }

  async login({ auth, request, response, session }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(payload.email, payload.password)
      await auth.use('web').login(user, payload.remember ?? false)
      return response.redirect().toPath('/')
    } catch (error) {
      if ((error as { code?: string }).code === 'E_INVALID_CREDENTIALS') {
        session.flash('errors', { email: 'Email ou mot de passe invalide.' })
        session.flash('old', { email: payload.email, remember: payload.remember ?? false })
        return response.redirect().back()
      }

      throw error
    }
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/RegisterPage', {}, { title: 'Créer un compte' })
  }

  async register({ auth, request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)
    const username = await this.makeUniqueUsername(payload.name, payload.email)

    const user = await User.create({
      fullName: payload.name,
      email: payload.email,
      password: payload.password,
      username,
    })

    await auth.use('web').login(user)
    return response.redirect().toPath('/')
  }

  async logout({ auth, response }: HttpContext) {
    await auth.use('web').logout()
    return response.redirect().toPath('/')
  }

  private async makeUniqueUsername(name: string, email: string) {
    const fallback = email.split('@')[0] || 'stayconnect'
    const base = string.slug(name, { lower: true, replacement: '' }) || fallback.toLowerCase()
    let username = base.slice(0, 30) || 'stayconnect'
    let suffix = 1

    while (await User.findBy('username', username)) {
      const nextSuffix = `${suffix++}`
      const trimmedBase = base.slice(0, Math.max(1, 30 - nextSuffix.length))
      username = `${trimmedBase}${nextSuffix}`
    }

    return username
  }
}
