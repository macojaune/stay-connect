# Spotify Artist Search and Creation

This document describes the new Spotify artist search and creation functionality that can be used both from the command line and via API endpoints, making it perfect for integration with external services like Telegram bots.

## Overview

The system provides:
- Search for artists on Spotify
- Create new artists in the database from Spotify data
- Sync existing artists with latest Spotify information
- Check if artists already exist in the database
- Full API endpoints for external integration

## Command Line Usage

### Search for Artists

```bash
# Basic search
node ace spotify:search-artist "Daft Punk"

# Search with custom limit
node ace spotify:search-artist "Daft Punk" --limit=5

# Interactive mode to select and create artist
node ace spotify:search-artist "Daft Punk" --interactive --user-id="user-uuid"
```

### Command Options

- `query` (required): Artist name to search for
- `--limit`: Number of results to return (default: 10)
- `--interactive`: Interactive mode to select and create artist
- `--user-id`: User ID for creating the artist (required for creation)

## API Endpoints

### Public Endpoints (No Authentication Required)

#### 1. Search Artists
```http
GET /api/spotify/artists/search?query=Daft%20Punk&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "Daft Punk",
    "results": [
      {
        "id": "4tZwfgrHOc3mvqYlEYSvVi",
        "name": "Daft Punk",
        "genres": ["electronic", "filter house", "house"],
        "followers": 8234567,
        "images": [
          {
            "url": "https://i.scdn.co/image/...",
            "height": 640,
            "width": 640
          }
        ],
        "spotifyUrl": "https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi"
      }
    ],
    "count": 1
  }
}
```

#### 2. Get Artist Details
```http
GET /api/spotify/artists/4tZwfgrHOc3mvqYlEYSvVi/details
```

#### 3. Check if Artist Exists
```http
GET /api/spotify/artists/4tZwfgrHOc3mvqYlEYSvVi/exists
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": false,
    "artist": null
  }
}
```

### Protected Endpoints (Authentication Required)

#### 1. Create Artist from Spotify
```http
POST /api/spotify/artists/create
Content-Type: application/json
Authorization: Bearer <token>

{
  "spotifyId": "4tZwfgrHOc3mvqYlEYSvVi",
  "description": "French electronic music duo",
  "categories": ["category-uuid-1", "category-uuid-2"],
  "socials": ["https://daftpunk.com"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Artist created successfully",
  "data": {
    "artist": {
      "id": "artist-uuid",
      "name": "Daft Punk",
      "description": "French electronic music duo",
      "profilePicture": "https://i.scdn.co/image/...",
      "spotifyId": "4tZwfgrHOc3mvqYlEYSvVi",
      "followers": {
        "spotify": 8234567,
        "lastUpdated": "2024-01-15T10:30:00.000Z"
      },
      "isVerified": false,
      "categories": [...],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

#### 2. Search and Create in One Operation
```http
POST /api/spotify/artists/search-and-create
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "Daft Punk",
  "spotifyId": "4tZwfgrHOc3mvqYlEYSvVi",
  "description": "French electronic music duo",
  "limit": 10
}
```

#### 3. Sync Existing Artist
```http
POST /api/spotify/artists/artist-uuid/sync
Authorization: Bearer <token>
```

## Telegram Bot Integration Example

Here's how you could integrate this with a Telegram bot:

```javascript
// Telegram bot handler
bot.onText(/\/search (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];
  
  try {
    // Search for artists
    const response = await fetch(`${API_BASE}/api/spotify/artists/search?query=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    
    if (data.success && data.data.results.length > 0) {
      // Create inline keyboard with artist options
      const keyboard = {
        inline_keyboard: data.data.results.map((artist, index) => [{
          text: `${artist.name} (${artist.followers.toLocaleString()} followers)`,
          callback_data: `create_${artist.id}`
        }])
      };
      
      bot.sendMessage(chatId, 'Select an artist to add:', {
        reply_markup: keyboard
      });
    } else {
      bot.sendMessage(chatId, 'No artists found.');
    }
  } catch (error) {
    bot.sendMessage(chatId, 'Search failed. Please try again.');
  }
});

// Handle artist creation
bot.on('callback_query', async (callbackQuery) => {
  const data = callbackQuery.data;
  
  if (data.startsWith('create_')) {
    const spotifyId = data.replace('create_', '');
    
    try {
      const response = await fetch(`${API_BASE}/api/spotify/artists/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${USER_TOKEN}` // You'll need to handle auth
        },
        body: JSON.stringify({
          spotifyId: spotifyId,
          userId: callbackQuery.from.id // or map to your user system
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        bot.sendMessage(callbackQuery.message.chat.id, 
          `✅ Artist "${result.data.artist.name}" created successfully!`);
      } else {
        bot.sendMessage(callbackQuery.message.chat.id, 
          `❌ Failed to create artist: ${result.message}`);
      }
    } catch (error) {
      bot.sendMessage(callbackQuery.message.chat.id, 
        '❌ Failed to create artist. Please try again.');
    }
  }
});
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "data": {} // Optional additional data
}
```

Common error scenarios:
- Artist already exists (409 Conflict)
- Invalid Spotify ID (400 Bad Request)
- Authentication required (401 Unauthorized)
- Spotify API errors (500 Internal Server Error)

## Service Classes

### SpotifyService

The main service class that handles all Spotify operations including artist search:

```typescript
import SpotifyService from '#services/spotify_service'

const service = new SpotifyService()

// Search artists
const results = await service.searchArtistsFormatted('Daft Punk', 10)

// Create artist
const artist = await service.createArtistFromSpotify(spotifyResult, userId, {
  description: 'Custom description',
  categories: ['category-id-1']
})

// Check if exists
const existing = await service.findExistingArtistBySpotifyId('spotify-id')

// Search and create in one operation
const result = await service.searchAndCreate('query', userId, 'spotify-id')
```

## Configuration

Make sure you have the following environment variables set:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## Database Schema

The artist model includes these Spotify-related fields:
- `spotifyId`: Spotify artist ID
- `lastSpotifyCheck`: Last time the artist was synced with Spotify
- `followers`: JSON object containing follower counts
- `profilePicture`: URL to artist's profile picture from Spotify

## Rate Limiting

The Spotify service includes built-in rate limiting and retry logic:
- Exponential backoff for rate limit errors
- Automatic retry on temporary failures
- Respect for Spotify's rate limit headers

## Future Enhancements

- Bulk artist creation
- Automatic release detection and creation
- Artist recommendation based on genres
- Integration with other music platforms
- Webhook notifications for new releases