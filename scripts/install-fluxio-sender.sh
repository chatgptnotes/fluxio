#!/bin/bash
# ==============================================================================
# FluxIO Sender Installation Script
# ==============================================================================
# Installs the FluxIO data sender script on TRB246 gateway
#
# Usage:
#   ./install-fluxio-sender.sh --host 192.168.1.2 --password 'Lightyear@123'
#
# What it does:
# 1. Copies fluxio_sender.sh to TRB246
# 2. Makes it executable
# 3. Adds to cron for automatic execution every minute
# 4. Verifies installation
#
# Version: 1.3
# Date: 2026-02-01
# Repository: https://github.com/chatgptnotes/fluxio
# ==============================================================================

set -e

# Default values
TRB246_HOST="192.168.1.2"
TRB246_USER="root"
TRB246_PASSWORD=""
CRON_INTERVAL="* * * * *"  # Every minute
SENDER_SCRIPT="fluxio_sender.sh"
REMOTE_PATH="/root/fluxio_sender.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --host <IP>         TRB246 IP address (default: 192.168.1.2)"
    echo "  --user <username>   SSH username (default: root)"
    echo "  --password <pass>   SSH password (required)"
    echo "  --interval <cron>   Cron interval (default: '* * * * *' = every minute)"
    echo "  --help              Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --host 192.168.1.2 --password 'Lightyear@123'"
    echo ""
    echo "Cron interval examples:"
    echo "  '* * * * *'      - Every minute"
    echo "  '*/5 * * * *'    - Every 5 minutes"
    echo "  '0 * * * *'      - Every hour"
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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
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
        --interval)
            CRON_INTERVAL="$2"
            shift 2
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

# Check for required tools
check_requirements() {
    local missing=0

    if ! command -v sshpass &> /dev/null; then
        log_error "sshpass is required but not installed."
        echo "Install with:"
        echo "  Ubuntu/Debian: sudo apt-get install sshpass"
        echo "  macOS: brew install hudochenkov/sshpass/sshpass"
        missing=1
    fi

    if ! command -v scp &> /dev/null; then
        log_error "scp is required but not installed."
        missing=1
    fi

    if [ $missing -eq 1 ]; then
        exit 1
    fi
}

# SSH command wrapper
ssh_exec() {
    local cmd="$1"
    sshpass -p "$TRB246_PASSWORD" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$TRB246_USER@$TRB246_HOST" "$cmd" 2>/dev/null
}

# SCP wrapper
scp_file() {
    local src="$1"
    local dest="$2"
    sshpass -p "$TRB246_PASSWORD" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$src" "$TRB246_USER@$TRB246_HOST:$dest" 2>/dev/null
}

# Find the sender script
find_sender_script() {
    # Check current directory first
    if [ -f "./$SENDER_SCRIPT" ]; then
        echo "./$SENDER_SCRIPT"
        return 0
    fi

    # Check script directory
    local script_dir="$(dirname "$0")"
    if [ -f "$script_dir/$SENDER_SCRIPT" ]; then
        echo "$script_dir/$SENDER_SCRIPT"
        return 0
    fi

    # Check parent directory's scripts folder
    if [ -f "$script_dir/../scripts/$SENDER_SCRIPT" ]; then
        echo "$script_dir/../scripts/$SENDER_SCRIPT"
        return 0
    fi

    return 1
}

# Main installation
main() {
    echo ""
    echo "========================================"
    echo "  FluxIO Sender Installation"
    echo "========================================"
    echo "Target: $TRB246_USER@$TRB246_HOST"
    echo "Cron interval: $CRON_INTERVAL"
    echo ""

    # Check requirements
    log_step "Checking requirements..."
    check_requirements
    log_info "All requirements met"

    # Find the sender script
    log_step "Locating sender script..."
    local script_path
    if ! script_path=$(find_sender_script); then
        log_error "Cannot find $SENDER_SCRIPT"
        log_error "Please run this script from the fluxio/scripts directory"
        exit 1
    fi
    log_info "Found script at: $script_path"

    # Test SSH connection
    log_step "Testing SSH connection..."
    if ! ssh_exec "echo 'Connection OK'" > /dev/null 2>&1; then
        log_error "Failed to connect to TRB246 at $TRB246_HOST"
        log_error "Please check IP address, username, and password"
        exit 1
    fi
    log_info "SSH connection successful"

    # Copy the script
    log_step "Copying script to TRB246..."
    if ! scp_file "$script_path" "$REMOTE_PATH"; then
        log_error "Failed to copy script to TRB246"
        exit 1
    fi
    log_info "Script copied to $REMOTE_PATH"

    # Make executable
    log_step "Making script executable..."
    ssh_exec "chmod +x $REMOTE_PATH"
    log_info "Script is now executable"

    # Add to cron
    log_step "Configuring cron job..."

    # Remove existing fluxio_sender entries to avoid duplicates
    ssh_exec "sed -i '/fluxio_sender/d' /etc/crontabs/root 2>/dev/null || true"

    # Add new cron entry
    ssh_exec "echo '$CRON_INTERVAL $REMOTE_PATH' >> /etc/crontabs/root"
    log_info "Cron job added: $CRON_INTERVAL $REMOTE_PATH"

    # Restart cron service
    log_step "Restarting cron service..."
    ssh_exec "/etc/init.d/cron restart 2>/dev/null || true"
    log_info "Cron service restarted"

    # Test the script
    log_step "Testing the sender script..."
    local test_output
    test_output=$(ssh_exec "$REMOTE_PATH 2>&1") || true
    log_info "Script executed (check TRB246 logs for details)"

    # Verify installation
    log_step "Verifying installation..."
    local cron_entry
    cron_entry=$(ssh_exec "grep fluxio_sender /etc/crontabs/root")
    if [ -n "$cron_entry" ]; then
        log_info "Cron entry verified: $cron_entry"
    else
        log_warn "Could not verify cron entry"
    fi

    echo ""
    echo "========================================"
    echo "  Installation Complete!"
    echo "========================================"
    echo ""
    log_info "The FluxIO sender will now run automatically"
    echo ""
    echo "Useful commands on TRB246:"
    echo "  View logs:        logread | grep fluxio_sender"
    echo "  Manual run:       $REMOTE_PATH"
    echo "  Debug mode:       DEBUG=1 $REMOTE_PATH"
    echo "  View cron:        cat /etc/crontabs/root"
    echo "  Edit cron:        vi /etc/crontabs/root"
    echo ""
    echo "SSH into TRB246:"
    echo "  sshpass -p '$TRB246_PASSWORD' ssh $TRB246_USER@$TRB246_HOST"
    echo ""
}

# Run main function
main
