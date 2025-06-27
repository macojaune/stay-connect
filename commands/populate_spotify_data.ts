import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Artist from '#models/artist'
import Category from '#models/category'
import fs from 'node:fs/promises'
import { DateTime } from 'luxon'

export default class PopulateSpotifyData extends BaseCommand {
  static commandName = 'spotify:populate-data'
  static description = 'Populate database with artists and categories from Spotify JSON file'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const filePath = this.app.makePath('uploads/spotify-artists971.json')
    this.logger.info(`Reading file: ${filePath}`)
    try {
      // Read and parse the JSON file
      const fileContent = await fs.readFile(filePath, 'utf-8')
      const spotifyData = JSON.parse(fileContent)

      if (!spotifyData.items || !Array.isArray(spotifyData.items)) {
        this.logger.error('Invalid JSON structure: missing items array')
        return
      }

      this.logger.info(`Found ${spotifyData.items.length} artists to process`)

      // Track statistics
      let artistsCreated = 0
      let artistsSkipped = 0
      let categoriesCreated = 0
      let categoriesSkipped = 0
      const processedGenres = new Set<string>()

      // First, create all unique categories from genres
      this.logger.info('Processing genres as categories...')

      for (const artistData of spotifyData.items) {
        if (artistData.genres && Array.isArray(artistData.genres)) {
          for (const genre of artistData.genres) {
            if (!processedGenres.has(genre)) {
              processedGenres.add(genre)

              // Check if category already exists
              const existingCategory = await Category.findBy('name', genre)

              if (!existingCategory) {
                await Category.create({
                  name: genre,
                  description: `Genre: ${genre}`,
                  createdAt: DateTime.now(),
                  updatedAt: DateTime.now(),
                })
                categoriesCreated++
                this.logger.info(`Created category: ${genre}`)
              } else {
                categoriesSkipped++
              }
            }
          }
        }
      }

      this.logger.info(
        `Categories processed: ${categoriesCreated} created, ${categoriesSkipped} skipped`
      )

      // Now create artists
      this.logger.info('Processing artists...')

      for (const artistData of spotifyData.items) {
        try {
          // Check if artist already exists by Spotify ID
          const existingArtist = await Artist.findBy('spotify_id', artistData.id)
          let artist = null
          if (!existingArtist) {
            // Get profile picture URL (use the medium size image)
            let profilePicture = null
            if (artistData.images && artistData.images.length > 0) {
              // Try to get 320x320 image, fallback to first available
              const mediumImage = artistData.images.find((img) => img.width === 320)
              profilePicture = mediumImage ? mediumImage.url : artistData.images[0].url
            }

            // Create the artist
            artist = await Artist.create({
              name: artistData.name,
              description: `Spotify artist with ${artistData.followers?.total || 0} followers`,
              profilePicture: profilePicture,
              followers: artistData.followers?.total || 0,
              spotifyId: artistData.id,
              lastSpotifyCheck: DateTime.now(),
              isVerified: artistData.popularity > 50, // Consider popular artists as verified
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            })
            artistsCreated++
          } else {
            artistsSkipped++
          }
          // Associate artist with genres/categories
          if (artistData.genres && Array.isArray(artistData.genres)) {
            const artistToEdit = existingArtist || artist

            const categories = await Category.query().whereIn('name', artistData.genres)
            if (artistToEdit && categories.length > 0) {
              const existingRelatedCategories = await artistToEdit
                .related('categories')
                .query()
                .whereIn(
                  'category_id',
                  categories.map((cat) => cat.id)
                )

              const categoriesToAttach = categories.filter(
                (cat) => !existingRelatedCategories.map((c) => c.id).includes(cat.id)
              )
              const pivotData = categoriesToAttach.reduce((acc, cat) => {
                acc[cat.id] = {
                  created_at: DateTime.now().toSQL(),
                  updated_at: DateTime.now().toSQL(),
                }
                return acc
              }, {})
              await artistToEdit.related('categories').attach(pivotData)
            }
          }

          this.logger.info(`Processed artist: ${artistData.name} (${artistData.id})`)
        } catch (error) {
          this.logger.error(`Error processing artist ${artistData.name}: ${error.message}`)
        }
      }

      // Final statistics
      this.logger.info('\n=== POPULATION COMPLETE ===')
      this.logger.info(`Artists: ${artistsCreated} created, ${artistsSkipped} skipped`)
      this.logger.info(`Categories: ${categoriesCreated} created, ${categoriesSkipped} skipped`)
      this.logger.info(`Total genres processed: ${processedGenres.size}`)
    } catch (error) {
      this.logger.error(`Error reading or parsing file: ${error.message}`)
      this.logger.error('Make sure the file exists and contains valid JSON')
    }
  }
}
