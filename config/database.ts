import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        ssl: env.get('DB_SSL', false)
          ? {
            rejectUnauthorized: env.get('DB_SSL_REJECT_UNAUTHORIZED', true),
          }
          : undefined,
        keepAlive: env.get('DB_KEEPALIVE_ENABLED', true),
        keepAliveInitialDelayMillis: env.get('DB_KEEPALIVE_INITIAL_DELAY', 0),
      },
      healthCheck: true,
      pool: {
        min: env.get('DB_POOL_MIN', 1),
        max: env.get('DB_POOL_MAX', 10),
        acquireTimeoutMillis: env.get('DB_POOL_ACQUIRE_TIMEOUT', 60000),
        idleTimeoutMillis: env.get('DB_POOL_IDLE_TIMEOUT', 10000),
        reapIntervalMillis: env.get('DB_POOL_REAP_INTERVAL', 1000),
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
