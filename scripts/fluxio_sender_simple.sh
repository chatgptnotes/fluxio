#!/bin/sh
# ==============================================================================
# FluxIO Data Sender - Simple Version
# ==============================================================================
# Lightweight script for sending single device data to FluxIO API
# Use this for testing or single-device deployments
#
# Version: 1.3
# Date: 2026-02-01
# Repository: https://github.com/chatgptnotes/fluxio
# ==============================================================================

# Configuration
API_URL="https://www.flownexus.work/api/ingest"
API_KEY="fluxio_secure_key_2025_production"
DEVICE_ID="NIVUS_750_001"
MODBUS_DEVICE="device_1"

# Read Modbus values using modbus_client ubus interface
get_value() {
    local reg="$1"
    local val
    val=$(ubus call modbus_client get_register "{\"device\":\"$MODBUS_DEVICE\",\"register\":\"$reg\"}" 2>/dev/null | jsonfilter -e '@.value')
    echo "${val:-0}"
}

# Get all values
FLOW=$(get_value "flow_rate")
TOTAL=$(get_value "totalizer")
TEMP=$(get_value "temperature")
LEVEL=$(get_value "water_level")
VEL=$(get_value "velocity")

# Build JSON payload
JSON="{\"device_id\":\"$DEVICE_ID\",\"flow_rate\":$FLOW,\"totalizer\":$TOTAL,\"temperature\":$TEMP,\"level\":$LEVEL,\"velocity\":$VEL}"

# Send to API
RESULT=$(curl -k -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "$JSON" 2>&1)

# Log the result
logger -t fluxio "Sent: flow=$FLOW total=$TOTAL temp=$TEMP level=$LEVEL vel=$VEL"
logger -t fluxio "Result: $RESULT"
