<#
.SYNOPSIS
    TRB246 Complete Setup Script for FluxIO (Windows PowerShell version)

.DESCRIPTION
    Performs complete setup for TRB246 gateway:
    1. Configures Modbus TCP Master devices (6 Nivus 750 transmitters)
    2. Configures register mappings for flow_rate, totalizer, temperature, level, velocity
    3. Installs the FluxIO sender script for reliable data transmission
    4. Sets up cron job for automatic data sending

.PARAMETER Host
    TRB246 IP address (default: 192.168.1.2)

.PARAMETER User
    SSH username (default: root)

.PARAMETER Password
    SSH password (required)

.PARAMETER DryRun
    Print commands without executing

.PARAMETER SkipModbus
    Skip Modbus configuration

.PARAMETER SkipSender
    Skip sender script installation

.EXAMPLE
    .\setup-trb246-complete.ps1 -Password 'Lightyear@123'

.EXAMPLE
    .\setup-trb246-complete.ps1 -Host 192.168.1.2 -Password 'Lightyear@123' -DryRun

.NOTES
    Requires Plink and PSCP (PuTTY tools) to be installed and in PATH.
    Version: 1.0
    Date: 2026-02-01
    Repository: https://github.com/chatgptnotes/fluxio
#>

param(
    [string]$HostIP = "192.168.1.2",
    [string]$User = "root",
    [Parameter(Mandatory=$true)]
    [string]$Password,
    [switch]$DryRun,
    [switch]$SkipModbus,
    [switch]$SkipSender
)

# FluxIO API configuration
$FluxioApiUrl = "https://www.flownexus.work/api/ingest"
$FluxioApiKey = "fluxio_secure_key_2025_production"

# Polling interval in seconds (5 minutes)
$PollPeriod = 300

# Device configurations
$Devices = @(
    @{ Index = 1; DeviceId = "NIVUS_750_001"; IP = "192.168.1.10"; Name = "Nivus750_Line1" },
    @{ Index = 2; DeviceId = "NIVUS_750_002"; IP = "192.168.1.11"; Name = "Nivus750_Line2" },
    @{ Index = 3; DeviceId = "NIVUS_750_003"; IP = "192.168.1.12"; Name = "Nivus750_Line3" },
    @{ Index = 4; DeviceId = "NIVUS_750_004"; IP = "192.168.1.13"; Name = "Nivus750_Line4" },
    @{ Index = 5; DeviceId = "NIVUS_750_005"; IP = "192.168.1.14"; Name = "Nivus750_Line5" },
    @{ Index = 6; DeviceId = "NIVUS_750_006"; IP = "192.168.1.15"; Name = "Nivus750_Line6" }
)

