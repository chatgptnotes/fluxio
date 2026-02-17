#!/bin/bash
#
# TRB246 Configuration Script for FluxIO
# Configures Teltonika TRB246 gateway to poll 6 Nivus 750 transmitters
# and send data to Supabase via HTTP POST
#
# Usage: ./configure-trb246.sh --host <IP> --user <username> --password <password>
#

set -e

# Default values
TRB246_HOST="192.168.1.2"
TRB246_USER="admin"
TRB246_PASSWORD=""
DRY_RUN=false

# FluxIO API configuration (preferred over direct Supabase)
FLUXIO_API_URL="https://www.flownexus.work/api/ingest"
FLUXIO_API_KEY="fluxio_secure_key_2025_production"

# Supabase configuration (backup, if direct API fails)
# NOTE: The built-in data_sender has issues with HTTPS redirects.
# Use the fluxio_sender.sh cron script instead for reliable data sending.
SUPABASE_URL="https://dzmiisuxwruoeklbkyzc.supabase.co/rest/v1/flow_data"
SUPABASE_APIKEY="sb_publishable_ed4UwVUrD7rc2Qlx0Fp8sg_rdm3ctOL"
SUPABASE_SECRET="YOUR_SUPABASE_SERVICE_ROLE_KEY"

# TRB246 Credentials
TRB246_DEFAULT_HOST="192.168.1.2"
TRB246_DEFAULT_USER="root"
# Password should be passed via --password argument

# Polling interval in seconds (5 minutes)
POLL_PERIOD=300

# Device configurations
declare -A DEVICES
DEVICES[1]="NIVUS_750_001|192.168.1.10|Nivus750 Line1"
DEVICES[2]="NIVUS_750_002|192.168.1.11|Nivus750 Line2"
DEVICES[3]="NIVUS_750_003|192.168.1.12|Nivus750 Line3"
DEVICES[4]="NIVUS_750_004|192.168.1.13|Nivus750 Line4"
DEVICES[5]="NIVUS_750_005|192.168.1.14|Nivus750 Line5"
DEVICES[6]="NIVUS_750_006|192.168.1.15|Nivus750 Line6"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --host <IP>         TRB246 IP address (default: 192.168.1.2)"
    echo "  --user <username>   SSH username (default: admin)"
    echo "  --password <pass>   SSH password (required)"
    echo "  --dry-run           Print commands without executing"
    echo "  --help              Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --host 192.168.1.2 --user admin --password 'Lightyear@123'"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            TRB246_HOST="$2"
            shift 2
            ;;
        --user)
            TRB246_USER="$2"
            shift 2
            ;;
        --password)
            TRB246_PASSWORD="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            print_usage
            exit 1
            ;;
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

# Function to execute SSH command
ssh_exec() {
    local cmd="$1"
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY-RUN] $cmd"
    else
        sshpass -p "$TRB246_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$TRB246_USER@$TRB246_HOST" "$cmd" 2>/dev/null
    fi
}

