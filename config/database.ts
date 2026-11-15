import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

// Lucid 21 uses a session advisory lock but releases that session to the pool.
// A migration process must retain it and must never replace it after a loss.
let migrationConnectionCreated = false

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
      pool: env.get('DB_MIGRATION_SINGLE_CONNECTION', false)
        ? {
            min: 1,
            max: 1,
            propagateCreateError: true,
            afterCreate(connection, done) {
              if (!migrationConnectionCreated) {
                migrationConnectionCreated = true
                done(null, connection)
                return
              }

              const failure = new Error(
                'Migration database connection was lost; retry the migration command.'
              )
              // Knex does not destroy a connection rejected by afterCreate.
              connection.end(() => done(failure, connection))
            },
          }
        : undefined,
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
