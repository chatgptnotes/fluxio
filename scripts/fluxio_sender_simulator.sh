#!/bin/sh
# ==============================================================================
# FluxIO Data Sender - Simulator Version
# ==============================================================================
# Reads Modbus data from the simulator and sends to FluxIO API
# This version auto-detects device names from TRB246 Modbus configuration
#
# Installation (Windows PowerShell):
# 1. Copy to TRB246: pscp -pw "Lightyear@123" fluxio_sender_simulator.sh root@192.168.1.2:/root/fluxio_sender.sh
# 2. Make executable: plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "chmod +x /root/fluxio_sender.sh"
# 3. Test manually: plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "/root/fluxio_sender.sh -v"
# 4. Add to cron: plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "echo '* * * * * /root/fluxio_sender.sh' >> /etc/crontabs/root"
# 5. Restart cron: plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "/etc/init.d/cron restart"
#
# Installation (Linux/macOS):
# 1. sshpass -p 'Lightyear@123' scp fluxio_sender_simulator.sh root@192.168.1.2:/root/fluxio_sender.sh
# 2. sshpass -p 'Lightyear@123' ssh root@192.168.1.2 "chmod +x /root/fluxio_sender.sh"
# 3. sshpass -p 'Lightyear@123' ssh root@192.168.1.2 "/root/fluxio_sender.sh -v"
#
# Version: 1.5
# Date: 2026-02-01
# Repository: https://github.com/chatgptnotes/fluxio
# ==============================================================================

# Configuration - Can be overridden by environment variables
API_URL="${FLUXIO_API_URL:-https://www.fluxio.work/api/ingest}"
API_KEY="${FLUXIO_API_KEY:-fluxio_secure_key_2025_production}"
DEVICE_ID="${FLUXIO_DEVICE_ID:-NIVUS_750_001}"

# Alternative API for local testing (uncomment to use local server)
# API_URL="http://192.168.1.100:3000/api/ingest"

# Logging
LOG_TAG="fluxio_sender"

log_info() {
    logger -t "$LOG_TAG" "[INFO] $1"
    [ -n "$VERBOSE" ] && echo "[INFO] $1"
}

log_error() {
    logger -t "$LOG_TAG" "[ERROR] $1"
    [ -n "$VERBOSE" ] && echo "[ERROR] $1" >&2
}

log_debug() {
    [ -n "$DEBUG" ] && logger -t "$LOG_TAG" "[DEBUG] $1"
    [ -n "$DEBUG" ] && echo "[DEBUG] $1"
}

# ==============================================================================
# Auto-detect Modbus device name from UCI config
# ==============================================================================
get_modbus_device_name() {
    # Try to get the first configured device name from UCI
    local device_name=""

    # Method 1: Get from UCI modbus config
    device_name=$(uci show modbus 2>/dev/null | grep "\.name=" | head -n 1 | cut -d"'" -f2)

    if [ -n "$device_name" ]; then
        echo "$device_name"
        return 0
    fi

    # Method 2: List ubus modbus_client devices
    device_name=$(ubus call modbus_client list 2>/dev/null | jsonfilter -e '@.devices[0].name' 2>/dev/null)

    if [ -n "$device_name" ]; then
        echo "$device_name"
        return 0
    fi

    # Method 3: Try common device names
    for name in "Nivus_Simulator" "device_1" "NIVUS_750_001" "Nivus750_Line1"; do
        if ubus call modbus_client get_register "{\"device\":\"$name\",\"register\":\"flow_rate\"}" >/dev/null 2>&1; then
            echo "$name"
            return 0
        fi
    done

    # Default fallback
    echo "device_1"
    return 1
}

# ==============================================================================
# Read Modbus value via ubus
# ==============================================================================
get_modbus_value() {
    local device="$1"
    local register="$2"
    local value=""

    # Try ubus call
    value=$(ubus call modbus_client get_register "{\"device\":\"$device\",\"register\":\"$register\"}" 2>/dev/null | jsonfilter -e '@.value' 2>/dev/null)

    # Return value or 0
    echo "${value:-0}"
}

