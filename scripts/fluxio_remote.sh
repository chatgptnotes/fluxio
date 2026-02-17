#!/bin/sh
# ==============================================================================
# FluxIO Remote Shell Agent for TRB246
# ==============================================================================
# Polls the FluxIO API for pending commands, executes them locally on the
# TRB246 gateway, and posts results back. Designed for OpenWrt (no jq/bash).
#
# Installation:
# 1. Copy to TRB246: pscp fluxio_remote.sh root@<ip>:/root/
# 2. Make executable: chmod +x /root/fluxio_remote.sh
# 3. Start daemon: /root/fluxio_remote.sh &
# 4. For auto-start on boot, install the init.d service (see below).
#
# Version: 1.0
# Date: 2026-02-17
# Repository: https://github.com/chatgptnotes/fluxio
# ==============================================================================

# Configuration
API_BASE="https://www.flownexus.work/api/remote"
API_KEY="flownexus_prod_2026_xkAEdNO5Q8cuS2Khfe3jBQ"
DEVICE_ID="TRB246_001"
POLL_INTERVAL=5
PID_FILE="/var/run/fluxio_remote.pid"
LOG_TAG="fluxio_remote"
MAX_OUTPUT=10240

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
    [ -n "$DEBUG" ] && logger -t "$LOG_TAG" "[DEBUG] $1"
}

# Check if another instance is running
check_pidfile() {
    if [ -f "$PID_FILE" ]; then
        local old_pid
        old_pid=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
            log_error "Another instance is running (PID $old_pid). Exiting."
            exit 1
        fi
        # Stale PID file, remove it
        rm -f "$PID_FILE"
    fi
    echo $$ > "$PID_FILE"
}

cleanup() {
    rm -f "$PID_FILE"
    log_info "Daemon stopped"
    exit 0
}

# Extract a JSON string value using sed/grep (no jq on OpenWrt)
# Usage: json_get_string "$json" "key"
json_get_string() {
    local json="$1"
    local key="$2"
    echo "$json" | sed 's/,/\n/g' | sed 's/[{}]//g' | grep "\"$key\"" | sed "s/.*\"$key\"[[:space:]]*:[[:space:]]*\"//;s/\".*//" | head -n 1
}

# Extract a JSON number value
# Usage: json_get_number "$json" "key"
json_get_number() {
    local json="$1"
    local key="$2"
    echo "$json" | sed 's/,/\n/g' | sed 's/[{}]//g' | grep "\"$key\"" | sed "s/.*\"$key\"[[:space:]]*:[[:space:]]*//" | sed 's/[^0-9.-].*//' | head -n 1
}

# Escape a string for safe JSON inclusion
# Handles backslashes, quotes, newlines, tabs, and control characters
json_escape() {
    printf '%s' "$1" | sed \
        -e 's/\\/\\\\/g' \
        -e 's/"/\\"/g' \
        -e 's/	/\\t/g' \
        -e ':a' -e 'N' -e '$!ba' \
        -e 's/\n/\\n/g'
}

# Truncate string to max bytes
truncate_output() {
    local text="$1"
    local max="$2"
    local len
    len=$(printf '%s' "$text" | wc -c)
    if [ "$len" -gt "$max" ]; then
        printf '%s' "$text" | head -c "$max"
        printf '\n... [output truncated at 10KB]'
    else
        printf '%s' "$text"
    fi
}

