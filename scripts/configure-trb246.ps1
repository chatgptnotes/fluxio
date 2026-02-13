<#
.SYNOPSIS
    TRB246 Configuration Script for FluxIO (Windows PowerShell version)

.DESCRIPTION
    Configures Teltonika TRB246 gateway to poll 6 Nivus 750 transmitters
    and send data to Supabase via HTTP POST.

    Uses Plink (PuTTY CLI) for SSH connections on Windows.

.PARAMETER Host
    TRB246 IP address (default: 192.168.1.2)

.PARAMETER User
    SSH username (default: admin)

.PARAMETER Password
    SSH password (required)

.PARAMETER DryRun
    Print commands without executing

.EXAMPLE
    .\configure-trb246.ps1 -Host 192.168.1.2 -User admin -Password 'Lightyear@123'

.NOTES
    Requires Plink (PuTTY CLI) to be installed and in PATH.
    Download from: https://www.putty.org/
#>

param(
    [string]$HostIP = "192.168.1.2",
    [string]$User = "admin",
    [Parameter(Mandatory=$true)]
    [string]$Password,
    [switch]$DryRun
)

# FluxIO API configuration (preferred over direct Supabase)
$FluxioApiUrl = "https://www.flownexus.work/api/ingest"
$FluxioApiKey = "fluxio_secure_key_2025_production"

# Supabase configuration (backup, if direct API fails)
$SupabaseUrl = "https://dzmiisuxwruoeklbkyzc.supabase.co/rest/v1/flow_data"
$SupabaseApiKey = "sb_publishable_ed4UwVUrD7rc2Qlx0Fp8sg_rdm3ctOL"
$SupabaseSecret = "YOUR_SUPABASE_SERVICE_ROLE_KEY"

# Polling interval in seconds (5 minutes)
$PollPeriod = 300