# ==============================================================================
# Read from Modbus database directly (fallback)
# ==============================================================================
get_modbus_db_value() {
    local device="$1"
    local register="$2"
    local db_path="/tmp/run/modbus_client/modbus.db"

    if [ -f "$db_path" ]; then
        sqlite3 "$db_path" "SELECT data FROM modbus_data WHERE device='$device' AND name='$register' ORDER BY id DESC LIMIT 1;" 2>/dev/null
    else
        echo "0"
    fi
}

# ==============================================================================
# Read raw Modbus TCP directly (last resort fallback)
# ==============================================================================
read_modbus_tcp() {
    local host="$1"
    local port="${2:-502}"
    local slave="${3:-1}"
    local reg="${4:-0}"
    local count="${5:-2}"

    # Use modbus-cli if available, otherwise return 0
    if command -v modbus-cli >/dev/null 2>&1; then
        modbus-cli -h "$host" -p "$port" -s "$slave" -r "$reg" -c "$count" 2>/dev/null
    else
        echo "0"
    fi
}

# ==============================================================================
# Send data to FluxIO API
# ==============================================================================
send_to_api() {
    local json="$1"
    local response=""
    local http_code=""

    log_debug "Sending: $json"

    # Send with curl, -k to skip SSL verification (TRB246 may have old certs)
    response=$(curl -k -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d "$json" 2>&1)

    # Extract HTTP code (last line)
    http_code=$(echo "$response" | tail -n 1)

    log_debug "HTTP Response: $http_code"

    # Check if successful (2xx response)
    case "$http_code" in
        2*)
            log_info "API returned HTTP $http_code (success)"
            return 0
            ;;
        *)
            log_error "API returned HTTP $http_code"
            log_debug "Response body: $(echo "$response" | head -n -1)"
            return 1
            ;;
    esac
}

# ==============================================================================
# Main Execution
# ==============================================================================
main() {
    log_debug "Starting FluxIO data sender"

    # Auto-detect device name
    MODBUS_DEVICE=$(get_modbus_device_name)
    log_debug "Using Modbus device: $MODBUS_DEVICE"

    # Read all register values
    FLOW=$(get_modbus_value "$MODBUS_DEVICE" "flow_rate")
    TOTAL=$(get_modbus_value "$MODBUS_DEVICE" "totalizer")
    TEMP=$(get_modbus_value "$MODBUS_DEVICE" "temperature")
    LEVEL=$(get_modbus_value "$MODBUS_DEVICE" "water_level")
    VEL=$(get_modbus_value "$MODBUS_DEVICE" "velocity")

    # If ubus values are empty, try database
    if [ "$FLOW" = "0" ] && [ "$TOTAL" = "0" ]; then
        log_debug "ubus returned zeros, trying database"
        FLOW=$(get_modbus_db_value "$MODBUS_DEVICE" "flow_rate")
        TOTAL=$(get_modbus_db_value "$MODBUS_DEVICE" "totalizer")
        TEMP=$(get_modbus_db_value "$MODBUS_DEVICE" "temperature")
        LEVEL=$(get_modbus_db_value "$MODBUS_DEVICE" "water_level")
        VEL=$(get_modbus_db_value "$MODBUS_DEVICE" "velocity")
    fi

    # Build JSON payload
    JSON="{\"device_id\":\"$DEVICE_ID\",\"flow_rate\":$FLOW,\"totalizer\":$TOTAL,\"temperature\":$TEMP,\"level\":$LEVEL,\"velocity\":$VEL}"

    # Send to API
    if send_to_api "$JSON"; then
        log_info "Sent $DEVICE_ID: flow=$FLOW total=$TOTAL temp=$TEMP level=$LEVEL vel=$VEL"
    else
        log_error "Failed to send data for $DEVICE_ID"
    fi
}

# Check for verbose/debug mode
case "$1" in
    -v|--verbose)
        VERBOSE=1
        ;;
    -d|--debug)
        DEBUG=1
        VERBOSE=1
        ;;
esac

# Run main function
main
