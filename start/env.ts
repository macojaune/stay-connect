/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  APP_URL: Env.schema.string(),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string(),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the mail package
  |----------------------------------------------------------
  */
  BREVO_API_KEY: Env.schema.string(),
  BREVO_CONTACT_LIST_ID: Env.schema.number(),
  MAIL_FROM_ADDRESS: Env.schema.string({ format: 'email' }),
  MAIL_FROM_NAME: Env.schema.string(),
  /*
  |----------------------------------------------------------
  | Variables for configuring spotify api
  |----------------------------------------------------------
  */
  SPOTIFY_CLIENT_ID: Env.schema.string(),
  SPOTIFY_CLIENT_SECRET: Env.schema.string(),
  /*
  |----------------------------------------------------------
  | Variables for configuring the queue 
  |----------------------------------------------------------
  */
  QUEUE_ENABLED: Env.schema.boolean(),
  /*
  |----------------------------------------------------------
  | Variables for configuring umami analytics
  |----------------------------------------------------------
  */
  UMAMI_SCRIPT_URL: Env.schema.string.optional(),
  UMAMI_WEBSITE_ID: Env.schema.string.optional(),
  AXEPTIO_CLIENT_ID: Env.schema.string.optional(),
  /*
  |----------------------------------------------------------
  | Variables for configuring cron security
  |----------------------------------------------------------
  */
  CRON_API_KEY: Env.schema.string.optional(),
  CRON_ALLOWED_IPS: Env.schema.string.optional(),
  API_KEY: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for @rlanz/bull-queue
  |----------------------------------------------------------
  */
  QUEUE_REDIS_HOST: Env.schema.string({ format: 'host' }),
  QUEUE_REDIS_PORT: Env.schema.number(),
  QUEUE_REDIS_PASSWORD: Env.schema.string.optional()
})
