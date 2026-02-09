#!/bin/bash

# TBR 246 Gateway - Supabase Direct Insert Test Script
# Run this script to verify your Supabase connection works

# ============================================
# CONFIGURATION - Update these values
# ============================================

SUPABASE_URL="https://aynoltymgusyasgxshng.supabase.co"
SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
DEVICE_ID="NIVUS_750_01"

# ============================================
# DO NOT MODIFY BELOW THIS LINE
# ============================================

echo "TBR 246 Gateway - Supabase Insert Test"
echo "======================================="
echo ""

# Check if placeholder values are still present (modify these if you need to use different credentials)
if echo "$SUPABASE_URL" | grep -q "xxxxx"; then
    echo "ERROR: Please update SUPABASE_URL with your project URL"
    exit 1
fi

if [ "$SERVICE_ROLE_KEY" = "your_service_role_key_here" ]; then
    echo "ERROR: Please update SERVICE_ROLE_KEY with your service_role key"
    exit 1
fi

# Build the API endpoint
ENDPOINT="${SUPABASE_URL}/rest/v1/flow_data"

echo "Testing connection to: $ENDPOINT"
echo ""

# Generate random test values
FLOW_RATE=$(awk -v min=10 -v max=50 'BEGIN{srand(); printf "%.2f", min+rand()*(max-min)}')
TOTALIZER=$(awk -v min=10000 -v max=20000 'BEGIN{srand(); printf "%.2f", min+rand()*(max-min)}')
TEMPERATURE=$(awk -v min=15 -v max=30 'BEGIN{srand(); printf "%.1f", min+rand()*(max-min)}')
SIGNAL_STRENGTH=$(awk -v min=-80 -v max=-50 'BEGIN{srand(); printf "%d", min+rand()*(max-min)}')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Build test payload
PAYLOAD=$(cat <<EOF
{
  "device_id": "${DEVICE_ID}",
  "flow_rate": ${FLOW_RATE},
  "totalizer": ${TOTALIZER},
  "temperature": ${TEMPERATURE},
  "signal_strength": ${SIGNAL_STRENGTH},
  "metadata": {
    "gateway_imei": "TEST_SCRIPT",
    "source": "bash_test",
    "test_timestamp": "${TIMESTAMP}"
  }
}
EOF
)

echo "Sending test data:"
echo "$PAYLOAD"
echo ""

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$PAYLOAD")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract body (everything except last line)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""

if [ "$HTTP_CODE" = "201" ]; then
    echo "SUCCESS! Data inserted successfully (HTTP 201)"
    echo ""
    echo "Inserted record:"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo "Next steps:"
    echo "1. Check Supabase Table Editor > flow_data to see the record"
    echo "2. Configure your TBR 246 gateway with the same URL and headers"
    echo "3. Open FluxIO dashboard to verify data display"
else
    echo "FAILED! HTTP Status: $HTTP_CODE"
    echo ""

    case $HTTP_CODE in
        401)
            echo "Authentication Error (401 Unauthorized)"
            echo "- Check that you're using the service_role key (not anon key)"
            echo "- Verify the key has no extra spaces or characters"
            ;;
        404)
            echo "Not Found Error (404)"
            echo "- Check that the URL is correct"
            echo "- Verify the flow_data table exists in Supabase"
            ;;
        409)
            echo "Conflict Error (409)"
            echo "- The device_id '${DEVICE_ID}' may not exist in the devices table"
            echo "- Run the setup-tbr246-device.sql script first"
            ;;
        400)
            echo "Bad Request Error (400)"
            echo "- Check the JSON format"
            echo "- Verify column names match the table schema"
            ;;
        *)
            echo "Unexpected error occurred"
            ;;
    esac

    if [ -n "$BODY" ]; then
        echo ""
        echo "Error details: $BODY"
    fi
fi

echo ""
echo "======================================="
