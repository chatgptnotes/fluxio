#!/bin/bash
# ==============================================================================
# TRB246 Complete Setup Script for FluxIO
# ==============================================================================
# This script performs the complete setup for TRB246 gateway:
# 1. Configures Modbus TCP Master devices (6 Nivus 750 transmitters)
# 2. Configures register mappings for flow_rate, totalizer, temperature, level, velocity
# 3. Installs the FluxIO sender script for reliable data transmission
# 4. Sets up cron job for automatic data sending
#
# Usage:
#   ./setup-trb246-complete.sh --password 'Lightyear@123'
#   ./setup-trb246-complete.sh --host 192.168.1.2 --password 'Lightyear@123' --dry-run
#
# Requirements:
#   - sshpass (Linux/macOS)
#   - SSH access to TRB246
#
# Version: 1.0
# Date: 2026-02-01
# Repository: https://github.com/chatgptnotes/fluxio
# ==============================================================================

set -e

# Default values
TRB246_HOST="192.168.1.2"
TRB246_USER="root"
TRB246_PASSWORD=""
DRY_RUN=false
SKIP_MODBUS=false
SKIP_SENDER=false

# FluxIO API configuration
FLUXIO_API_URL="https://www.flownexus.work/api/ingest"
FLUXIO_API_KEY="fluxio_secure_key_2025_production"

# Polling interval in seconds (5 minutes)
POLL_PERIOD=300

# Device configurations (ID|IP|Name)
DEVICES="
1|NIVUS_750_001|192.168.1.10|Nivus750_Line1
2|NIVUS_750_002|192.168.1.11|Nivus750_Line2
3|NIVUS_750_003|192.168.1.12|Nivus750_Line3
4|NIVUS_750_004|192.168.1.13|Nivus750_Line4
5|NIVUS_750_005|192.168.1.14|Nivus750_Line5
6|NIVUS_750_006|192.168.1.15|Nivus750_Line6
"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --host <IP>         TRB246 IP address (default: 192.168.1.2)"
    echo "  --user <username>   SSH username (default: root)"
    echo "  --password <pass>   SSH password (required)"
    echo "  --dry-run           Print commands without executing"
    echo "  --skip-modbus       Skip Modbus configuration"
    echo "  --skip-sender       Skip sender script installation"
    echo "  --help              Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --password 'Lightyear@123'"
}

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host) TRB246_HOST="$2"; shift 2 ;;
        --user) TRB246_USER="$2"; shift 2 ;;
        --password) TRB246_PASSWORD="$2"; shift 2 ;;
        --dry-run) DRY_RUN=true; shift ;;
        --skip-modbus) SKIP_MODBUS=true; shift ;;
        --skip-sender) SKIP_SENDER=true; shift ;;
        --help) print_usage; exit 0 ;;
        *) log_error "Unknown option: $1"; print_usage; exit 1 ;;
    esac
done

# Validate required parameters
if [ -z "$TRB246_PASSWORD" ]; then
    log_error "Password is required"
    print_usage
    exit 1
fi

# Check for sshpass
if ! command -v sshpass &> /dev/null; then
    log_error "sshpass is required but not installed."
    echo "Install with:"
    echo "  Ubuntu/Debian: sudo apt-get install sshpass"
    echo "  macOS: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

# SSH command wrapper
ssh_exec() {
    local cmd="$1"
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY-RUN] $cmd"
    else
        sshpass -p "$TRB246_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$TRB246_USER@$TRB246_HOST" "$cmd" 2>/dev/null
    fi
}

# SCP wrapper
scp_file() {
    local content="$1"
    local dest="$2"
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY-RUN] Would copy content to $dest"
    else
        echo "$content" | sshpass -p "$TRB246_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$TRB246_USER@$TRB246_HOST" "cat > $dest" 2>/dev/null
    fi
}

