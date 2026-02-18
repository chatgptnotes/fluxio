#!/bin/sh
# ==============================================================================
# FluxIO Remote Shell Agent for TRB246
# ==============================================================================
# Polls the FluxIO API for pending commands, executes them locally on the
# TRB246 gateway, and posts results back. Uses Lua for reliable JSON handling
# on BusyBox/OpenWrt (no jq/bash required).
#
# Installation:
# 1. Copy to TRB246: pscp fluxio_remote.sh root@<ip>:/root/
# 2. Make executable: chmod +x /root/fluxio_remote.sh
# 3. Start daemon: /root/fluxio_remote.sh &
# 4. For auto-start on boot, install the init.d service (see below).
#
# Version: 2.0
# Date: 2026-02-18
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
TMP_DIR="/tmp/fluxio_remote"

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

check_pidfile() {
    if [ -f "$PID_FILE" ]; then
        local old_pid
        old_pid=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
            log_error "Another instance is running (PID $old_pid). Exiting."
            exit 1
        fi
        rm -f "$PID_FILE"
    fi
    echo $$ > "$PID_FILE"
}

cleanup() {
    rm -f "$PID_FILE"
    rm -rf "$TMP_DIR"
    log_info "Daemon stopped"
    exit 0
}

# ==============================================================================
# Lua helper: Parse API response JSON, extract command fields, write to files
# Input: reads API JSON response from stdin
# Output: writes id, command, timeout_secs to separate files in TMP_DIR
# Exit 0 if command found, exit 1 if no command or null
# ==============================================================================
parse_response() {
    lua -e '
local tmp = "'"$TMP_DIR"'"
local raw = io.read("*a")
if not raw or raw == "" then os.exit(1) end

-- Check for null command
if raw:match("\"command\"%s*:%s*null") then os.exit(1) end

-- Find the command object: {"command":{...}}
local obj = raw:match("\"command\"%s*:%s*(%b{})")
if not obj then os.exit(1) end

-- Extract id (UUID, no special chars)
local id = obj:match("\"id\"%s*:%s*\"([^\"]+)\"")
if not id then os.exit(1) end

-- Extract timeout_secs (number)
local timeout = obj:match("\"timeout_secs\"%s*:%s*(%d+)")
timeout = timeout or "30"

-- Extract command string: find "command":" then read until unescaped quote
-- This handles escaped quotes inside the command value
local cmd
local start = obj:find("\"command\"%s*:%s*\"")
if start then
    local val_start = obj:find("\"", obj:find(":", start) + 1) + 1
    local i = val_start
    while i <= #obj do
        local c = obj:sub(i, i)
        if c == "\\" then
            i = i + 2
        elseif c == "\"" then
            cmd = obj:sub(val_start, i - 1)
            break
        else
            i = i + 1
        end
    end
end

if not cmd or cmd == "" then os.exit(1) end

-- Unescape JSON string escapes (single pass with function)
cmd = cmd:gsub("\\(.)", function(c)
    if c == "n" then return "\n"
    elseif c == "t" then return "\t"
    elseif c == "\\" then return "\\"
    elseif c == "\"" then return "\""
    elseif c == "/" then return "/"
    else return "\\" .. c
    end
end)

local f
f = io.open(tmp .. "/cmd_id", "w"); f:write(id); f:close()
f = io.open(tmp .. "/cmd_text", "w"); f:write(cmd); f:close()
f = io.open(tmp .. "/cmd_timeout", "w"); f:write(timeout); f:close()
os.exit(0)
'
}

# ==============================================================================
# Lua helper: Build result JSON from files and post via curl
# Reads output from file, properly escapes for JSON, writes JSON to file
# ==============================================================================
build_result_json() {
    local cmd_id="$1"
    local exit_code="$2"
    local output_file="$3"
    local json_file="$4"
    local error_msg="$5"

    lua -e '
local cmd_id = "'"$cmd_id"'"
local exit_code = '"$exit_code"'
local error_msg = "'"$error_msg"'"
local max_output = '"$MAX_OUTPUT"'

-- Read output from file
local f = io.open("'"$output_file"'", "r")
local output = ""
if f then output = f:read("*a") or ""; f:close() end

-- Truncate if needed
if #output > max_output then
    output = output:sub(1, max_output) .. "\n... [output truncated at 10KB]"
end

-- JSON escape function
local function json_esc(s)
    s = s:gsub("\\", "\\\\")
    s = s:gsub("\"", "\\\"")
    s = s:gsub("\n", "\\n")
    s = s:gsub("\r", "\\r")
    s = s:gsub("\t", "\\t")
    -- Remove other control chars
    s = s:gsub("[%c]", "")
    return s
end

local json = string.format(
    "{\"command_id\":\"%s\",\"exit_code\":%d,\"output\":\"%s\"",
    cmd_id, exit_code, json_esc(output)
)

if error_msg ~= "" then
    json = json .. string.format(",\"error_message\":\"%s\"", json_esc(error_msg))
end
json = json .. "}"

f = io.open("'"$json_file"'", "w")
if f then f:write(json); f:close() end
'
}