# Poll for pending command
poll_command() {
    local response
    response=$(curl -k -s -w "\n%{http_code}" \
        -H "x-api-key: $API_KEY" \
        "$API_BASE/pending?device_id=$DEVICE_ID" 2>/dev/null)

    local http_code
    http_code=$(echo "$response" | tail -n 1)
    local body
    body=$(echo "$response" | sed '$d')

    # Check HTTP status
    case "$http_code" in
        200) ;;
        401)
            log_error "Authentication failed (HTTP 401). Check API key."
            return 1
            ;;
        *)
            log_debug "API returned HTTP $http_code"
            return 1
            ;;
    esac

    # Check if there is a command (null means no pending commands)
    echo "$body" | grep -q '"command":null'
    if [ $? -eq 0 ]; then
        return 1
    fi

    # Check if response contains a command object
    echo "$body" | grep -q '"command":'
    if [ $? -ne 0 ]; then
        return 1
    fi

    # Extract command details from nested "command" object
    # First extract the command object
    local cmd_obj
    cmd_obj=$(echo "$body" | sed 's/.*"command":{//' | sed 's/}[^}]*$//')

    local cmd_id
    cmd_id=$(echo "$cmd_obj" | sed 's/,/\n/g' | grep '"id"' | sed 's/.*"id"[[:space:]]*:[[:space:]]*"//;s/".*//' | head -n 1)
    local cmd_text
    cmd_text=$(echo "$cmd_obj" | sed 's/,/\n/g' | grep '"command"' | sed 's/.*"command"[[:space:]]*:[[:space:]]*"//;s/".*//' | head -n 1)
    local cmd_timeout
    cmd_timeout=$(echo "$cmd_obj" | sed 's/,/\n/g' | grep '"timeout_secs"' | sed 's/.*"timeout_secs"[[:space:]]*:[[:space:]]*//' | sed 's/[^0-9].*//' | head -n 1)

    if [ -z "$cmd_id" ] || [ -z "$cmd_text" ]; then
        log_debug "Could not parse command from response"
        return 1
    fi

    # Default timeout if not parsed
    cmd_timeout=${cmd_timeout:-30}

    log_info "Received command: id=$cmd_id cmd='$cmd_text' timeout=${cmd_timeout}s"

    # Execute the command
    execute_command "$cmd_id" "$cmd_text" "$cmd_timeout"
}

# Execute a command and post the result
execute_command() {
    local cmd_id="$1"
    local cmd_text="$2"
    local cmd_timeout="$3"

    local output
    local exit_code
    local tmp_file="/tmp/fluxio_cmd_$$"

    # Execute with timeout
    if command -v timeout >/dev/null 2>&1; then
        # timeout command available
        timeout "$cmd_timeout" sh -c "$cmd_text" > "$tmp_file" 2>&1
        exit_code=$?
        # Exit code 124 means timeout killed the process
        if [ "$exit_code" -eq 124 ]; then
            echo "Command timed out after ${cmd_timeout}s" >> "$tmp_file"
        fi
    else
        # Manual timeout fallback using background process
        sh -c "$cmd_text" > "$tmp_file" 2>&1 &
        local cmd_pid=$!
        local waited=0
        while [ "$waited" -lt "$cmd_timeout" ]; do
            if ! kill -0 "$cmd_pid" 2>/dev/null; then
                break
            fi
            sleep 1
            waited=$((waited + 1))
        done
        if kill -0 "$cmd_pid" 2>/dev/null; then
            kill -9 "$cmd_pid" 2>/dev/null
            wait "$cmd_pid" 2>/dev/null
            exit_code=124
            echo "Command timed out after ${cmd_timeout}s" >> "$tmp_file"
        else
            wait "$cmd_pid"
            exit_code=$?
        fi
    fi

    # Read and truncate output
    output=$(cat "$tmp_file" 2>/dev/null)
    rm -f "$tmp_file"
    output=$(truncate_output "$output" "$MAX_OUTPUT")

    log_info "Command $cmd_id finished: exit_code=$exit_code output_len=$(printf '%s' "$output" | wc -c)"

    # Post result back
    post_result "$cmd_id" "$exit_code" "$output"
}

# Post command result to API
post_result() {
    local cmd_id="$1"
    local exit_code="$2"
    local output="$3"

    # Escape output for JSON
    local escaped_output
    escaped_output=$(json_escape "$output")

    local error_msg=""
    if [ "$exit_code" -eq 124 ]; then
        error_msg="Command timed out"
    elif [ "$exit_code" -ne 0 ]; then
        error_msg="Command failed with exit code $exit_code"
    fi

    local json="{\"command_id\":\"$cmd_id\",\"exit_code\":$exit_code,\"output\":\"$escaped_output\""
    if [ -n "$error_msg" ]; then
        json="$json,\"error_message\":\"$error_msg\""
    fi
    json="$json}"

    local response
    response=$(curl -k -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d "$json" \
        "$API_BASE/result" 2>/dev/null)

    local http_code
    http_code=$(echo "$response" | tail -n 1)

    case "$http_code" in
        200)
            log_info "Result posted for command $cmd_id"
            ;;
        *)
            log_error "Failed to post result for command $cmd_id (HTTP $http_code)"
            ;;
    esac
}

# ==============================================================================
# Main Loop
# ==============================================================================

main() {
    # Set up signal handlers
    trap cleanup INT TERM

    # Check for duplicate instances
    check_pidfile

    log_info "FluxIO Remote Agent started: device=$DEVICE_ID poll=${POLL_INTERVAL}s"

    while true; do
        poll_command
        sleep "$POLL_INTERVAL"
    done
}

# Run main function
main
