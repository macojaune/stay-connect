import { createHash } from 'node:crypto'
import queue from '@rlanz/bull-queue/services/main'

type AuthAction = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'artist-suggestion'

const limits: Record<AuthAction, { window: number; ip: number; identity: number }> = {
  'login': { window: 15 * 60, ip: 30, identity: 10 },
  'register': { window: 60 * 60, ip: 15, identity: 5 },
  'forgot-password': { window: 15 * 60, ip: 10, identity: 3 },
  'reset-password': { window: 15 * 60, ip: 20, identity: 8 },
  'artist-suggestion': { window: 60 * 60, ip: 30, identity: 10 },
}

// INCR and expiry are one operation, including simultaneous requests on different workers.
const consumeScript = `
local wait = 0
for i, key in ipairs(KEYS) do
  local count = redis.call('INCR', key)
  if count == 1 then redis.call('EXPIRE', key, ARGV[1]) end
  if count > tonumber(ARGV[i + 1]) then
    wait = math.max(wait, redis.call('TTL', key))
  end
end
return wait
`

export default class AuthRateLimiter {
  async consume(action: AuthAction, ip: string, identity: unknown): Promise<number> {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      return await Promise.race([
        this.consumeShared(action, ip, identity),
        new Promise<number>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('Authentication rate limiter timed out')), 2000)
        }),
      ])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  private async consumeShared(action: AuthAction, ip: string, identity: unknown): Promise<number> {
    const policy = limits[action]
    const normalized = typeof identity === 'string' ? identity.trim().toLowerCase() : ''
    const digest = (value: string) => createHash('sha256').update(value).digest('hex')
    const redis = await queue.getOrSet().client
    const result: unknown = await redis.eval(
      consumeScript,
      2,
      `stayconnect:auth:${action}:ip:${digest(ip)}`,
      `stayconnect:auth:${action}:identity:${digest(normalized)}`,
      policy.window,
      policy.ip,
      policy.identity
    )

    if (typeof result !== 'number' || result < 0) {
      throw new Error('Invalid authentication rate limiter response')
    }

    return result
  }
}