# Poll for pending command
poll_command() {
    mkdir -p "$TMP_DIR"
    rm -f "$TMP_DIR"/cmd_*

    local response
    response=$(curl -k -s -w "\n%{http_code}" \
        -H "x-api-key: $API_KEY" \
        "$API_BASE/pending?device_id=$DEVICE_ID" 2>/dev/null)

    local http_code
    http_code=$(echo "$response" | tail -n 1)
    local body
    body=$(echo "$response" | sed '$d')

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

    # Use Lua to parse the JSON response
    echo "$body" | parse_response
    if [ $? -ne 0 ]; then
        return 1
    fi

    # Read parsed values from files
    local cmd_id cmd_text cmd_timeout
    cmd_id=$(cat "$TMP_DIR/cmd_id" 2>/dev/null)
    cmd_text=$(cat "$TMP_DIR/cmd_text" 2>/dev/null)
    cmd_timeout=$(cat "$TMP_DIR/cmd_timeout" 2>/dev/null)
    cmd_timeout=${cmd_timeout:-30}

    if [ -z "$cmd_id" ] || [ -z "$cmd_text" ]; then
        log_debug "Could not parse command from response"
        return 1
    fi

    log_info "Received command: id=$cmd_id timeout=${cmd_timeout}s"

    # Execute the command
    execute_command "$cmd_id" "$cmd_text" "$cmd_timeout"
}

# Execute a command and post the result
execute_command() {
    local cmd_id="$1"
    local cmd_text="$2"
    local cmd_timeout="$3"
    local exit_code
    local output_file="$TMP_DIR/cmd_output"

    # Read command from file to preserve all special characters
    if command -v timeout >/dev/null 2>&1; then
        timeout "$cmd_timeout" sh -c "$cmd_text" > "$output_file" 2>&1
        exit_code=$?
        if [ "$exit_code" -eq 124 ]; then
            echo "Command timed out after ${cmd_timeout}s" >> "$output_file"
        fi
    else
        sh -c "$cmd_text" > "$output_file" 2>&1 &
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
            echo "Command timed out after ${cmd_timeout}s" >> "$output_file"
        else
            wait "$cmd_pid"
            exit_code=$?
        fi
    fi

    local output_len
    output_len=$(wc -c < "$output_file" 2>/dev/null)
    log_info "Command $cmd_id finished: exit_code=$exit_code output_len=${output_len:-0}"

    # Post result back
    post_result "$cmd_id" "$exit_code" "$output_file"
}

# Post command result to API
post_result() {
    local cmd_id="$1"
    local exit_code="$2"
    local output_file="$3"
    local json_file="$TMP_DIR/result.json"

    local error_msg=""
    if [ "$exit_code" -eq 124 ]; then
        error_msg="Command timed out"
    elif [ "$exit_code" -ne 0 ]; then
        error_msg="Command failed with exit code $exit_code"
    fi

    # Use Lua to build properly escaped JSON
    build_result_json "$cmd_id" "$exit_code" "$output_file" "$json_file" "$error_msg"

    if [ ! -f "$json_file" ]; then
        log_error "Failed to build result JSON for command $cmd_id"
        return 1
    fi

    local response
    response=$(curl -k -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d @"$json_file" \
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

    rm -f "$json_file" "$output_file"
}

# ==============================================================================
# Main Loop
# ==============================================================================

main() {
    trap cleanup INT TERM
    check_pidfile
    mkdir -p "$TMP_DIR"

    log_info "FluxIO Remote Agent v2.0 started: device=$DEVICE_ID poll=${POLL_INTERVAL}s"

    while true; do
        poll_command
        sleep "$POLL_INTERVAL"
    done
}

main