function Write-Info { param([string]$Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Err { param([string]$Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }
function Write-Step { param([string]$Message) Write-Host "[STEP] $Message" -ForegroundColor Blue }

function Invoke-SSH {
    param([string]$Command)
    if ($DryRun) {
        Write-Host "[DRY-RUN] $Command" -ForegroundColor Cyan
        return ""
    }
    $result = & plink -ssh -l $User -pw $Password -batch $HostIP $Command 2>&1
    return $result
}

function Send-File {
    param([string]$Content, [string]$RemotePath)
    if ($DryRun) {
        Write-Host "[DRY-RUN] Would copy content to $RemotePath" -ForegroundColor Cyan
        return
    }
    # Write content to temp file with Unix line endings, then copy
    $tempFile = [System.IO.Path]::GetTempFileName()
    # Use UTF8 without BOM and Unix line endings (LF only)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    $unixContent = $Content -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($tempFile, $unixContent, $utf8NoBom)

    $copyResult = & pscp -pw $Password -batch $tempFile "${User}@${HostIP}:${RemotePath}" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to copy file: $copyResult"
    }
    Remove-Item $tempFile -ErrorAction SilentlyContinue
}

function Configure-Modbus {
    Write-Step "Configuring Modbus TCP Master devices..."

    # Clear existing configuration
    Invoke-SSH "uci delete modbus 2>/dev/null || true" | Out-Null
    Invoke-SSH "uci set modbus=modbus" | Out-Null

    foreach ($device in $Devices) {
        $i = $device.Index
        $deviceId = $device.DeviceId
        $ip = $device.IP

        Write-Info "Configuring device $i`: $deviceId ($ip)"

        # Device configuration
        Invoke-SSH "uci set modbus.device_$i=device" | Out-Null
        Invoke-SSH "uci set modbus.device_$i.name='$deviceId'" | Out-Null
        Invoke-SSH "uci set modbus.device_$i.ip='$ip'" | Out-Null
        Invoke-SSH "uci set modbus.device_$i.port='502'" | Out-Null
        Invoke-SSH "uci set modbus.device_$i.slave_id='1'" | Out-Null
        Invoke-SSH "uci set modbus.device_$i.period='$PollPeriod'" | Out-Null
        Invoke-SSH "uci set modbus.device_$i.enabled='1'" | Out-Null
        Invoke-SSH "uci set modbus.device_$i.timeout='5'" | Out-Null

        # Register requests (FC4 Input Registers, Nivus 750)
        # Flow Rate - Register 11 (FC4)
        Invoke-SSH "uci set modbus.req_${i}_flow=request" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_flow.device='device_$i'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_flow.name='flow_rate'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_flow.function='4'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_flow.first_reg='11'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_flow.reg_count='2'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_flow.data_type='32bit_float3412'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_flow.enabled='1'" | Out-Null

        # Totalizer - Register 5201 (FC4)
        Invoke-SSH "uci set modbus.req_${i}_total=request" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_total.device='device_$i'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_total.name='totalizer'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_total.function='4'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_total.first_reg='5201'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_total.reg_count='2'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_total.data_type='32bit_float3412'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_total.enabled='1'" | Out-Null

        # Temperature - Register 17 (FC4)
        Invoke-SSH "uci set modbus.req_${i}_temp=request" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_temp.device='device_$i'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_temp.name='temperature'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_temp.function='4'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_temp.first_reg='17'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_temp.reg_count='2'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_temp.data_type='32bit_float3412'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_temp.enabled='1'" | Out-Null

        # Water Level - Register 13 (FC4)
        Invoke-SSH "uci set modbus.req_${i}_level=request" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_level.device='device_$i'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_level.name='water_level'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_level.function='4'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_level.first_reg='13'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_level.reg_count='2'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_level.data_type='32bit_float3412'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_level.enabled='1'" | Out-Null

        # Velocity - Register 15 (FC4)
        Invoke-SSH "uci set modbus.req_${i}_vel=request" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_vel.device='device_$i'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_vel.name='velocity'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_vel.function='4'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_vel.first_reg='15'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_vel.reg_count='2'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_vel.data_type='32bit_float3412'" | Out-Null
        Invoke-SSH "uci set modbus.req_${i}_vel.enabled='1'" | Out-Null
    }

    # Commit and restart
    Invoke-SSH "uci commit modbus" | Out-Null
    Invoke-SSH "/etc/init.d/modbus restart 2>/dev/null || /etc/init.d/modbusmaster restart 2>/dev/null || true" | Out-Null

    Write-Info "Modbus configuration complete"
}

function Install-Sender {
    Write-Step "Installing FluxIO sender script..."

    # Create the sender script content using single quotes to avoid escaping issues
    $SenderScript = @'
#!/bin/sh
# FluxIO Sender for TRB246 - Auto-generated
# Version: 1.1
# Sends Modbus data to FluxIO API every minute via cron

API_URL="https://www.flownexus.work/api/ingest"
API_KEY="fluxio_secure_key_2025_production"
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
'@

    # Copy script to TRB246
    Send-File $SenderScript "/root/fluxio_sender.sh"

    # Make executable
    Invoke-SSH "chmod +x /root/fluxio_sender.sh" | Out-Null

    # Configure cron
    Write-Step "Configuring cron job..."
    Invoke-SSH "sed -i '/fluxio_sender/d' /etc/crontabs/root 2>/dev/null || true" | Out-Null
    Invoke-SSH "echo '* * * * * /root/fluxio_sender.sh' >> /etc/crontabs/root" | Out-Null
    Invoke-SSH "/etc/init.d/cron restart 2>/dev/null || true" | Out-Null

    Write-Info "Sender script installed and cron configured"
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  TRB246 Complete Setup for FluxIO" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Target: $User@$HostIP"
    Write-Host "API: $FluxioApiUrl"
    Write-Host ""

    if ($DryRun) {
        Write-Warn "DRY RUN MODE - No changes will be made"
        Write-Host ""
    }

    # Check for required tools
    Write-Step "Checking requirements..."
    $missing = @()
    if (-not (Get-Command plink -ErrorAction SilentlyContinue)) { $missing += "plink" }
    if (-not (Get-Command pscp -ErrorAction SilentlyContinue)) { $missing += "pscp" }

    if ($missing.Count -gt 0) {
        Write-Err "Missing required tools: $($missing -join ', ')"
        Write-Host "Install PuTTY tools from: https://www.putty.org/"
        Write-Host "Or via chocolatey: choco install putty.install"
        exit 1
    }
    Write-Info "All requirements met"

    # Test SSH connection
    Write-Step "Testing SSH connection..."
    if (-not $DryRun) {
        $testResult = Invoke-SSH "echo 'OK'"
        if ($testResult -notmatch "OK") {
            Write-Err "Failed to connect to TRB246 at $HostIP"
            Write-Host "Please check IP address, username, and password"
            exit 1
        }
    }
    Write-Info "SSH connection successful"

    # Configure Modbus if not skipped
    if (-not $SkipModbus) {
        Configure-Modbus
    } else {
        Write-Warn "Skipping Modbus configuration (-SkipModbus)"
    }

    # Install sender if not skipped
    if (-not $SkipSender) {
        Install-Sender
    } else {
        Write-Warn "Skipping sender installation (-SkipSender)"
    }

    # Run test
    Write-Step "Testing sender script..."
    if (-not $DryRun) {
        $testOutput = Invoke-SSH "/root/fluxio_sender.sh"
        Write-Host "  $testOutput"
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Info "FluxIO sender will run automatically every minute"
    Write-Host ""
    Write-Host "Verification commands:" -ForegroundColor Yellow
    Write-Host "  View Modbus config:  uci show modbus"
    Write-Host "  View logs:           logread | grep fluxio"
    Write-Host "  Manual test:         /root/fluxio_sender.sh"
    Write-Host "  View cron:           cat /etc/crontabs/root"
    Write-Host ""
    Write-Host "SSH into TRB246:" -ForegroundColor Yellow
    Write-Host "  plink -ssh -l $User -pw `"$Password`" $HostIP"
    Write-Host ""
    Write-Host "Monitor FluxIO dashboard:" -ForegroundColor Yellow
    Write-Host "  https://www.flownexus.work"
    Write-Host ""

    # Version footer
    Write-Host "v1.0 | 2026-02-01 | github.com/chatgptnotes/fluxio" -ForegroundColor DarkGray
}

# Run main function
Main
