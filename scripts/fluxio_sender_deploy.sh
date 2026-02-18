#!/bin/sh
# FluxIO Sender for TRB246 - Sends Modbus data to FlowNexus API
# Reads from modbus_client SQLite DB via Lua/lsqlite3 and POSTs to the cloud API
# Run via cron every minute: * * * * * /root/fluxio_sender.sh
#
# IMPORTANT: Only sends data when real Modbus values are present.
# If all values are 0 (device unreachable), data is NOT sent,
# so the dashboard will correctly show last known values with a warning.

API_URL="https://www.flownexus.work/api/ingest"
API_KEY="flownexus_prod_2026_xkAEdNO5Q8cuS2Khfe3jBQ"
DB="/tmp/run/modbus_client/modbus.db"
LOG_TAG="fluxio"
TMP_DIR="/tmp/fluxio"

log() { logger -t "$LOG_TAG" "$1"; }

if [ ! -f "$DB" ]; then
    log "ERROR: Modbus database not found at $DB"
    exit 1
fi

mkdir -p "$TMP_DIR"

# Step 1: Use Lua to read all latest values and write JSON files per device
lua -e '
local s = require("lsqlite3")
local db = s.open("'"$DB"'")
if not db then os.exit(1) end

local devs = {}
for row in db:nrows("SELECT server_name, request_name, response_data FROM modbus_data ORDER BY id DESC LIMIT 300") do
  local d = row.server_name
  if not devs[d] then devs[d] = {} end
  local rn = row.request_name:lower()
  if not devs[d][rn] then
    local v = row.response_data:match("%[([%d%.%-]+)%]")
    if v then devs[d][rn] = v end
  end
end
db:close()

local device_map = {
  ["Nivus_750_001"] = "NIVUS_750_001",
  ["Nivus_750_002"] = "NIVUS_750_002",
  ["Nivus_750_003"] = "NIVUS_750_003",
  ["Nivus_750_004"] = "NIVUS_750_004",
  ["Nivus_750_005"] = "NIVUS_750_005",
  ["Nivus_750_006"] = "NIVUS_750_006",
}

for server_name, device_id in pairs(device_map) do
  local regs = devs[server_name]
  if regs then
    local flow = regs["flow_rate"] or "0"
    local total = regs["totalizer"] or "0"
    local temp = regs["temperature"] or "0"
    local level = regs["water_level"] or "0"
    local vel = regs["velocity"] or "0"

    if flow == "0" and total == "0" and temp == "0" and level == "0" and vel == "0" then
      -- All zeros: skip this device
      local f = io.open("'"$TMP_DIR"'/" .. device_id .. ".skip", "w")
      if f then f:write("skip"); f:close() end
    else
      -- Write JSON payload to temp file
      local json = string.format(
        "{\"device_id\":\"%s\",\"flow_rate\":%s,\"totalizer\":%s,\"temperature\":%s,\"level\":%s,\"velocity\":%s}",
        device_id, flow, total, temp, level, vel
      )
      local f = io.open("'"$TMP_DIR"'/" .. device_id .. ".json", "w")
      if f then f:write(json); f:close() end
    end
  end
end
'

# Step 2: Send each JSON file via curl
for json_file in "$TMP_DIR"/NIVUS_750_*.json; do
    [ -f "$json_file" ] || continue
    device_id=$(basename "$json_file" .json)

    result=$(curl -k -s -w "\nHTTP:%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -H "x-api-key: $API_KEY" \
        -d @"$json_file" 2>&1)

    http=$(echo "$result" | grep "HTTP:" | cut -d: -f2)
    payload=$(cat "$json_file")

    case "$http" in
        2*) log "OK $device_id: $payload (HTTP $http)" ;;
        *) log "FAIL $device_id: HTTP $http" ;;
    esac

    rm -f "$json_file"
done

# Step 3: Log skipped devices
for skip_file in "$TMP_DIR"/NIVUS_750_*.skip; do
    [ -f "$skip_file" ] || continue
    device_id=$(basename "$skip_file" .skip)
    log "SKIP $device_id: all values zero, device may be offline"
    rm -f "$skip_file"
done

# Step 4: Watchdog - ensure remote agent is running
if [ -f /root/fluxio_remote.sh ]; then
    REMOTE_PID=$(cat /var/run/fluxio_remote.pid 2>/dev/null)
    if [ -z "$REMOTE_PID" ] || ! kill -0 "$REMOTE_PID" 2>/dev/null; then
        log "WATCHDOG: Remote agent not running, restarting..."
        # Kill any orphaned instances
        killall -q fluxio_remote.sh 2>/dev/null
        rm -f /var/run/fluxio_remote.pid
        # Start fresh (nohup + background so it survives cron exit)
        nohup /root/fluxio_remote.sh >/dev/null 2>&1 &
        sleep 1
        if kill -0 $! 2>/dev/null; then
            log "WATCHDOG: Remote agent restarted (PID $!)"
        else
            log "WATCHDOG: Failed to restart remote agent"
        fi
    fi
fi

log "Completed data collection cycle"
