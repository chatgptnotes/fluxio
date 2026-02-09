<#
.SYNOPSIS
    TRB246 Diagnostic Script for FluxIO

.DESCRIPTION
    Diagnoses TRB246 Modbus and Data Sender configuration.
    Helps identify why data isn't being sent to FluxIO API.

.PARAMETER Host
    TRB246 IP address (default: 192.168.1.2)

.PARAMETER User
    SSH username (default: root)

.PARAMETER Password
    SSH password (required)

.EXAMPLE
    .\diagnose-trb246.ps1 -Password 'Lightyear@123'

.NOTES
    Requires Plink (PuTTY CLI) to be installed and in PATH.
    Version: 1.4
    Date: 2026-02-01
    Repository: https://github.com/chatgptnotes/fluxio
#>

param(
    [string]$HostIP = "192.168.1.2",
    [string]$User = "root",
    [Parameter(Mandatory=$true)]
    [string]$Password
)

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Invoke-SSH {
    param([string]$Command)
    $result = & plink -ssh -l $User -pw $Password -batch $HostIP $Command 2>&1
    return $result
}

# Check for Plink
if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
    Write-Err "Plink (PuTTY CLI) is required but not found in PATH."
    Write-Host "Download from: https://www.putty.org/"
    Write-Host "Or install via: choco install putty.install"
    exit 1
}

Write-Section "TRB246 DIAGNOSTIC REPORT"
Write-Host "Target: $User@$HostIP"
Write-Host "Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Test SSH connection
Write-Section "1. SSH CONNECTION TEST"
$testResult = Invoke-SSH "echo 'OK'"
if ($testResult -match "OK") {
    Write-Info "SSH connection successful"
} else {
    Write-Err "SSH connection failed: $testResult"
    exit 1
}

# Check system info
Write-Section "2. SYSTEM INFORMATION"
$firmware = Invoke-SSH "cat /etc/version 2>/dev/null || uname -a"
Write-Info "Firmware/System: $firmware"

# Check Modbus configuration
Write-Section "3. MODBUS CONFIGURATION"
Write-Host ""
Write-Host "Configured Modbus Devices:" -ForegroundColor Yellow
$modbusConfig = Invoke-SSH "uci show modbus 2>/dev/null | grep -E '\.(name|ip|port|enabled)='"
if ($modbusConfig) {
    $modbusConfig | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Warn "No Modbus devices configured"
}

# Check Modbus service status
Write-Section "4. MODBUS SERVICE STATUS"
$modbusService = Invoke-SSH "ps | grep -i modbus | grep -v grep"
if ($modbusService) {
    Write-Info "Modbus service is running:"
    $modbusService | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Warn "Modbus service may not be running"
}

# Check Modbus read statistics
Write-Section "5. MODBUS READ STATISTICS"
$modbusStats = Invoke-SSH "logread | grep -i 'modbus' | grep -i 'success\|read\|request' | tail -10"
if ($modbusStats) {
    Write-Info "Recent Modbus activity:"
    $modbusStats | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Info "No recent Modbus activity in logs"
}

# Check Data Sender configuration
Write-Section "6. DATA SENDER CONFIGURATION"
$dataSenderConfig = Invoke-SSH "uci show data_sender 2>/dev/null"
if ($dataSenderConfig) {
    Write-Info "Data Sender config:"
    $dataSenderConfig | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Warn "No Data Sender configuration found"
}

# Check Data Sender service
Write-Section "7. DATA SENDER SERVICE STATUS"
$dataSenderService = Invoke-SSH "ps | grep -i data_sender | grep -v grep"
if ($dataSenderService) {
    Write-Info "Data Sender service is running:"
    $dataSenderService | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Warn "Data Sender service may not be running"
}

# Check Data Sender logs
Write-Section "8. DATA SENDER LOGS"
$dataSenderLogs = Invoke-SSH "logread | grep -i 'data_sender\|http\|post' | tail -15"
if ($dataSenderLogs) {
    Write-Info "Recent Data Sender activity:"
    $dataSenderLogs | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Info "No Data Sender activity in logs"
}

# Check network connectivity to API
Write-Section "9. NETWORK CONNECTIVITY"
Write-Host "Testing connection to FluxIO API..."
$pingTest = Invoke-SSH "ping -c 1 -W 2 www.fluxio.work 2>&1 || echo 'PING_FAILED'"
if ($pingTest -notmatch "PING_FAILED") {
    Write-Info "Ping to www.fluxio.work successful"
} else {
    Write-Warn "Cannot ping www.fluxio.work (may be blocked, trying curl)"
}

$curlTest = Invoke-SSH "curl -k -s -o /dev/null -w '%{http_code}' https://www.fluxio.work/api/ingest -X POST -H 'Content-Type: application/json' -d '{\"test\":true}' 2>&1"
Write-Info "API endpoint returned HTTP: $curlTest"

# Check cron for fluxio_sender
Write-Section "10. CRON CONFIGURATION"
$cronJobs = Invoke-SSH "cat /etc/crontabs/root 2>/dev/null | grep -i fluxio"
if ($cronJobs) {
    Write-Info "FluxIO cron jobs found:"
    $cronJobs | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Warn "No FluxIO cron jobs configured"
}

# Check if fluxio_sender script exists
Write-Section "11. FLUXIO SENDER SCRIPT"
$senderScript = Invoke-SSH "ls -la /root/fluxio_sender*.sh 2>/dev/null"
if ($senderScript) {
    Write-Info "Sender scripts found:"
    $senderScript | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Warn "No FluxIO sender scripts in /root/"
}

# Try to read a Modbus value
Write-Section "12. MODBUS VALUE TEST"
$deviceNames = @("Nivus_Simulator", "device_1", "NIVUS_750_001")
foreach ($device in $deviceNames) {
    $value = Invoke-SSH "ubus call modbus_client get_register '{`"device`":`"$device`",`"register`":`"flow_rate`"}' 2>/dev/null"
    if ($value -and $value -notmatch "error") {
        Write-Info "Device '$device' flow_rate: $value"
        break
    }
}

# Summary
Write-Section "DIAGNOSTIC SUMMARY"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If Modbus devices aren't configured, run: .\configure-trb246.ps1"
Write-Host "2. If Data Sender fails, install the cron script: .\install-fluxio-sender.ps1"
Write-Host "3. Check TRB246 web UI at http://$HostIP for manual configuration"
Write-Host ""
Write-Host "Manual SSH access:"
Write-Host "  plink -ssh -l $User -pw `"$Password`" $HostIP"
Write-Host ""

# Version footer
Write-Host ""
Write-Host "v1.4 | 2026-02-01 | github.com/chatgptnotes/fluxio" -ForegroundColor DarkGray