# Configure Modbus devices
configure_modbus() {
    log_step "Configuring Modbus TCP Master devices..."

    # Clear existing configuration
    ssh_exec "uci delete modbus 2>/dev/null || true"
    ssh_exec "uci set modbus=modbus"

    # Configure each device
    echo "$DEVICES" | while IFS='|' read -r idx device_id ip_addr name; do
        [ -z "$idx" ] && continue

        log_info "Configuring device $idx: $device_id ($ip_addr)"

        # Device configuration
        ssh_exec "uci set modbus.device_${idx}=device"
        ssh_exec "uci set modbus.device_${idx}.name='${device_id}'"
        ssh_exec "uci set modbus.device_${idx}.ip='${ip_addr}'"
        ssh_exec "uci set modbus.device_${idx}.port='502'"
        ssh_exec "uci set modbus.device_${idx}.slave_id='1'"
        ssh_exec "uci set modbus.device_${idx}.period='${POLL_PERIOD}'"
        ssh_exec "uci set modbus.device_${idx}.enabled='1'"
        ssh_exec "uci set modbus.device_${idx}.timeout='5'"

        # Register requests (1-based addressing for TRB246)
        # Flow Rate - Register 1
        ssh_exec "uci set modbus.req_${idx}_flow=request"
        ssh_exec "uci set modbus.req_${idx}_flow.device='device_${idx}'"
        ssh_exec "uci set modbus.req_${idx}_flow.name='flow_rate'"
        ssh_exec "uci set modbus.req_${idx}_flow.function='3'"
        ssh_exec "uci set modbus.req_${idx}_flow.first_reg='1'"
        ssh_exec "uci set modbus.req_${idx}_flow.reg_count='2'"
        ssh_exec "uci set modbus.req_${idx}_flow.data_type='32bit_float_cdab'"
        ssh_exec "uci set modbus.req_${idx}_flow.enabled='1'"

        # Totalizer - Register 3
        ssh_exec "uci set modbus.req_${idx}_total=request"
        ssh_exec "uci set modbus.req_${idx}_total.device='device_${idx}'"
        ssh_exec "uci set modbus.req_${idx}_total.name='totalizer'"
        ssh_exec "uci set modbus.req_${idx}_total.function='3'"
        ssh_exec "uci set modbus.req_${idx}_total.first_reg='3'"
        ssh_exec "uci set modbus.req_${idx}_total.reg_count='2'"
        ssh_exec "uci set modbus.req_${idx}_total.data_type='32bit_float_cdab'"
        ssh_exec "uci set modbus.req_${idx}_total.enabled='1'"

        # Temperature - Register 5
        ssh_exec "uci set modbus.req_${idx}_temp=request"
        ssh_exec "uci set modbus.req_${idx}_temp.device='device_${idx}'"
        ssh_exec "uci set modbus.req_${idx}_temp.name='temperature'"
        ssh_exec "uci set modbus.req_${idx}_temp.function='3'"
        ssh_exec "uci set modbus.req_${idx}_temp.first_reg='5'"
        ssh_exec "uci set modbus.req_${idx}_temp.reg_count='2'"
        ssh_exec "uci set modbus.req_${idx}_temp.data_type='32bit_float_cdab'"
        ssh_exec "uci set modbus.req_${idx}_temp.enabled='1'"

        # Water Level - Register 7
        ssh_exec "uci set modbus.req_${idx}_level=request"
        ssh_exec "uci set modbus.req_${idx}_level.device='device_${idx}'"
        ssh_exec "uci set modbus.req_${idx}_level.name='water_level'"
        ssh_exec "uci set modbus.req_${idx}_level.function='3'"
        ssh_exec "uci set modbus.req_${idx}_level.first_reg='7'"
        ssh_exec "uci set modbus.req_${idx}_level.reg_count='2'"
        ssh_exec "uci set modbus.req_${idx}_level.data_type='32bit_float_cdab'"
        ssh_exec "uci set modbus.req_${idx}_level.enabled='1'"

        # Velocity - Register 9
        ssh_exec "uci set modbus.req_${idx}_vel=request"
        ssh_exec "uci set modbus.req_${idx}_vel.device='device_${idx}'"
        ssh_exec "uci set modbus.req_${idx}_vel.name='velocity'"
        ssh_exec "uci set modbus.req_${idx}_vel.function='3'"
        ssh_exec "uci set modbus.req_${idx}_vel.first_reg='9'"
        ssh_exec "uci set modbus.req_${idx}_vel.reg_count='2'"
        ssh_exec "uci set modbus.req_${idx}_vel.data_type='32bit_float_cdab'"
        ssh_exec "uci set modbus.req_${idx}_vel.enabled='1'"
    done

    # Commit and restart
    ssh_exec "uci commit modbus"
    ssh_exec "/etc/init.d/modbus restart 2>/dev/null || /etc/init.d/modbusmaster restart 2>/dev/null || true"

    log_info "Modbus configuration complete"
}

