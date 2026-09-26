import { createHash, randomBytes } from 'node:crypto'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import User from '#models/user'
import PasswordResetToken from '#models/password_reset_token'

const tokenPattern = /^[a-zA-Z0-9_-]{43}$/

export default class PasswordResetService {
  static readonly lifetimeMinutes = 30

  private digest(token: string) {
    return createHash('sha256').update(token).digest('hex')
  }

  /** The plaintext token only leaves this method for the transactional email. */
  async issue(user: User): Promise<string> {
    const token = randomBytes(32).toString('base64url')

    await db.transaction(async (trx) => {
      // Issuing and consuming tokens acquire the same user lock in the same order.
      await User.query({ client: trx }).where('id', user.id).forUpdate().firstOrFail()
      await PasswordResetToken.updateOrCreate(
        { userId: user.id },
        {
          tokenHash: this.digest(token),
          expiresAt: DateTime.utc().plus({ minutes: PasswordResetService.lifetimeMinutes }),
          createdAt: DateTime.utc(),
        },
        { client: trx }
      )
    })

    return token
  }

  async isValid(token: string): Promise<boolean> {
    if (!tokenPattern.test(token)) return false
    const record = await PasswordResetToken.query().where('token_hash', this.digest(token)).first()
    return Boolean(record && record.expiresAt.toMillis() > Date.now())
  }

  async consume(token: string, password: string): Promise<boolean> {
    if (!tokenPattern.test(token)) return false
    const tokenHash = this.digest(token)

    return db.transaction(async (trx) => {
      const candidate = await PasswordResetToken.query({ client: trx })
        .where('token_hash', tokenHash)
        .first()
      if (!candidate) return false

      const user = await User.query({ client: trx })
        .where('id', candidate.userId)
        .forUpdate()
        .first()
      if (!user) return false

      // Recheck after the lock: another request may have consumed or replaced the token.
      const current = await PasswordResetToken.query({ client: trx })
        .where('user_id', user.id)
        .where('token_hash', tokenHash)
        .first()
      if (!current || current.expiresAt.toMillis() <= Date.now()) return false

      user.password = password
      user.authVersion += 1
      await user.save()
      await current.delete()
      return true
    })
  }
}
