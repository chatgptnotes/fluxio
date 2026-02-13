#!/bin/sh
# ==============================================================================
# FluxIO Sender - All 6 Devices
# ==============================================================================
# Reads Modbus data from all 6 Nivus 750 transmitters and sends to FluxIO API
#
# Device Configuration:
#   NIVUS_750_001 -> 192.168.1.10 (Pipe_1)
#   NIVUS_750_002 -> 192.168.1.11 (Pipe_2)
#   NIVUS_750_003 -> 192.168.1.12 (Pipe_3)
#   NIVUS_750_004 -> 192.168.1.13 (Pipe_4)
#   NIVUS_750_005 -> 192.168.1.14 (Pipe_5)
#   NIVUS_750_006 -> 192.168.1.15 (Pipe_6)
#
# Version: 1.0
# Date: 2026-02-01
# ==============================================================================

API_URL="https://www.flownexus.work/api/ingest"
API_KEY="fluxio_secure_key_2025_production"
DB="/tmp/run/modbus_client/modbus.db"
LOG_TAG="fluxio"

log() { logger -t "$LOG_TAG" "$1"; }

# Extract value from database for a specific device
get_val() {
    local device="$1"
    local reg="$2"
    local val
    # Try to find device-specific value in database
    val=$(strings "$DB" 2>/dev/null | grep -i -A1 "${device}.*${reg}\|${reg}.*${device}" | grep "^\[" | tail -1 | sed "s/\[//g" | cut -d"]" -f1 | grep -o "[0-9.-]*" | head -1)
    # If not found, try generic register name
    if [ -z "$val" ]; then
        val=$(strings "$DB" 2>/dev/null | grep -i -A1 "$reg" | grep "^\[" | tail -1 | sed "s/\[//g" | cut -d"]" -f1 | grep -o "[0-9.-]*" | head -1)
    fi
    echo "${val:-0}"
}

# Send data for a single device
send_device() {
    local device_id="$1"
    local device_num="$2"

    # Get values (try device-specific first, then fall back to generic)
    local flow=$(get_val "device_${device_num}" "flow_rate")
    local total=$(get_val "device_${device_num}" "totalizer")
    local temp=$(get_val "device_${device_num}" "temperature")
    local level=$(get_val "device_${device_num}" "water_level")
    local vel=$(get_val "device_${device_num}" "velocity")

    # Build JSON
    local json="{\"device_id\":\"$device_id\",\"flow_rate\":$flow,\"totalizer\":$total,\"temperature\":$temp,\"level\":$level,\"velocity\":$vel}"

    # Send to API
    local result=$(curl -k -s -w "HTTP:%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d "$json" 2>&1)

    local http=$(echo "$result" | grep -o "HTTP:[0-9]*" | cut -d: -f2)

    case "$http" in
        2*) log "OK $device_id: flow=$flow total=$total temp=$temp (HTTP $http)" ;;
        *) log "FAIL $device_id: HTTP $http" ;;
    esac
}

# Check database exists
if [ ! -f "$DB" ]; then
    log "ERROR: Modbus database not found at $DB"
    exit 1
fi

# Send data for all 6 devices
send_device "NIVUS_750_001" "1"
send_device "NIVUS_750_002" "2"
send_device "NIVUS_750_003" "3"
send_device "NIVUS_750_004" "4"
send_device "NIVUS_750_005" "5"
send_device "NIVUS_750_006" "6"

log "Completed sending data for all 6 devices"
