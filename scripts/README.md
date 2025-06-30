# Spotify Releases Cron Scripts

This directory contains cron scripts to automatically fetch Spotify releases using different approaches.

## Files

- `fetch_spotify_releases_secure.sh` - **Recommended** HTTP endpoint approach with security
- `fetch_spotify_releases.sh` - Legacy Docker service scaling approach
- `test_spotify_fetch.sh` - Test script for the legacy approach

## Recommended Approach: Secure HTTP Endpoint

### Security Features

- **API Key Authentication**: Requires `CRON_API_KEY` environment variable
- **IP Whitelist**: Only allows requests from specified IP addresses
- **Request Logging**: All access attempts are logged
- **Timeout Protection**: 5-minute timeout to prevent hanging requests

### Setup Instructions

#### 1. Generate a secure API key

```bash
# Generate a random 32-byte hex key
openssl rand -hex 32
```

#### 2. Configure environment variables

Add to your `.env` file:

```bash
# Cron Security
CRON_API_KEY=your_generated_api_key_here
CRON_ALLOWED_IPS=127.0.0.1,::1,your_server_ip
```

#### 3. Make the script executable

```bash
chmod +x /path/to/stayConnect/scripts/fetch_spotify_releases_secure.sh
```

#### 4. Set up environment for cron

Create a wrapper script or add to your crontab:

```bash
# Option 1: Export in crontab
CRON_API_KEY=your_api_key_here
0 6 * * * /path/to/stayConnect/scripts/fetch_spotify_releases_secure.sh

# Option 2: Create wrapper script
echo '#!/bin/bash' > /usr/local/bin/spotify-cron.sh
echo 'export CRON_API_KEY="your_api_key_here"' >> /usr/local/bin/spotify-cron.sh
echo '/path/to/stayConnect/scripts/fetch_spotify_releases_secure.sh' >> /usr/local/bin/spotify-cron.sh
chmod +x /usr/local/bin/spotify-cron.sh

# Then in crontab:
0 6 * * * /usr/local/bin/spotify-cron.sh
```

#### 5. Configure logging

```bash
touch ~/spotify_releases_cron.log
```

### API Endpoints

#### Spotify Releases Check
- **URL**: `POST /cron/spotify-releases`
- **Authentication**: API key via `X-API-Key` header or `api_key` parameter
- **Response**: JSON with execution stats

#### Health Check
- **URL**: `GET /cron/health`
- **Authentication**: None required
- **Response**: Service health status

### Example Usage

```bash
# Manual test
curl -X POST \
  -H "X-API-Key: your_api_key" \
  http://localhost:3333/cron/spotify-releases

# Health check
curl http://localhost:3333/cron/health
```

### Cron Schedule Examples

```bash
# Daily at 6 AM
0 6 * * * /usr/local/bin/spotify-cron.sh

# Every 6 hours
0 */6 * * * /usr/local/bin/spotify-cron.sh

# Weekly on Friday at 9 AM
0 9 * * 5 /usr/local/bin/spotify-cron.sh
```

## Advantages of HTTP Endpoint Approach

✅ **No scaling overhead** - Uses existing running containers
✅ **Immediate execution** - No 30+ second startup time
✅ **Better error handling** - HTTP status codes and JSON responses
✅ **Easier monitoring** - Standard HTTP monitoring tools
✅ **Auto-scaling compatible** - Leverages Docker Swarm's load balancing
✅ **Secure** - API key + IP whitelist protection
✅ **Lightweight** - Simple HTTP request vs container orchestration

## Monitoring

### Check logs
```bash
tail -f ~/spotify_releases_cron.log
```

### Monitor application logs
```bash
docker service logs stayconnect_adonis_app
```

### Test endpoint health
```bash
curl http://localhost:3333/cron/health
```

## Troubleshooting

### Authentication Issues
- Verify `CRON_API_KEY` is set correctly
- Check API key matches between script and application
- Ensure no extra whitespace in environment variables

### IP Access Issues
- Add your server's IP to `CRON_ALLOWED_IPS`
- For Docker, you might need the container's IP
- Use `127.0.0.1,::1` for localhost access

### Connection Issues
- Verify the application is running: `docker service ls`
- Check port 3333 is accessible
- Test with curl manually first

### Application Errors
- Check application logs for detailed error messages
- Verify Spotify API credentials are configured
- Ensure database connectivity

## Security Best Practices

1. **Use strong API keys** (32+ characters, random)
2. **Restrict IP access** to known servers only
3. **Rotate API keys** periodically
4. **Monitor access logs** for unauthorized attempts
5. **Use HTTPS** in production environments
6. **Keep logs secure** and rotate them regularly

## Migration from Legacy Script

If you're currently using `fetch_spotify_releases.sh`:

1. Set up the new environment variables
2. Test the new script manually
3. Update your crontab to use the new script
4. Remove the old script once confirmed working

The new approach is more efficient and reliable for production use.