#!/bin/bash

# Secure HTTP-based cron script to fetch Spotify releases
# This script calls the secure HTTP endpoint instead of scaling Docker services

set -e  # Exit on any error

# Configuration
API_ENDPOINT="http://localhost:3333/cron/spotify-releases"
API_KEY="${CRON_API_KEY:-}"
LOG_FILE="$HOME/spotify_releases_cron.log"
TIMEOUT=300  # 5 minutes timeout

# Function to log messages with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to generate a secure API key if needed
generate_api_key() {
    openssl rand -hex 32
}

# Check if API key is set
if [ -z "$API_KEY" ]; then
    log "ERROR: CRON_API_KEY environment variable is not set"
    log "Generate a secure API key with: openssl rand -hex 32"
    log "Then set it in your environment: export CRON_API_KEY=your_generated_key"
    exit 1
fi

log "Starting secure Spotify releases fetch via HTTP endpoint"

# Make the HTTP request with proper error handling
HTTP_STATUS=$(curl -w "%{http_code}" -s -o /tmp/cron_response.json \
    --max-time $TIMEOUT \
    -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    "$API_ENDPOINT" 2>/dev/null || echo "000")

# Check HTTP status
case $HTTP_STATUS in
    200)
        log "✅ Request successful (HTTP $HTTP_STATUS)"
        
        # Parse and log the response
        if command -v jq >/dev/null 2>&1; then
            STATS=$(jq -r '.stats | "Processed: \(.processed), New releases: \(.newReleases), Errors: \(.errors)"' /tmp/cron_response.json 2>/dev/null || echo "Could not parse stats")
            log "Stats: $STATS"
        else
            log "Response: $(cat /tmp/cron_response.json)"
        fi
        ;;
    401)
        log "❌ Authentication failed (HTTP $HTTP_STATUS) - Check your API key"
        exit 1
        ;;
    403)
        log "❌ Access forbidden (HTTP $HTTP_STATUS) - IP not allowed"
        exit 1
        ;;
    500)
        log "❌ Server error (HTTP $HTTP_STATUS) - Check application logs"
        if [ -f /tmp/cron_response.json ]; then
            log "Error details: $(cat /tmp/cron_response.json)"
        fi
        exit 1
        ;;
    000)
        log "❌ Connection failed - Check if the application is running"
        exit 1
        ;;
    *)
        log "❌ Unexpected HTTP status: $HTTP_STATUS"
        if [ -f /tmp/cron_response.json ]; then
            log "Response: $(cat /tmp/cron_response.json)"
        fi
        exit 1
        ;;
esac

# Cleanup
rm -f /tmp/cron_response.json

log "✅ Spotify releases fetch completed successfully"