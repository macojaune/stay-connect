# Spotify Integration Guide

This guide explains how to set up and use the Spotify integration for automatic release checking and artist synchronization.

## Setup

### 1. Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app or use an existing one
3. Copy your Client ID and Client Secret
4. Add them to your `.env` file:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

### 2. Database Migration

Run the migration to add Spotify fields to your database:

```bash
node ace migration:run
```

This adds:
- `spotify_id` and `last_spotify_check` to the `artists` table
- `spotify_id` and `artist_id` to the `releases` table

### 3. Queue System

Enable the queue system for automatic periodic tasks:

```env
QUEUE_ENABLED=true
```

## Usage

### Manual Commands

#### Check for New Releases

```bash
# Check all artists for new releases
node ace spotify:check-releases

# Check specific artists (comma-separated IDs)
node ace spotify:check-releases --artists=1,2,3

# Limit the number of artists to process
node ace spotify:check-releases --limit=10
```

#### Sync Artist Information

```bash
# Sync all artists
node ace spotify:sync-artists

# Sync specific artist
node ace spotify:sync-artists --artist=1

# Force sync (ignore last check time)
node ace spotify:sync-artists --force

# Process in batches
node ace spotify:sync-artists --batch-size=5
```

### Queue Management

#### Start Queue Service

```bash
# Start queue in daemon mode (keeps running)
node ace queue:manage --action=start --daemon

# Start queue for one-time processing
node ace queue:manage --action=start
```

#### Check Queue Status

```bash
node ace queue:manage --action=status
```

#### Manually Trigger Jobs

```bash
# Trigger Spotify release check
node ace queue:manage --action=trigger --job-id=spotify-check-releases

# Trigger artist sync
node ace queue:manage --action=trigger --job-id=spotify-sync-artists
```

#### Stop Queue Service

```bash
node ace queue:manage --action=stop
```

## Automatic Scheduling

When the queue service is enabled, the following jobs run automatically:

- **Spotify Release Check**: Every 6 hours
- **Artist Sync**: Daily at 2 AM

### Production Setup

For production, you can:

1. **Use PM2** (recommended):

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
echo 'module.exports = {
  apps: [{
    name: "stayconnect-app",
    script: "build/bin/server.js",
    instances: 1,
    env: {
      NODE_ENV: "production",
      QUEUE_ENABLED: "true"
    }
  }, {
    name: "stayconnect-queue",
    script: "build/bin/console.js",
    args: "queue:manage --action=start --daemon",
    instances: 1,
    env: {
      NODE_ENV: "production"
    }
  }]
}' > ecosystem.config.js

# Start both app and queue
pm2 start ecosystem.config.js
```

2. **Use systemd service**:

```bash
# Create service file
sudo nano /etc/systemd/system/stayconnect-queue.service
```

```ini
[Unit]
Description=StayConnect Queue Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/node build/bin/console.js queue:manage --action=start --daemon
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable stayconnect-queue
sudo systemctl start stayconnect-queue
```

3. **Use Docker Compose**:

Add to your `docker-compose.yml`:

```yaml
services:
  queue:
    build: .
    command: node build/bin/console.js queue:manage --action=start --daemon
    environment:
      - NODE_ENV=production
      - QUEUE_ENABLED=true
    depends_on:
      - postgres
    restart: unless-stopped
```

## Data Flow

### Artist Sync Process

1. Fetches artists from database that have `spotify_id`
2. Calls Spotify API to get updated artist information
3. Updates artist data (followers, genres, etc.)
4. Updates `last_spotify_check` timestamp

### Release Check Process

1. Fetches artists from database that have `spotify_id`
2. For each artist:
   - Calls Spotify API to get artist's albums
   - Compares with existing releases in database
   - Creates new release records for new albums
   - Associates releases with artist and categories (genres)

## Error Handling

- **Rate Limiting**: Automatic retry with exponential backoff
- **API Errors**: Logged and skipped, processing continues
- **Network Issues**: Jobs retry up to 3 times before being disabled
- **Invalid Data**: Validation errors are logged and skipped

## Monitoring

Check logs for queue activity:

```bash
# View application logs
tail -f storage/logs/app.log

# View queue-specific logs
grep "Queue\|Spotify" storage/logs/app.log
```

## Troubleshooting

### Common Issues

1. **Queue not starting**:
   - Check `QUEUE_ENABLED=true` in `.env`
   - Verify Spotify credentials are set
   - Check application logs

2. **No new releases found**:
   - Ensure artists have `spotify_id` set
   - Check if artists have recent releases on Spotify
   - Verify API credentials are working

3. **High memory usage**:
   - Reduce batch sizes in commands
   - Increase processing intervals
   - Monitor with `node ace queue:manage --action=status`

### Debug Mode

Run commands with debug logging:

```bash
LOG_LEVEL=debug node ace spotify:check-releases
```

## API Rate Limits

Spotify API has the following limits:
- **Client Credentials**: 1000 requests per hour
- **Search**: 100 requests per minute

The integration handles this by:
- Using client credentials flow (no user auth required)
- Implementing exponential backoff on rate limit errors
- Processing artists in batches to stay within limits

## Security Notes

- Spotify credentials are stored as environment variables
- No user authentication tokens are stored
- All API calls use server-to-server authentication
- Rate limiting prevents API abuse