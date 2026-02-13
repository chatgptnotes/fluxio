#!/bin/sh
# ==============================================================================
# FluxIO Sender - Direct Database Read Version
# ==============================================================================
# Reads Modbus values directly from TRB246's modbus_client database
# This is the most reliable method when ubus interface is not available
#
# Installation:
# 1. Copy to TRB246: pscp fluxio_sender_db.sh root@192.168.1.2:/root/fluxio_sender.sh
# 2. Make executable: plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "chmod +x /root/fluxio_sender.sh"
# 3. Test: plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "/root/fluxio_sender.sh"
# 4. Add to cron: plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "echo '* * * * * /root/fluxio_sender.sh' >> /etc/crontabs/root && /etc/init.d/cron restart"
#
# Version: 1.9
# Date: 2026-02-01
# Repository: https://github.com/chatgptnotes/fluxio
# ==============================================================================

# Configuration - Update these values as needed
API_URL="https://www.flownexus.work/api/ingest"
API_KEY="fluxio_secure_key_2025_production"
DEVICE_ID="NIVUS_750_001"

# TRB246 Modbus database location
DB="/tmp/run/modbus_client/modbus.db"

# Alternative database paths to check
DB_PATHS="/tmp/run/modbus_client/modbus.db /var/run/modbus_client/modbus.db /tmp/modbus.db"

# Logging
LOG_TAG="fluxio"

log_info() {
    logger -t "$LOG_TAG" "[INFO] $1"
    [ -n "$VERBOSE" ] && echo "[INFO] $1"
}

log_error() {
    logger -t "$LOG_TAG" "[ERROR] $1"
    [ -n "$VERBOSE" ] && echo "[ERROR] $1"
}

log_debug() {
    [ -n "$DEBUG" ] && logger -t "$LOG_TAG" "[DEBUG] $1"
    [ -n "$DEBUG" ] && echo "[DEBUG] $1"
}

# Find the modbus database
find_db() {
    for path in $DB_PATHS; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done
    return 1
}

# Extract float value from database using strings
# The database stores values in format: register_name \n [value]suffix
# e.g., Flow_rate \n [94.225075]31L
extract_value() {
    local db="$1"
    local register="$2"
    local value=""

    # Method 1: strings with grep - handles both formats
    # Look for the register name and get the value on the next line
    value=$(strings "$db" 2>/dev/null | grep -i -A1 "$register" | grep '^\[' | tail -1 | sed 's/\[//g' | cut -d']' -f1 | grep -o '[0-9.-]*' | head -1)

    if [ -n "$value" ]; then
        echo "$value"
        return 0
    fi

    # Method 2: Try without brackets format
    value=$(strings "$db" 2>/dev/null | grep -i -A1 "$register" | tail -1 | grep -o '[0-9.-]*' | head -1)

    if [ -n "$value" ]; then
        echo "$value"
        return 0
    fi

    # Return 0 if nothing found
    echo "0"
}

# Extract all values from SQLite if available
extract_sqlite() {
    local db="$1"

    if command -v sqlite3 >/dev/null 2>&1; then
        # Try SQLite queries
        FLOW=$(sqlite3 "$db" "SELECT data FROM modbus_data WHERE name LIKE '%flow%' ORDER BY id DESC LIMIT 1;" 2>/dev/null)
        TOTAL=$(sqlite3 "$db" "SELECT data FROM modbus_data WHERE name LIKE '%total%' ORDER BY id DESC LIMIT 1;" 2>/dev/null)
        TEMP=$(sqlite3 "$db" "SELECT data FROM modbus_data WHERE name LIKE '%temp%' ORDER BY id DESC LIMIT 1;" 2>/dev/null)
        LEVEL=$(sqlite3 "$db" "SELECT data FROM modbus_data WHERE name LIKE '%level%' ORDER BY id DESC LIMIT 1;" 2>/dev/null)
        VEL=$(sqlite3 "$db" "SELECT data FROM modbus_data WHERE name LIKE '%veloc%' ORDER BY id DESC LIMIT 1;" 2>/dev/null)
        return 0
    fi
    return 1
}

# Main execution
main() {
    log_debug "Starting FluxIO data sender (DB version)"

    # Find database
    DB=$(find_db)
    if [ -z "$DB" ]; then
        log_error "Modbus database not found. Checked: $DB_PATHS"
        exit 1
    fi
    log_debug "Using database: $DB"

    # Try SQLite first, then fall back to strings extraction
    if ! extract_sqlite "$DB"; then
        log_debug "SQLite not available, using strings extraction"

        # Extract values using strings command
        FLOW=$(extract_value "$DB" "flow_rate")
        [ "$FLOW" = "0" ] && FLOW=$(extract_value "$DB" "Flow_rate")

        TOTAL=$(extract_value "$DB" "totalizer")
        [ "$TOTAL" = "0" ] && TOTAL=$(extract_value "$DB" "Totalizer")

        TEMP=$(extract_value "$DB" "temperature")
        [ "$TEMP" = "0" ] && TEMP=$(extract_value "$DB" "Temperature")

        LEVEL=$(extract_value "$DB" "water_level")
        [ "$LEVEL" = "0" ] && LEVEL=$(extract_value "$DB" "level")

        VEL=$(extract_value "$DB" "velocity")
        [ "$VEL" = "0" ] && VEL=$(extract_value "$DB" "Velocity")
    fi

    # Default to 0 if empty
    FLOW=${FLOW:-0}
    TOTAL=${TOTAL:-0}
    TEMP=${TEMP:-0}
    LEVEL=${LEVEL:-0}
    VEL=${VEL:-0}

    log_debug "Values: flow=$FLOW total=$TOTAL temp=$TEMP level=$LEVEL vel=$VEL"

    # Build JSON payload
    JSON="{\"device_id\":\"$DEVICE_ID\",\"flow_rate\":$FLOW,\"totalizer\":$TOTAL,\"temperature\":$TEMP,\"level\":$LEVEL,\"velocity\":$VEL}"

    log_debug "JSON: $JSON"

    # Send to API (-k skips SSL verification for TRB246 compatibility)
    RESULT=$(curl -k -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d "$JSON" 2>&1)

    # Extract HTTP code
    HTTP_CODE=$(echo "$RESULT" | grep "HTTP_CODE:" | cut -d':' -f2)
    BODY=$(echo "$RESULT" | grep -v "HTTP_CODE:")

    # Log result
    case "$HTTP_CODE" in
        2*)
            log_info "Sent $DEVICE_ID: flow=$FLOW total=$TOTAL temp=$TEMP (HTTP $HTTP_CODE)"
            ;;
        *)
            log_error "Failed to send data (HTTP $HTTP_CODE): $BODY"
            ;;
    esac
}

# Handle command line arguments
case "$1" in
    -v|--verbose)
        VERBOSE=1
        ;;
    -d|--debug)
        DEBUG=1
        VERBOSE=1
        ;;
    -h|--help)
        echo "FluxIO Sender - Database Read Version"
        echo "Usage: $0 [-v|--verbose] [-d|--debug]"
        echo ""
        echo "Options:"
        echo "  -v, --verbose   Show info messages"
        echo "  -d, --debug     Show debug messages"
        echo "  -h, --help      Show this help"
        exit 0
        ;;
esac

# Run main
main
