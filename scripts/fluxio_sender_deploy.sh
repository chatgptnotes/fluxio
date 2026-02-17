#!/bin/sh
# FluxIO Sender for TRB246 - Sends Modbus data to FlowNexus API
# Reads from modbus_client SQLite DB and POSTs to the cloud API
# Run via cron every minute: * * * * * /root/fluxio_sender.sh

API_URL="https://www.flownexus.work/api/ingest"
API_KEY="flownexus_prod_2026_xkAEdNO5Q8cuS2Khfe3jBQ"
DB="/tmp/run/modbus_client/modbus.db"
LOG_TAG="fluxio"

log() { logger -t "$LOG_TAG" "$1"; }

get_val() {
    local server="$1"
    local reg="$2"
    local val
    val=$(strings "$DB" 2>/dev/null | grep -B2 -A2 "$server" | grep -A1 "$reg" | grep '^\[' | tail -1 | sed 's/\[//g' | cut -d']' -f1 | grep -o '[0-9.-]*' | head -1)
    if [ -z "$val" ]; then
        val=$(strings "$DB" 2>/dev/null | grep -A1 "$reg" | grep '^\[' | tail -1 | sed 's/\[//g' | cut -d']' -f1 | grep -o '[0-9.-]*' | head -1)
    fi
    echo "${val:-0}"
}

send_device() {
    local device_id="$1"
    local server_name="$2"
    local flow=$(get_val "$server_name" "Flow_rate")
    local total=$(get_val "$server_name" "Totalizer")
    local temp=$(get_val "$server_name" "Temperature")
    local level=$(get_val "$server_name" "water_level")
    if [ "$level" = "0" ]; then
        level=$(get_val "$server_name" "Water_Level")
    fi
    if [ "$level" = "0" ]; then
        level=$(get_val "$server_name" "Water_level")
    fi
    local vel=$(get_val "$server_name" "Velocity")
    local json="{\"device_id\":\"$device_id\",\"flow_rate\":$flow,\"totalizer\":$total,\"temperature\":$temp,\"level\":$level,\"velocity\":$vel}"
    local result=$(curl -k -s -w "HTTP:%{http_code}" -X POST "$API_URL" -H "Content-Type: application/json" -H "x-api-key: $API_KEY" -d "$json" 2>&1)
    local http=$(echo "$result" | grep -o "HTTP:[0-9]*" | cut -d: -f2)
    case "$http" in
        2*) log "OK $device_id: flow=$flow total=$total temp=$temp level=$level vel=$vel (HTTP $http)" ;;
        *) log "FAIL $device_id: HTTP $http - $result" ;;
    esac
}

if [ ! -f "$DB" ]; then
    log "ERROR: Modbus database not found at $DB"
    exit 1
fi

send_device "NIVUS_750_001" "Nivus_750_001"
send_device "NIVUS_750_002" "Nivus_750_002"
send_device "NIVUS_750_003" "Nivus_750_003"
send_device "NIVUS_750_004" "Nivus_750_004"
send_device "NIVUS_750_005" "Nivus_750_005"
send_device "NIVUS_750_006" "Nivus_750_006"
log "Completed sending data for all 6 devices"
