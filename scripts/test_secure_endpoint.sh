#!/bin/bash

# Test script for the secure HTTP endpoint approach
# This helps verify the setup before adding to cron

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_SCRIPT="$SCRIPT_DIR/fetch_spotify_releases_secure.sh"
API_ENDPOINT="http://localhost:3333/cron"

echo "🧪 Testing Secure Spotify Releases HTTP Endpoint"
echo "================================================"
echo "Script location: $MAIN_SCRIPT"
echo "API endpoint: $API_ENDPOINT"
echo "Test started at: $(date)"
echo ""

# Check if main script exists
if [ ! -f "$MAIN_SCRIPT" ]; then
    echo "❌ ERROR: Main script not found at $MAIN_SCRIPT"
    exit 1
fi

# Make script executable if needed
if [ ! -x "$MAIN_SCRIPT" ]; then
    echo "🔧 Making script executable..."
    chmod +x "$MAIN_SCRIPT"
fi

# Check if API key is set
if [ -z "$CRON_API_KEY" ]; then
    echo "⚠️  WARNING: CRON_API_KEY environment variable not set"
    echo "   Generate one with: openssl rand -hex 32"
    echo "   Then export it: export CRON_API_KEY=your_generated_key"
    echo ""
fi

# Test 1: Health check (no auth required)
echo "🏥 Test 1: Health Check Endpoint"
echo "--------------------------------"
HEALTH_STATUS=$(curl -w "%{http_code}" -s -o /tmp/health_response.json "$API_ENDPOINT/health" 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Health check passed (HTTP $HEALTH_STATUS)"
    if command -v jq >/dev/null 2>&1; then
        echo "   Response: $(jq -c . /tmp/health_response.json 2>/dev/null)"
    else
        echo "   Response: $(cat /tmp/health_response.json)"
    fi
else
    echo "❌ Health check failed (HTTP $HEALTH_STATUS)"
    echo "   Make sure the application is running on port 3333"
    if [ -f /tmp/health_response.json ]; then
        echo "   Response: $(cat /tmp/health_response.json)"
    fi
fi

rm -f /tmp/health_response.json
echo ""

# Test 2: API Key validation (if set)
if [ -n "$CRON_API_KEY" ]; then
    echo "🔐 Test 2: API Key Authentication"
    echo "--------------------------------"
    
    # Test with correct API key
    AUTH_STATUS=$(curl -w "%{http_code}" -s -o /tmp/auth_response.json \
        -X POST \
        -H "X-API-Key: $CRON_API_KEY" \
        "$API_ENDPOINT/spotify-releases" 2>/dev/null || echo "000")
    
    case $AUTH_STATUS in
        200)
            echo "✅ Authentication successful (HTTP $AUTH_STATUS)"
            if command -v jq >/dev/null 2>&1; then
                STATS=$(jq -r '.stats | "Processed: \(.processed), New releases: \(.newReleases), Errors: \(.errors)"' /tmp/auth_response.json 2>/dev/null || echo "Could not parse stats")
                echo "   $STATS"
            fi
            ;;
        401)
            echo "❌ Authentication failed (HTTP $AUTH_STATUS) - API key might be wrong"
            ;;
        403)
            echo "❌ Access forbidden (HTTP $AUTH_STATUS) - IP not in whitelist"
            ;;
        500)
            echo "⚠️  Server error (HTTP $AUTH_STATUS) - Check application configuration"
            ;;
        000)
            echo "❌ Connection failed - Application might not be running"
            ;;
        *)
            echo "⚠️  Unexpected response (HTTP $AUTH_STATUS)"
            ;;
    esac
    
    if [ -f /tmp/auth_response.json ]; then
        echo "   Full response available in /tmp/auth_response.json"
    fi
    
    echo ""
    
    # Test with wrong API key
    echo "🚫 Test 3: Invalid API Key (should fail)"
    echo "----------------------------------------"
    INVALID_STATUS=$(curl -w "%{http_code}" -s -o /dev/null \
        -X POST \
        -H "X-API-Key: invalid_key_12345" \
        "$API_ENDPOINT/spotify-releases" 2>/dev/null || echo "000")
    
    if [ "$INVALID_STATUS" = "401" ]; then
        echo "✅ Invalid API key correctly rejected (HTTP $INVALID_STATUS)"
    else
        echo "⚠️  Unexpected response for invalid key (HTTP $INVALID_STATUS)"
    fi
    
    echo ""
else
    echo "⏭️  Skipping API key tests (CRON_API_KEY not set)"
    echo ""
fi

# Test 3: Run the actual script
echo "🚀 Test 4: Full Script Execution"
echo "--------------------------------"
if [ -n "$CRON_API_KEY" ]; then
    echo "Running the main script..."
    "$MAIN_SCRIPT"
    SCRIPT_EXIT_CODE=$?
    
    if [ $SCRIPT_EXIT_CODE -eq 0 ]; then
        echo "✅ Script executed successfully"
    else
        echo "❌ Script failed with exit code: $SCRIPT_EXIT_CODE"
    fi
else
    echo "⏭️  Skipping script test (CRON_API_KEY required)"
fi

echo ""
echo "🏁 Test Summary"
echo "==============="
echo "Test completed at: $(date)"

if [ "$HEALTH_STATUS" = "200" ] && [ -n "$CRON_API_KEY" ] && [ "$AUTH_STATUS" = "200" ] && [ "$INVALID_STATUS" = "401" ]; then
    echo "✅ All tests passed! The secure endpoint is ready for production."
    echo ""
    echo "Next steps:"
    echo "1. Add to crontab: 0 6 * * * CRON_API_KEY=$CRON_API_KEY $MAIN_SCRIPT"
    echo "2. Monitor logs: tail -f $HOME/spotify_releases_cron.log"
elif [ "$HEALTH_STATUS" = "200" ] && [ -z "$CRON_API_KEY" ]; then
    echo "⚠️  Setup incomplete: Set CRON_API_KEY environment variable"
    echo "   Generate with: openssl rand -hex 32"
else
    echo "❌ Some tests failed. Check the application configuration and try again."
fi

# Cleanup
rm -f /tmp/auth_response.json /tmp/health_response.json