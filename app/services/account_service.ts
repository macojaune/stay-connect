import User from '#models/user'
import string from '@adonisjs/core/helpers/string'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'
import { errors as authErrors } from '@adonisjs/auth'
import { errors as validationErrors } from '@vinejs/vine'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

export interface RegisterAccountInput {
  name: string
  email: string
  password: string
}

export default class AccountService {
  async verifyCredentials(email: string, password: string): Promise<User> {
    const users = await User.query().whereRaw('LOWER(email) = ?', [email.toLowerCase()]).limit(2)
    const user = users.length === 1 ? users[0] : undefined
    if (!user) {
      // Match the expensive password operation for unknown and ambiguous legacy addresses.
      await hash.use('scrypt').make(password)
      throw new authErrors.E_INVALID_CREDENTIALS('Invalid user credentials')
    }
    if (!(await user.verifyPassword(password))) {
      throw new authErrors.E_INVALID_CREDENTIALS('Invalid user credentials')
    }
    return user
  }

  async register(payload: RegisterAccountInput): Promise<User> {
    const email = payload.email.trim().toLowerCase()
    return db.transaction(async (trx) => {
      // Serialize case-insensitive uniqueness checks without rewriting legacy addresses.
      await trx.rawQuery('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [
        `stayconnect:email:${email}`,
      ])
      const existing = await User.query({ client: trx })
        .whereRaw('LOWER(email) = ?', [email])
        .first()
      if (existing) {
        throw new validationErrors.E_VALIDATION_ERROR([
          {
            field: 'email',
            rule: 'unique',
            message: 'Un compte utilise déjà cette adresse email.',
          },
        ])
      }

      const username = await this.makeUniqueUsername(payload.name, email, trx)
      return User.create(
        { fullName: payload.name, email, password: payload.password, username, authVersion: 0 },
        { client: trx }
      )
    })
  }

  private async makeUniqueUsername(name: string, email: string, trx: TransactionClientContract) {
    const fallback = email.split('@')[0] || 'stayconnect'
    const base = string.slug(name, { lower: true, replacement: '' }) || fallback.toLowerCase()
    // Different bases can converge to the same candidate ("bob" -> "bob1").
    // Serialize the short allocation step globally, not only by original base.
    await trx.rawQuery('SELECT pg_advisory_xact_lock(hashtextextended(?, 0))', [
      'stayconnect:username-allocation',
    ])
    let username = base.slice(0, 30) || 'stayconnect'
    let suffix = 1
    while (await User.query({ client: trx }).where('username', username).first()) {
      const nextSuffix = `${suffix++}`
      username = `${base.slice(0, Math.max(1, 30 - nextSuffix.length))}${nextSuffix}`
    }
    return username
  }
}
