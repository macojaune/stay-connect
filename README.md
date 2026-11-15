# StayConnect

StayConnect is a Caribbean music discovery platform focused on Antilles-Guyane releases. The current product combines four core loops:

- release discovery on the homepage timeline
- upcoming drop visibility for next-week releases
- newsletter capture for listeners and artists
- community reviews on individual release pages

The stack is AdonisJS 6 + Inertia + React + PostgreSQL, with optional Redis-backed background jobs for Spotify sync and weekly recap email delivery.

## Product map

### Homepage

`GET /` renders the landing page and timeline.

- `HomeController.index` loads releases from the last 4 weeks through next week.
- Releases are grouped into three contributor-relevant sections:
  - `À venir`: next week preview
  - `Cette semaine`: current releases
  - `La semaine passée`: recent recap
- The page also pulls artist names for the tag cloud and exposes two newsletter forms:
  - listener signup
  - artist signup

Newsletter submissions hit `POST /newsletter` and are pushed into Brevo with listener/artist metadata.

### Release page

`GET /sorties/:slug` renders the detail page for a release.

- Slugs are generated from artist + featured artists + title.
- The page loads the release, artist, categories, featured artists, and the 12 latest votes.
- It computes:
  - average rating
  - total review count
  - current viewer vote when authenticated
- Authenticated users can create, update, or delete their review through:
  - `POST /sorties/:releaseId/avis`
  - `PUT /sorties/:releaseId/avis`
  - `DELETE /sorties/:releaseId/avis`

### Auth and contributor access

The web app supports email/password auth:

- `GET /login`, `POST /login`
- `GET /register`, `POST /register`
- `POST /logout`

Auth is session-based for the web UI. Some API routes under `/api` use the Adonis API guard.

## Local setup

### Prerequisites

- Node.js 22+
- `pnpm`
- PostgreSQL
- Redis if you want background jobs enabled

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create env file

```bash
cp .env.example .env
```

Then set at least:

```env
APP_KEY=generate-a-real-secret
NODE_ENV=development
HOST=127.0.0.1
PORT=3333
APP_URL=http://localhost:3333

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=stayconnect

SESSION_DRIVER=cookie

BREVO_API_KEY=dummy-for-local
BREVO_CONTACT_LIST_ID=1
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME="Stay Connect"

SPOTIFY_CLIENT_ID=dummy-for-local
SPOTIFY_CLIENT_SECRET=dummy-for-local

QUEUE_ENABLED=false
QUEUE_REDIS_HOST=127.0.0.1
QUEUE_REDIS_PORT=6379
QUEUE_REDIS_PASSWORD=
```

Important: `start/env.ts` validates many values as required strings or numbers. Even if you are not using Brevo or Spotify locally, the app will not boot without placeholder values for those settings.

### 3. Create the database and run migrations

```bash
createdb stayconnect
node ace migration:run
```

### 4. Start the app

```bash
pnpm dev
```

Open `http://localhost:3333`.

### 5. Optional: run the queue worker

If you enable `QUEUE_ENABLED=true`, start Redis and run:

```bash
pnpm queue:listen
```

This keeps BullMQ workers alive for scheduled jobs and queued email sends.

## Environment dependencies

The most important variables are:

- `APP_KEY`: required Adonis app secret
- `DB_*`: PostgreSQL connection and pool tuning
- `BREVO_API_KEY`, `BREVO_CONTACT_LIST_ID`, `MAIL_FROM_*`: newsletter signup + weekly recap delivery
- `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`: Spotify release discovery and artist sync
- `QUEUE_ENABLED`, `QUEUE_REDIS_*`: repeatable jobs and worker execution
- `CRON_API_KEY`: protects `/cron/spotify-releases` and `/cron/weekly-recap`
- `UMAMI_SCRIPT_URL`, `UMAMI_WEBSITE_ID`, `AXEPTIO_CLIENT_ID`: optional analytics/consent integrations

## Release ingestion and review flow

### Spotify ingestion

There are two ways to refresh releases:

1. Direct command:

```bash
node ace spotify:check-releases
```

2. Secure HTTP cron endpoint:

```bash
curl -X POST \
  -H "X-API-Key: $CRON_API_KEY" \
  http://localhost:3333/cron/spotify-releases
```

The Spotify service checks artists with a `spotify_id`, fetches new releases, and stores matching records in Postgres.

### Queue schedules

When `QUEUE_ENABLED=true`, `start/queue.ts` registers repeatable jobs:

- Spotify release check: every 6 hours
- Spotify artist sync: every day at 02:00
- Weekly recap email: every Monday at 09:00

### Weekly recap pipeline

The weekly recap path is:

1. `WeeklyRecapService.buildDataset()` computes the previous week's release window.
2. It reuses `ReleaseExcerptService` to fetch up to 5 recent public releases.
3. If no excerpt data is found, it falls back to releases created during the same period.
4. Recipients are loaded from the configured Brevo list.
5. `EmailService` sends or queues the `WeeklyRecapMail`.

You can trigger it manually with:

```bash
node ace email:weekly-recap
```

Preview a single recipient:

```bash
node ace email:weekly-recap --email=you@example.com
```

Queue instead of immediate send:

```bash
node ace email:weekly-recap --send-later
```

Or call the protected HTTP endpoint:

```bash
curl -X POST \
  -H "X-API-Key: $CRON_API_KEY" \
  http://localhost:3333/cron/weekly-recap
```

## Repo landmarks

- `app/controllers/home_controller.ts`: homepage timeline + newsletter capture
- `app/controllers/release_pages_controller.ts`: release detail page payload
- `app/controllers/votes_controller.ts`: review create/update/delete
- `app/controllers/cron_controller.ts`: protected cron HTTP entrypoints
- `app/services/spotify_service.ts`: Spotify ingestion logic
- `app/services/weekly_recap_service.ts`: weekly digest dataset builder
- `app/services/release_excerpt_service.ts`: reusable release summary generator
- `commands/`: manual maintenance and email commands
- `start/routes.ts`: public web, auth, cron, and API route map
- `docs/SPOTIFY_INTEGRATION.md`: operational notes for queue + Spotify jobs
- `scripts/README.md`: shell-based cron helpers

## Useful commands

```bash
pnpm dev
pnpm queue:listen
pnpm test
pnpm lint
pnpm typecheck
node ace migration:run
node ace spotify:check-releases
node ace email:weekly-recap --email=you@example.com
```

## Notes for contributors

- The app uses server-side rendered Inertia pages. Shared auth and analytics props are configured in `config/inertia.ts`.
- Release URLs are stored as JSON and rendered into platform-specific listening links on the release page.
- Review counts are stored on the `releases.vote_count` column but the detail page also recomputes aggregates from the `votes` table.
- The current homepage and release pages are French-first. Keep copy changes consistent with that tone unless the product direction changes.
