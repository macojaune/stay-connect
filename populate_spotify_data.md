# Populate Spotify Data Command

This command will populate your database with artists and categories from the provided Spotify JSON file.

## Usage

1. **Make sure the database is migrated:**
   ```bash
   node ace migration:run
   ```

2. **Run the populate command:**
   ```bash
   node ace spotify:populate-data
   ```

## What it does

1. **Reads the Spotify JSON file** from `uploads/spotify-artists971.json`
2. **Creates categories** from all unique genres found in the artist data
3. **Creates artists** with the following information:
   - Name
   - Description (includes follower count)
   - Profile picture (medium size from Spotify images)
   - Follower count
   - Spotify ID
   - Verification status (based on popularity > 50)
   - Last Spotify check timestamp
4. **Associates artists with their genres** through the many-to-many relationship

## Data Structure Expected

The command expects a JSON file with this structure:
```json
{
  "items": [
    {
      "id": "spotify_artist_id",
      "name": "Artist Name",
      "genres": ["genre1", "genre2"],
      "followers": {
        "total": 12345
      },
      "images": [
        {
          "url": "image_url",
          "width": 320,
          "height": 320
        }
      ],
      "popularity": 45
    }
  ]
}
```

## Output

The command will show:
- Progress for each category and artist created
- Final statistics:
  - Number of artists created/skipped
  - Number of categories created/skipped
  - Total genres processed

## Error Handling

- Skips artists that already exist (by Spotify ID)
- Skips categories that already exist (by name)
- Continues processing even if individual artists fail
- Logs detailed error messages for troubleshooting

## Database Tables Affected

- `artists` - New artist records
- `categories` - New category records from genres
- `artist_categories` - Many-to-many relationships between artists and genres