# Device configurations
$Devices = @(
    @{ Index = 1; DeviceId = "NIVUS_750_001"; IP = "192.168.1.10"; Name = "Nivus750 Line1" },
    @{ Index = 2; DeviceId = "NIVUS_750_002"; IP = "192.168.1.11"; Name = "Nivus750 Line2" },
    @{ Index = 3; DeviceId = "NIVUS_750_003"; IP = "192.168.1.12"; Name = "Nivus750 Line3" },
    @{ Index = 4; DeviceId = "NIVUS_750_004"; IP = "192.168.1.13"; Name = "Nivus750 Line4" },
    @{ Index = 5; DeviceId = "NIVUS_750_005"; IP = "192.168.1.14"; Name = "Nivus750 Line5" },
    @{ Index = 6; DeviceId = "NIVUS_750_006"; IP = "192.168.1.15"; Name = "Nivus750 Line6" }
)

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Test-PlinkAvailable {
    try {
        $null = Get-Command plink -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

function Invoke-SSHCommand {
    param(
        [string]$Command
    )

    if ($DryRun) {
        Write-Host "[DRY-RUN] $Command" -ForegroundColor Cyan
        return
    }

    # Use plink for SSH on Windows
    $plinkArgs = "-ssh -l $User -pw `"$Password`" -batch $HostIP `"$Command`""

    try {
        $result = & plink $plinkArgs 2>&1
        return $result
    }
    catch {
        Write-Error "SSH command failed: $_"
        return $null
    }
}

function Generate-ModbusConfig {
    $commands = @()

    # Clear existing modbus configuration
    $commands += "uci delete modbus 2>/dev/null || true"
    $commands += "uci set modbus=modbus"

    foreach ($device in $Devices) {
        $i = $device.Index
        $deviceId = $device.DeviceId
        $ip = $device.IP

        Write-Info "Configuring device $i`: $deviceId ($ip)"

        # Device configuration
        $commands += "uci set modbus.device_$i=device"
        $commands += "uci set modbus.device_$i.name='$deviceId'"
        $commands += "uci set modbus.device_$i.ip='$ip'"
        $commands += "uci set modbus.device_$i.port='502'"
        $commands += "uci set modbus.device_$i.slave_id='1'"
        $commands += "uci set modbus.device_$i.period='$PollPeriod'"
        $commands += "uci set modbus.device_$i.enabled='1'"
        $commands += "uci set modbus.device_$i.timeout='5'"

        # Register requests (1-based addressing for TRB246)

        # Flow Rate - Register 1
        $commands += "uci set modbus.req_${i}_flow=request"
        $commands += "uci set modbus.req_${i}_flow.device='device_$i'"
        $commands += "uci set modbus.req_${i}_flow.name='flow_rate'"
        $commands += "uci set modbus.req_${i}_flow.function='3'"
        $commands += "uci set modbus.req_${i}_flow.first_reg='1'"
        $commands += "uci set modbus.req_${i}_flow.reg_count='2'"
        $commands += "uci set modbus.req_${i}_flow.data_type='32bit_float_cdab'"
        $commands += "uci set modbus.req_${i}_flow.enabled='1'"

        # Totalizer - Register 3
        $commands += "uci set modbus.req_${i}_total=request"
        $commands += "uci set modbus.req_${i}_total.device='device_$i'"
        $commands += "uci set modbus.req_${i}_total.name='totalizer'"
        $commands += "uci set modbus.req_${i}_total.function='3'"
        $commands += "uci set modbus.req_${i}_total.first_reg='3'"
        $commands += "uci set modbus.req_${i}_total.reg_count='2'"
        $commands += "uci set modbus.req_${i}_total.data_type='32bit_float_cdab'"
        $commands += "uci set modbus.req_${i}_total.enabled='1'"

        # Temperature - Register 5
        $commands += "uci set modbus.req_${i}_temp=request"
        $commands += "uci set modbus.req_${i}_temp.device='device_$i'"
        $commands += "uci set modbus.req_${i}_temp.name='temperature'"
        $commands += "uci set modbus.req_${i}_temp.function='3'"
        $commands += "uci set modbus.req_${i}_temp.first_reg='5'"
        $commands += "uci set modbus.req_${i}_temp.reg_count='2'"
        $commands += "uci set modbus.req_${i}_temp.data_type='32bit_float_cdab'"
        $commands += "uci set modbus.req_${i}_temp.enabled='1'"

        # Water Level - Register 7
        $commands += "uci set modbus.req_${i}_level=request"
        $commands += "uci set modbus.req_${i}_level.device='device_$i'"
        $commands += "uci set modbus.req_${i}_level.name='water_level'"
        $commands += "uci set modbus.req_${i}_level.function='3'"
        $commands += "uci set modbus.req_${i}_level.first_reg='7'"
        $commands += "uci set modbus.req_${i}_level.reg_count='2'"
        $commands += "uci set modbus.req_${i}_level.data_type='32bit_float_cdab'"
        $commands += "uci set modbus.req_${i}_level.enabled='1'"

        # Velocity - Register 9
        $commands += "uci set modbus.req_${i}_vel=request"
        $commands += "uci set modbus.req_${i}_vel.device='device_$i'"
        $commands += "uci set modbus.req_${i}_vel.name='velocity'"
        $commands += "uci set modbus.req_${i}_vel.function='3'"
        $commands += "uci set modbus.req_${i}_vel.first_reg='9'"
        $commands += "uci set modbus.req_${i}_vel.reg_count='2'"
        $commands += "uci set modbus.req_${i}_vel.data_type='32bit_float_cdab'"
        $commands += "uci set modbus.req_${i}_vel.enabled='1'"
    }

    # Commit modbus configuration
    $commands += "uci commit modbus"

    return $commands
}

function Generate-DataSenderConfig {
    $commands = @()

    # Note: TRB246 built-in data_sender may have issues with HTTPS redirects
    # The fluxio_sender.sh cron script is recommended as an alternative
    Write-Info "Configuring Data to Server for FluxIO API..."

    $commands += "uci delete data_sender 2>/dev/null || true"
    $commands += "uci set data_sender=data_sender"
    $commands += "uci set data_sender.sender1=sender"
    $commands += "uci set data_sender.sender1.name='FluxIO_API'"
    $commands += "uci set data_sender.sender1.enabled='1'"
    $commands += "uci set data_sender.sender1.url='$FluxioApiUrl'"
    $commands += "uci set data_sender.sender1.method='post'"
    $commands += "uci set data_sender.sender1.period='$PollPeriod'"
    $commands += "uci set data_sender.sender1.data_format='custom'"
    $commands += "uci set data_sender.sender1.content_type='application/json'"
    $commands += "uci set data_sender.sender1.tls='1'"

    # Add headers for FluxIO API authentication
    $commands += "uci add_list data_sender.sender1.headers='Content-Type: application/json'"
    $commands += "uci add_list data_sender.sender1.headers='x-api-key: $FluxioApiKey'"

    # Commit data_sender configuration
    $commands += "uci commit data_sender"

    return $commands
}

# Main execution
function Main {
    Write-Info "TRB246 Configuration Script for FluxIO"
    Write-Info "========================================"
    Write-Info "Target: $User@$HostIP"
    Write-Info "Devices: 6 Nivus 750 transmitters"
    Write-Info "Poll interval: $PollPeriod seconds"
    Write-Host ""

    if ($DryRun) {
        Write-Warn "DRY RUN MODE - No changes will be made"
        Write-Host ""
    }

    # Check for Plink
    if (-not $DryRun -and -not (Test-PlinkAvailable)) {
        Write-Error "Plink (PuTTY CLI) is required but not found in PATH."
        Write-Host "Download from: https://www.putty.org/"
        Write-Host "Or install via: choco install putty.install"
        exit 1
    }

    # Test SSH connection
    Write-Info "Testing SSH connection..."
    if (-not $DryRun) {
        $testResult = Invoke-SSHCommand -Command "echo 'Connection successful'"
        if ($null -eq $testResult) {
            Write-Error "Failed to connect to TRB246 at $HostIP"
            exit 1
        }
        Write-Info "SSH connection successful"
    }

    # Generate and execute Modbus configuration
    Write-Info "Configuring Modbus devices..."
    $modbusCommands = Generate-ModbusConfig
    foreach ($cmd in $modbusCommands) {
        if ($cmd) {
            Invoke-SSHCommand -Command $cmd | Out-Null
        }
    }

    # Generate and execute Data Sender configuration
    $senderCommands = Generate-DataSenderConfig
    foreach ($cmd in $senderCommands) {
        if ($cmd) {
            Invoke-SSHCommand -Command $cmd | Out-Null
        }
    }

    # Restart services
    Write-Info "Restarting Modbus service..."
    Invoke-SSHCommand -Command "/etc/init.d/modbus restart 2>/dev/null || /etc/init.d/modbusmaster restart 2>/dev/null || true" | Out-Null

    Write-Info "Restarting Data Sender service..."
    Invoke-SSHCommand -Command "/etc/init.d/data_sender restart 2>/dev/null || true" | Out-Null

    Write-Host ""
    Write-Info "========================================"
    Write-Info "Configuration complete!"
    Write-Host ""
    Write-Info "Verification commands:"
    Write-Host "  SSH into TRB246: plink -ssh -l $User -pw `"$Password`" $HostIP"
    Write-Host "  View Modbus config: uci show modbus"
    Write-Host "  View Data Sender config: uci show data_sender"
    Write-Host "  Check logs: logread | grep -i modbus"
    Write-Host ""
    Write-Info "Monitor Supabase flow_data table for incoming data"
    Write-Info "Expected first data in ~$PollPeriod seconds"
}

# Run main function
Main