# Install sender script
install_sender() {
    log_step "Installing FluxIO sender script..."

    # Create the sender script content
    SENDER_SCRIPT='#!/bin/sh
# FluxIO Sender for TRB246 - Auto-generated
# Version: 1.0
# Sends Modbus data to FluxIO API every minute via cron

API_URL="'"$FLUXIO_API_URL"'"
API_KEY="'"$FLUXIO_API_KEY"'"
DEVICE_ID="NIVUS_750_001"
DB="/tmp/run/modbus_client/modbus.db"
LOG_TAG="fluxio"

log() { logger -t "$LOG_TAG" "$1"; }

# Extract value from database
get_val() {
    local reg="$1"
    local val
    val=$(strings "$DB" 2>/dev/null | grep -i -A1 "$reg" | grep "^\[" | tail -1 | sed "s/\[//g" | cut -d"]" -f1 | grep -o "[0-9.-]*" | head -1)
    echo "${val:-0}"
}

# Check if database exists
if [ ! -f "$DB" ]; then
    log "ERROR: Modbus database not found at $DB"
    exit 1
fi

# Get values
FLOW=$(get_val "flow_rate")
TOTAL=$(get_val "totalizer")
TEMP=$(get_val "temperature")
LEVEL=$(get_val "water_level")
VEL=$(get_val "velocity")

# Build JSON
JSON="{\"device_id\":\"$DEVICE_ID\",\"flow_rate\":$FLOW,\"totalizer\":$TOTAL,\"temperature\":$TEMP,\"level\":$LEVEL,\"velocity\":$VEL}"

# Send to API
RESULT=$(curl -k -s -w "HTTP:%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -d "$JSON" 2>&1)

HTTP=$(echo "$RESULT" | grep -o "HTTP:[0-9]*" | cut -d: -f2)

case "$HTTP" in
    2*) log "OK: flow=$FLOW total=$TOTAL temp=$TEMP (HTTP $HTTP)" ;;
    *) log "FAIL: HTTP $HTTP - $RESULT" ;;
esac
'

    # Copy script to TRB246
    scp_file "$SENDER_SCRIPT" "/root/fluxio_sender.sh"

    # Make executable
    ssh_exec "chmod +x /root/fluxio_sender.sh"

    # Configure cron
    log_step "Configuring cron job..."
    ssh_exec "sed -i '/fluxio_sender/d' /etc/crontabs/root 2>/dev/null || true"
    ssh_exec "echo '* * * * * /root/fluxio_sender.sh' >> /etc/crontabs/root"
    ssh_exec "/etc/init.d/cron restart 2>/dev/null || true"

    log_info "Sender script installed and cron configured"
}

# Main execution
main() {
    echo ""
    echo "========================================"
    echo "  TRB246 Complete Setup for FluxIO"
    echo "========================================"
    echo "Target: $TRB246_USER@$TRB246_HOST"
    echo "API: $FLUXIO_API_URL"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log_warn "DRY RUN MODE - No changes will be made"
        echo ""
    fi

    # Test SSH connection
    log_step "Testing SSH connection..."
    if [ "$DRY_RUN" = false ]; then
        if ! ssh_exec "echo 'OK'" > /dev/null 2>&1; then
            log_error "Failed to connect to TRB246 at $TRB246_HOST"
            exit 1
        fi
    fi
    log_info "SSH connection successful"

    # Configure Modbus if not skipped
    if [ "$SKIP_MODBUS" = false ]; then
        configure_modbus
    else
        log_warn "Skipping Modbus configuration (--skip-modbus)"
    fi

    # Install sender if not skipped
    if [ "$SKIP_SENDER" = false ]; then
        install_sender
    else
        log_warn "Skipping sender installation (--skip-sender)"
    fi

    # Run test
    log_step "Testing sender script..."
    if [ "$DRY_RUN" = false ]; then
        ssh_exec "/root/fluxio_sender.sh" || true
    fi

    echo ""
    echo "========================================"
    echo "  Setup Complete!"
    echo "========================================"
    echo ""
    log_info "FluxIO sender will run automatically every minute"
    echo ""
    echo "Verification commands:"
    echo "  View Modbus config:  uci show modbus"
    echo "  View logs:           logread | grep fluxio"
    echo "  Manual test:         /root/fluxio_sender.sh"
    echo "  View cron:           cat /etc/crontabs/root"
    echo ""
    echo "SSH into TRB246:"
    echo "  sshpass -p '$TRB246_PASSWORD' ssh $TRB246_USER@$TRB246_HOST"
    echo ""
    echo "Monitor FluxIO dashboard:"
    echo "  https://www.flownexus.work"
    echo ""
}

main
