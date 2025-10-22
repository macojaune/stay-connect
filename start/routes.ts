/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
const SpotifyArtistsController = () => import('#controllers/spotify_artists_controller')
//healthcheck
router.get('/health', '#controllers/health_checks_controller')

// Secure cron endpoints
router
  .group(() => {
    router.post('/spotify-releases', '#controllers/cron_controller.spotifyReleases')
    router.post('/weekly-recap', '#controllers/cron_controller.weeklyRecap')
    router.get('/health', '#controllers/cron_controller.health')
  })
  .prefix('/cron')

// Web routes
router.get('/', '#controllers/home_controller.index').as('home')
router.get('/sorties/:slug', '#controllers/release_pages_controller.show').as('releases.show')

// Newsletter routes
router.post('/newsletter', '#controllers/home_controller.subscribe')

// API routes group
router
  .group(() => {
    //Telegram bot

    // Spotify artist routes
    router
      .group(() => {
        router.get('/spotify/artists/search', [SpotifyArtistsController, 'search'])
        router.post('/spotify/artists/create', [SpotifyArtistsController, 'create'])
      })
      .use(middleware.auth({ guards: ['api'] }))

    // Public routes
    //     router.get('/artists', 'artists_controller.index')
    //     router.get('/artists/:id', 'artists_controller.show')
    //     router.get('/releases', 'releases_controller.index')
    //     router.get('/releases/:id', 'releases_controller.show')
    //     router.get('/categories', 'categories_controller.index')
    //     router.get('/categories/:id', 'categories_controller.show')
    //     // Protected routes
    //     router
    //       .group(() => {
    //         // User routes
    //         router.get('/users', 'users_controller.index')
    //         router.get('/users/:id', 'users_controller.show')
    //         router.put('/users/:id', 'users_controller.update')
    //         router.delete('/users/:id', 'users_controller.destroy')
    //         // Artist routes
    //         router.post('/artists', 'artists_controller.store')
    //         router.put('/artists/:id', 'artists_controller.update')
    //         router.delete('/artists/:id', 'artists_controller.destroy')
    //         // Release routes
    //         router.post('/releases', 'releases_controller.store')
    //         router.put('/releases/:id', 'releases_controller.update')
    //         router.delete('/releases/:id', 'releases_controller.destroy')
    //         // Category routes
    //         router.post('/categories', 'categories_controller.store')
    //         router.put('/categories/:id', 'categories_controller.update')
    //         router.delete('/categories/:id', 'categories_controller.destroy')
    //         // Vote routes
    //         router.post('/releases/:id/vote', 'votes_controller.store')
    //         router.put('/releases/:id/vote', 'votes_controller.update')
    //         router.delete('/releases/:id/vote', 'votes_controller.destroy')
    //         // Artist-Category relationships
    //         router.post('/artists/:id/categories', 'artists_controller.addCategory')
    //         router.delete('/artists/:id/categories/:categoryId', 'artists_controller.removeCategory')
    //         // Release-Category relationships
    //         router.post('/releases/:id/categories', 'releases_controller.addCategory')
    //         router.delete('/releases/:id/categories/:categoryId', 'releases_controller.removeCategory')
    //         // Queue management routes
    //         router.get('/queue/status', 'queue_controller.status')
    //         router.post('/queue/trigger', 'queue_controller.trigger')
    //         router.post('/queue/toggle', 'queue_controller.toggle')
    //         router.get('/queue/health', 'queue_controller.health')
    //       })
    //       .use(middleware.auth())
  })
  .prefix('/api')
