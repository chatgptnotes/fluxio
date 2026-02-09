#!/bin/sh
# ==============================================================================
# FluxIO Data Sender Script for TRB246
# ==============================================================================
# This script reads Modbus data from Nivus 750 transmitters and sends to FluxIO API
#
# Features:
# - Supports multiple devices (6 Nivus 750 transmitters)
# - Reads from Modbus client database or ubus interface
# - Sends data via HTTPS POST to FluxIO API
# - Logs all activity for debugging
# - Handles connection failures gracefully
#
# Installation:
# 1. Copy to TRB246: scp fluxio_sender.sh root@192.168.1.2:/root/
# 2. Make executable: chmod +x /root/fluxio_sender.sh
# 3. Add to cron: echo "* * * * * /root/fluxio_sender.sh" >> /etc/crontabs/root
# 4. Restart cron: /etc/init.d/cron restart
#
# Version: 1.3
# Date: 2026-02-01
# Repository: https://github.com/chatgptnotes/fluxio
# ==============================================================================

# Configuration
API_URL="https://www.fluxio.work/api/ingest"
API_KEY="fluxio_secure_key_2025_production"

# Device configurations (ID|IP|Modbus_Device_Name)
# Modbus_Device_Name should match the name configured in TRB246 Modbus TCP Client
DEVICES="
NIVUS_750_001|192.168.1.10|device_1
NIVUS_750_002|192.168.1.11|device_2
NIVUS_750_003|192.168.1.12|device_3
NIVUS_750_004|192.168.1.13|device_4
NIVUS_750_005|192.168.1.14|device_5
NIVUS_750_006|192.168.1.15|device_6
"

# Modbus database path (TRB246 stores values here)
MODBUS_DB="/tmp/run/modbus_client/modbus.db"

# Logging
LOG_TAG="fluxio_sender"

# ==============================================================================
# Functions
# ==============================================================================

log_info() {
    logger -t "$LOG_TAG" "[INFO] $1"
}

log_error() {
    logger -t "$LOG_TAG" "[ERROR] $1"
}

log_debug() {
    # Only log debug if DEBUG env var is set
    [ -n "$DEBUG" ] && logger -t "$LOG_TAG" "[DEBUG] $1"
}

# Get Modbus value using ubus interface
# Args: $1=device_name, $2=register_name
get_modbus_ubus() {
    local device="$1"
    local register="$2"
    local result

    result=$(ubus call modbus_client get_register "{\"device\":\"$device\",\"register\":\"$register\"}" 2>/dev/null)

    if [ -n "$result" ]; then
        echo "$result" | jsonfilter -e '@.value' 2>/dev/null
    fi
}

# Get Modbus value from SQLite database
# Args: $1=device_name, $2=register_name
get_modbus_db() {
    local device="$1"
    local register="$2"

    if [ -f "$MODBUS_DB" ]; then
        sqlite3 "$MODBUS_DB" "SELECT data FROM modbus_data WHERE device='$device' AND name='$register' ORDER BY id DESC LIMIT 1;" 2>/dev/null
    fi
}

# Get Modbus value (tries multiple methods)
# Args: $1=device_name, $2=register_name
get_modbus_value() {
    local device="$1"
    local register="$2"
    local value

    # Try ubus first (faster, real-time)
    value=$(get_modbus_ubus "$device" "$register")

    # Fallback to database
    if [ -z "$value" ]; then
        value=$(get_modbus_db "$device" "$register")
    fi

    # Return value or 0 as default
    echo "${value:-0}"
}

# Send data to FluxIO API
# Args: $1=JSON payload
send_to_api() {
    local json="$1"
    local response
    local http_code

    # Send with curl, capture response and HTTP code
    response=$(curl -k -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d "$json" 2>/dev/null)

    # Extract HTTP code (last line)
    http_code=$(echo "$response" | tail -n 1)

    # Check if successful (2xx response)
    case "$http_code" in
        2*)
            return 0
            ;;
        *)
            log_error "API returned HTTP $http_code"
            return 1
            ;;
    esac
}

# Process a single device
# Args: $1=device_id, $2=ip_address, $3=modbus_device_name
process_device() {
    local device_id="$1"
    local ip_addr="$2"
    local modbus_name="$3"

    log_debug "Processing device: $device_id ($ip_addr)"

    # Read all register values
    local flow_rate=$(get_modbus_value "$modbus_name" "flow_rate")
    local totalizer=$(get_modbus_value "$modbus_name" "totalizer")
    local temperature=$(get_modbus_value "$modbus_name" "temperature")
    local water_level=$(get_modbus_value "$modbus_name" "water_level")
    local velocity=$(get_modbus_value "$modbus_name" "velocity")

    # Skip if all values are 0 (device might be offline)
    if [ "$flow_rate" = "0" ] && [ "$totalizer" = "0" ] && [ "$temperature" = "0" ]; then
        log_debug "Device $device_id: all values are 0, checking connectivity"

        # Ping check to see if device is reachable
        if ! ping -c 1 -W 1 "$ip_addr" > /dev/null 2>&1; then
            log_error "Device $device_id ($ip_addr) is unreachable"
            return 1
        fi
    fi

    # Build JSON payload
    local json="{\"device_id\":\"$device_id\",\"flow_rate\":$flow_rate,\"totalizer\":$totalizer,\"temperature\":$temperature,\"level\":$water_level,\"velocity\":$velocity}"

    # Send to API
    if send_to_api "$json"; then
        log_info "Sent $device_id: flow=$flow_rate total=$totalizer temp=$temperature level=$water_level vel=$velocity"
        return 0
    else
        log_error "Failed to send data for $device_id"
        return 1
    fi
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    local success_count=0
    local fail_count=0

    log_debug "Starting FluxIO data collection cycle"

    # Check network connectivity to API
    if ! ping -c 1 -W 2 www.fluxio.work > /dev/null 2>&1; then
        # Try DNS resolution
        if ! nslookup www.fluxio.work > /dev/null 2>&1; then
            log_error "Cannot resolve API hostname, check network/DNS"
            exit 1
        fi
    fi

    # Process each device
    echo "$DEVICES" | while IFS='|' read -r device_id ip_addr modbus_name; do
        # Skip empty lines
        [ -z "$device_id" ] && continue

        # Trim whitespace
        device_id=$(echo "$device_id" | tr -d ' \t\n\r')
        ip_addr=$(echo "$ip_addr" | tr -d ' \t\n\r')
        modbus_name=$(echo "$modbus_name" | tr -d ' \t\n\r')

        if process_device "$device_id" "$ip_addr" "$modbus_name"; then
            success_count=$((success_count + 1))
        else
            fail_count=$((fail_count + 1))
        fi
    done

    log_debug "Cycle complete: $success_count success, $fail_count failed"
}

# Run main function
main
