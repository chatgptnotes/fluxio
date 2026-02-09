<#
.SYNOPSIS
    Test script to verify TRB246 configuration for FluxIO

.DESCRIPTION
    Connects to TRB246 via SSH and displays current Modbus and Data Sender configuration.
    Use this to verify the configuration was applied correctly.

.PARAMETER Host
    TRB246 IP address (default: 192.168.1.2)

.PARAMETER User
    SSH username (default: admin)

.PARAMETER Password
    SSH password (required)

.EXAMPLE
    .\test-trb246-config.ps1 -Host 192.168.1.2 -User admin -Password 'Lightyear@123'
#>

param(
    [string]$HostIP = "192.168.1.2",
    [string]$User = "admin",
    [Parameter(Mandatory=$true)]
    [string]$Password
)

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host " $Title" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
}

function Invoke-SSHCommand {
    param([string]$Command)

    $result = & plink -ssh -l $User -pw "$Password" -batch $HostIP "$Command" 2>&1
    return $result
}

# Check for Plink
try {
    $null = Get-Command plink -ErrorAction Stop
}
catch {
    Write-Host "[ERROR] Plink (PuTTY CLI) is required but not found." -ForegroundColor Red
    Write-Host "Download from: https://www.putty.org/"
    exit 1
}

Write-Info "TRB246 Configuration Verification"
Write-Info "Target: $User@$HostIP"

# Test connection
Write-Info "Testing SSH connection..."
$testResult = Invoke-SSHCommand -Command "echo 'OK'"
if ($testResult -notlike "*OK*") {
    Write-Host "[ERROR] Failed to connect to TRB246" -ForegroundColor Red
    exit 1
}
Write-Info "Connection successful"

# Show Modbus device configuration
Write-Section "Modbus Devices"
$modbusDevices = Invoke-SSHCommand -Command "uci show modbus | grep -E '^modbus\.device_[0-9]'"
if ($modbusDevices) {
    Write-Host $modbusDevices
} else {
    Write-Host "(No Modbus devices configured)" -ForegroundColor Yellow
}

# Show Modbus request configuration
Write-Section "Modbus Requests"
$modbusRequests = Invoke-SSHCommand -Command "uci show modbus | grep -E '^modbus\.req_'"
if ($modbusRequests) {
    Write-Host $modbusRequests
} else {
    Write-Host "(No Modbus requests configured)" -ForegroundColor Yellow
}

# Show Data Sender configuration
Write-Section "Data Sender"
$dataSender = Invoke-SSHCommand -Command "uci show data_sender"
if ($dataSender) {
    Write-Host $dataSender
} else {
    Write-Host "(Data sender not configured)" -ForegroundColor Yellow
}

# Show service status
Write-Section "Service Status"
Write-Host "Modbus service:"
$modbusStatus = Invoke-SSHCommand -Command "/etc/init.d/modbus status 2>/dev/null || /etc/init.d/modbusmaster status 2>/dev/null || echo 'Service status unknown'"
Write-Host $modbusStatus

Write-Host ""
Write-Host "Data Sender service:"
$senderStatus = Invoke-SSHCommand -Command "/etc/init.d/data_sender status 2>/dev/null || echo 'Service status unknown'"
Write-Host $senderStatus

# Show recent logs
Write-Section "Recent Modbus Logs (last 20 lines)"
$logs = Invoke-SSHCommand -Command "logread | grep -i modbus | tail -20"
if ($logs) {
    Write-Host $logs
} else {
    Write-Host "(No recent Modbus log entries)" -ForegroundColor Yellow
}

Write-Host ""
Write-Info "Verification complete"