# Generate UCI commands
generate_config() {
    local commands=""

    # Clear existing modbus configuration
    commands+="uci delete modbus 2>/dev/null || true\n"
    commands+="uci set modbus=modbus\n"

    # Configure each Nivus 750 device
    for i in {1..6}; do
        IFS='|' read -r device_id ip_addr name <<< "${DEVICES[$i]}"

        log_info "Configuring device $i: $device_id ($ip_addr)"

        # Device configuration
        commands+="uci set modbus.device_${i}=device\n"
        commands+="uci set modbus.device_${i}.name='${device_id}'\n"
        commands+="uci set modbus.device_${i}.ip='${ip_addr}'\n"
        commands+="uci set modbus.device_${i}.port='502'\n"
        commands+="uci set modbus.device_${i}.slave_id='1'\n"
        commands+="uci set modbus.device_${i}.period='${POLL_PERIOD}'\n"
        commands+="uci set modbus.device_${i}.enabled='1'\n"
        commands+="uci set modbus.device_${i}.timeout='5'\n"

        # Register requests (FC4 Input Registers, Nivus 750)

        # Flow Rate - Register 11 (FC4, 2 registers for Float32)
        commands+="uci set modbus.req_${i}_flow=request\n"
        commands+="uci set modbus.req_${i}_flow.device='device_${i}'\n"
        commands+="uci set modbus.req_${i}_flow.name='flow_rate'\n"
        commands+="uci set modbus.req_${i}_flow.function='4'\n"
        commands+="uci set modbus.req_${i}_flow.first_reg='11'\n"
        commands+="uci set modbus.req_${i}_flow.reg_count='2'\n"
        commands+="uci set modbus.req_${i}_flow.data_type='32bit_float3412'\n"
        commands+="uci set modbus.req_${i}_flow.enabled='1'\n"

        # Totalizer - Register 5201 (FC4)
        commands+="uci set modbus.req_${i}_total=request\n"
        commands+="uci set modbus.req_${i}_total.device='device_${i}'\n"
        commands+="uci set modbus.req_${i}_total.name='totalizer'\n"
        commands+="uci set modbus.req_${i}_total.function='4'\n"
        commands+="uci set modbus.req_${i}_total.first_reg='5201'\n"
        commands+="uci set modbus.req_${i}_total.reg_count='2'\n"
        commands+="uci set modbus.req_${i}_total.data_type='32bit_float3412'\n"
        commands+="uci set modbus.req_${i}_total.enabled='1'\n"

        # Temperature - Register 17 (FC4)
        commands+="uci set modbus.req_${i}_temp=request\n"
        commands+="uci set modbus.req_${i}_temp.device='device_${i}'\n"
        commands+="uci set modbus.req_${i}_temp.name='temperature'\n"
        commands+="uci set modbus.req_${i}_temp.function='4'\n"
        commands+="uci set modbus.req_${i}_temp.first_reg='17'\n"
        commands+="uci set modbus.req_${i}_temp.reg_count='2'\n"
        commands+="uci set modbus.req_${i}_temp.data_type='32bit_float3412'\n"
        commands+="uci set modbus.req_${i}_temp.enabled='1'\n"

        # Water Level - Register 13 (FC4)
        commands+="uci set modbus.req_${i}_level=request\n"
        commands+="uci set modbus.req_${i}_level.device='device_${i}'\n"
        commands+="uci set modbus.req_${i}_level.name='water_level'\n"
        commands+="uci set modbus.req_${i}_level.function='4'\n"
        commands+="uci set modbus.req_${i}_level.first_reg='13'\n"
        commands+="uci set modbus.req_${i}_level.reg_count='2'\n"
        commands+="uci set modbus.req_${i}_level.data_type='32bit_float3412'\n"
        commands+="uci set modbus.req_${i}_level.enabled='1'\n"

        # Velocity - Register 15 (FC4)
        commands+="uci set modbus.req_${i}_vel=request\n"
        commands+="uci set modbus.req_${i}_vel.device='device_${i}'\n"
        commands+="uci set modbus.req_${i}_vel.name='velocity'\n"
        commands+="uci set modbus.req_${i}_vel.function='4'\n"
        commands+="uci set modbus.req_${i}_vel.first_reg='15'\n"
        commands+="uci set modbus.req_${i}_vel.reg_count='2'\n"
        commands+="uci set modbus.req_${i}_vel.data_type='32bit_float3412'\n"
        commands+="uci set modbus.req_${i}_vel.enabled='1'\n"
    done

    # Commit modbus configuration
    commands+="uci commit modbus\n"

    # Configure Data to Server (using FluxIO API)
    # Note: TRB246 built-in data_sender may have issues with HTTPS redirects
    # The fluxio_sender.sh cron script is recommended as an alternative
    log_info "Configuring Data to Server for FluxIO API..."

    commands+="uci delete data_sender 2>/dev/null || true\n"
    commands+="uci set data_sender=data_sender\n"
    commands+="uci set data_sender.sender1=sender\n"
    commands+="uci set data_sender.sender1.name='FluxIO_API'\n"
    commands+="uci set data_sender.sender1.enabled='1'\n"
    commands+="uci set data_sender.sender1.url='${FLUXIO_API_URL}'\n"
    commands+="uci set data_sender.sender1.method='post'\n"
    commands+="uci set data_sender.sender1.period='${POLL_PERIOD}'\n"
    commands+="uci set data_sender.sender1.data_format='custom'\n"
    commands+="uci set data_sender.sender1.content_type='application/json'\n"
    commands+="uci set data_sender.sender1.tls='1'\n"

    # Add headers for FluxIO API authentication
    commands+="uci add_list data_sender.sender1.headers='Content-Type: application/json'\n"
    commands+="uci add_list data_sender.sender1.headers='x-api-key: ${FLUXIO_API_KEY}'\n"

    # Commit data_sender configuration
    commands+="uci commit data_sender\n"

    echo -e "$commands"
}

# Main execution
main() {
    log_info "TRB246 Configuration Script for FluxIO"
    log_info "========================================"
    log_info "Target: $TRB246_USER@$TRB246_HOST"
    log_info "Devices: 6 Nivus 750 transmitters"
    log_info "Poll interval: ${POLL_PERIOD} seconds"
    echo ""

    if [ "$DRY_RUN" = true ]; then
        log_warn "DRY RUN MODE - No changes will be made"
        echo ""
    fi

    # Test SSH connection
    log_info "Testing SSH connection..."
    if [ "$DRY_RUN" = false ]; then
        if ! ssh_exec "echo 'Connection successful'" > /dev/null 2>&1; then
            log_error "Failed to connect to TRB246 at $TRB246_HOST"
            exit 1
        fi
        log_info "SSH connection successful"
    fi

    # Generate and execute configuration commands
    log_info "Generating configuration..."
    config_commands=$(generate_config)

    log_info "Applying configuration to TRB246..."

    # Execute commands line by line
    while IFS= read -r cmd; do
        if [ -n "$cmd" ]; then
            ssh_exec "$cmd"
        fi
    done <<< "$config_commands"

    # Restart services
    log_info "Restarting Modbus service..."
    ssh_exec "/etc/init.d/modbus restart 2>/dev/null || /etc/init.d/modbusmaster restart 2>/dev/null || true"

    log_info "Restarting Data Sender service..."
    ssh_exec "/etc/init.d/data_sender restart 2>/dev/null || true"

    echo ""
    log_info "========================================"
    log_info "Configuration complete!"
    echo ""
    log_info "Verification commands:"
    echo "  SSH into TRB246: sshpass -p '$TRB246_PASSWORD' ssh $TRB246_USER@$TRB246_HOST"
    echo "  View Modbus config: uci show modbus"
    echo "  View Data Sender config: uci show data_sender"
    echo "  Check logs: logread | grep -i modbus"
    echo ""
    log_info "Monitor Supabase flow_data table for incoming data"
    log_info "Expected first data in ~${POLL_PERIOD} seconds"
}

main
