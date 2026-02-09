<#
.SYNOPSIS
    Install FluxIO Sender Script on TRB246

.DESCRIPTION
    Copies the fluxio_sender.sh script to TRB246 and configures cron job.
    This is the recommended method for sending data from TRB246 to FluxIO,
    as the built-in data_sender service has issues with HTTPS.

.PARAMETER Host
    TRB246 IP address (default: 192.168.1.2)

.PARAMETER User
    SSH username (default: root)

.PARAMETER Password
    SSH password (required)

.PARAMETER Interval
    Cron interval (default: '* * * * *' = every minute)

.PARAMETER Script
    Script to install: 'standard' or 'simulator' (default: simulator)

.EXAMPLE
    .\install-fluxio-sender.ps1 -Password 'Lightyear@123'

.EXAMPLE
    .\install-fluxio-sender.ps1 -Password 'Lightyear@123' -Script simulator -Interval '*/5 * * * *'

.NOTES
    Requires Plink and PSCP (PuTTY tools) to be installed and in PATH.
    Version: 1.4
    Date: 2026-02-01
    Repository: https://github.com/chatgptnotes/fluxio
#>

param(
    [string]$HostIP = "192.168.1.2",
    [string]$User = "root",
    [Parameter(Mandatory=$true)]
    [string]$Password,
    [string]$Interval = "* * * * *",
    [ValidateSet("standard", "simulator")]
    [string]$Script = "simulator"
)

$RemotePath = "/root/fluxio_sender.sh"

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

function Write-Step {
    param([string]$Message)
    Write-Host "[STEP] $Message" -ForegroundColor Blue
}

function Invoke-SSH {
    param([string]$Command)
    $result = & plink -ssh -l $User -pw $Password -batch $HostIP $Command 2>&1
    return $result
}

function Send-File {
    param([string]$LocalPath, [string]$RemotePath)
    & pscp -pw $Password -batch $LocalPath "${User}@${HostIP}:${RemotePath}" 2>&1
}

# Header
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FluxIO Sender Installation" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: $User@$HostIP"
Write-Host "Script: $Script"
Write-Host "Cron: $Interval"
Write-Host ""

# Check for required tools
Write-Step "Checking requirements..."
$missing = @()

if (-not (Get-Command plink -ErrorAction SilentlyContinue)) {
    $missing += "plink"
}
if (-not (Get-Command pscp -ErrorAction SilentlyContinue)) {
    $missing += "pscp"
}

if ($missing.Count -gt 0) {
    Write-Err "Missing required tools: $($missing -join ', ')"
    Write-Host "Install PuTTY tools from: https://www.putty.org/"
    Write-Host "Or via chocolatey: choco install putty.install"
    exit 1
}
Write-Info "All requirements met"

# Determine script file
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
switch ($Script) {
    "standard" {
        $LocalScript = Join-Path $ScriptDir "fluxio_sender.sh"
    }
    "simulator" {
        $LocalScript = Join-Path $ScriptDir "fluxio_sender_simulator.sh"
        if (-not (Test-Path $LocalScript)) {
            # Fall back to standard script
            $LocalScript = Join-Path $ScriptDir "fluxio_sender.sh"
        }
    }
}

if (-not (Test-Path $LocalScript)) {
    Write-Err "Cannot find script: $LocalScript"
    Write-Host "Please ensure the script exists in the scripts directory"
    exit 1
}
Write-Info "Using script: $LocalScript"

# Test SSH connection
Write-Step "Testing SSH connection..."
$testResult = Invoke-SSH "echo 'OK'"
if ($testResult -notmatch "OK") {
    Write-Err "Failed to connect to TRB246 at $HostIP"
    Write-Host "Check IP address, username, and password"
    exit 1
}
Write-Info "SSH connection successful"

# Copy the script
Write-Step "Copying script to TRB246..."
$copyResult = Send-File $LocalScript $RemotePath
if ($LASTEXITCODE -ne 0) {
    Write-Err "Failed to copy script: $copyResult"
    exit 1
}
Write-Info "Script copied to $RemotePath"

# Make executable
Write-Step "Making script executable..."
Invoke-SSH "chmod +x $RemotePath" | Out-Null
Write-Info "Script is now executable"

# Configure cron
Write-Step "Configuring cron job..."

# Remove existing fluxio_sender entries
Invoke-SSH "sed -i '/fluxio_sender/d' /etc/crontabs/root 2>/dev/null" | Out-Null

# Add new cron entry
$cronEntry = "$Interval $RemotePath"
Invoke-SSH "echo '$cronEntry' >> /etc/crontabs/root" | Out-Null
Write-Info "Cron job added: $cronEntry"

# Restart cron service
Write-Step "Restarting cron service..."
Invoke-SSH "/etc/init.d/cron restart 2>/dev/null" | Out-Null
Write-Info "Cron service restarted"

# Test the script
Write-Step "Testing the sender script..."
$testOutput = Invoke-SSH "$RemotePath -v 2>&1"
Write-Info "Script test output:"
$testOutput | ForEach-Object { Write-Host "  $_" }

# Verify installation
Write-Step "Verifying installation..."
$cronVerify = Invoke-SSH "grep fluxio_sender /etc/crontabs/root"
if ($cronVerify) {
    Write-Info "Cron entry verified: $cronVerify"
} else {
    Write-Warn "Could not verify cron entry"
}

# Success
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Info "FluxIO sender will now run automatically every minute"
Write-Host ""
Write-Host "Useful commands on TRB246:" -ForegroundColor Yellow
Write-Host "  View logs:        logread | grep fluxio_sender"
Write-Host "  Manual run:       $RemotePath"
Write-Host "  Debug mode:       DEBUG=1 $RemotePath"
Write-Host "  Verbose mode:     $RemotePath -v"
Write-Host "  View cron:        cat /etc/crontabs/root"
Write-Host ""
Write-Host "SSH into TRB246:" -ForegroundColor Yellow
Write-Host "  plink -ssh -l $User -pw `"$Password`" $HostIP"
Write-Host ""
Write-Host "Monitor FluxIO dashboard for incoming data:"
Write-Host "  http://localhost:3000 (local dev)"
Write-Host "  https://www.fluxio.work (production)"
Write-Host ""

# Version footer
Write-Host "v1.4 | 2026-02-01 | github.com/chatgptnotes/fluxio" -ForegroundColor DarkGray
