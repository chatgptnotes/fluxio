# CSTPS Mock Data Injection Script
# Sends realistic mock data for 6 NIVUS 750 flow sensors to Pipedream webhook
#
# Usage:
#   .\inject-mock-data.ps1                    # Send one batch of data
#   .\inject-mock-data.ps1 -Continuous        # Send data every 10 seconds
#   .\inject-mock-data.ps1 -Continuous -IntervalSeconds 5  # Custom interval

param(
    [switch]$Continuous,
    [int]$IntervalSeconds = 10,
    [string]$WebhookUrl = "https://eo6wafeaehkwubn.m.pipedream.net"
)

# Device configurations with realistic baseline values
$devices = @(
    @{
        device_id = "NIVUS_750_001"
        name = "Main Intake"
        flow_rate_base = 130      # 120-140 m3/h
        flow_rate_variance = 10
        totalizer_base = 458920
        temperature_base = 18.5
        velocity_base = 2.45
        water_level = 1250
        battery_level = 95
        signal_strength = -45
    },
    @{
        device_id = "NIVUS_750_002"
        name = "Secondary Intake"
        flow_rate_base = 100      # 90-110 m3/h
        flow_rate_variance = 10
        totalizer_base = 385210
        temperature_base = 18.2
        velocity_base = 1.92
        water_level = 1180
        battery_level = 88
        signal_strength = -52
    },
    @{
        device_id = "NIVUS_750_003"
        name = "Cooling Water"
        flow_rate_base = 77.5     # 70-85 m3/h
        flow_rate_variance = 7.5
        totalizer_base = 298450
        temperature_base = 22.8
        velocity_base = 1.47
        water_level = 950
        battery_level = 92
        signal_strength = -48
    },
    @{
        device_id = "NIVUS_750_004"
        name = "Auxiliary Feed"
        flow_rate_base = 47.5     # 40-55 m3/h
        flow_rate_variance = 7.5
        totalizer_base = 178920
        temperature_base = 19.5
        velocity_base = 0.89
        water_level = 680
        battery_level = 45        # Low battery (warning state)
        signal_strength = -68
    },
    @{
        device_id = "NIVUS_750_005"
        name = "Emergency Supply"
        flow_rate_base = 15       # 10-20 m3/h
        flow_rate_variance = 5
        totalizer_base = 52180
        temperature_base = 17.8
        velocity_base = 0.24
        water_level = 420
        battery_level = 98
        signal_strength = -42
    },
    @{
        device_id = "NIVUS_750_006"
        name = "Overflow Return"
        flow_rate_base = 2.5      # 0-5 m3/h (normally very low)
        flow_rate_variance = 2.5
        totalizer_base = 15840
        temperature_base = 16.2
        velocity_base = 0.05
        water_level = 120
        battery_level = 12        # Very low battery (offline state simulation)
        signal_strength = -85
    }
)

# Track totalizer values across iterations
$totalizerValues = @{}
foreach ($device in $devices) {
    $totalizerValues[$device.device_id] = $device.totalizer_base
}

function Get-RandomVariation {
    param(
        [double]$Base,
        [double]$Variance
    )
    return $Base + (Get-Random -Minimum (-$Variance) -Maximum $Variance)
}

function Send-DeviceData {
    param(
        [hashtable]$Device,
        [ref]$Totalizer
    )

    # Generate realistic varying values
    $flowRate = [math]::Round((Get-RandomVariation -Base $Device.flow_rate_base -Variance $Device.flow_rate_variance), 2)
    if ($flowRate -lt 0) { $flowRate = 0 }

    # Update totalizer based on flow rate (m3/h to m3 per interval)
    $totalizerIncrement = $flowRate * ($IntervalSeconds / 3600)
    $Totalizer.Value += $totalizerIncrement

    $temperature = [math]::Round((Get-RandomVariation -Base $Device.temperature_base -Variance 0.5), 1)
    $velocity = [math]::Round(($Device.velocity_base * ($flowRate / $Device.flow_rate_base)), 2)
    if ($velocity -lt 0) { $velocity = 0 }

    $waterLevel = $Device.water_level + [int](Get-Random -Minimum -20 -Maximum 20)

    # Battery decreases slowly over time (simulate)
    $batteryLevel = [math]::Max(0, $Device.battery_level + (Get-Random -Minimum -1 -Maximum 1))

    $payload = @{
        device_id = $Device.device_id
        flow_rate = $flowRate
        totalizer = [math]::Round($Totalizer.Value, 2)
        temperature = $temperature
        battery_level = $batteryLevel
        signal_strength = $Device.signal_strength + (Get-Random -Minimum -3 -Maximum 3)
        timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        metadata = @{
            velocity = $velocity
            water_level = $waterLevel
            source = "mock_data_script"
            pipe_name = $Device.name
        }
    }

    return $payload
}

function Send-AllDevicesData {
    $allPayloads = @()

    foreach ($device in $devices) {
        $totalizerRef = [ref]$totalizerValues[$device.device_id]
        $payload = Send-DeviceData -Device $device -Totalizer $totalizerRef
        $totalizerValues[$device.device_id] = $totalizerRef.Value
        $allPayloads += $payload
    }

    # Send as batch to Pipedream
    try {
        $jsonBody = $allPayloads | ConvertTo-Json -Depth 10

        Write-Host "`n$(Get-Date -Format 'HH:mm:ss') - Sending data for $($devices.Count) devices..." -ForegroundColor Cyan

        $response = Invoke-RestMethod -Uri $WebhookUrl -Method Post -Body $jsonBody -ContentType "application/json" -ErrorAction Stop

        Write-Host "  Success! Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green

        # Display summary
        Write-Host "`n  Device Summary:" -ForegroundColor Yellow
        foreach ($payload in $allPayloads) {
            $statusColor = if ($payload.battery_level -lt 20) { "Red" }
                          elseif ($payload.battery_level -lt 50) { "Yellow" }
                          else { "Green" }
            Write-Host "    $($payload.device_id): $($payload.flow_rate) m3/h, Temp: $($payload.temperature)C, Battery: $($payload.battery_level)%" -ForegroundColor $statusColor
        }

    } catch {
        Write-Host "  Error sending data: $_" -ForegroundColor Red
    }
}

# Main execution
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  CSTPS Mock Data Injection Script" -ForegroundColor Cyan
Write-Host "  Webhook: $WebhookUrl" -ForegroundColor Gray
Write-Host "  Devices: $($devices.Count)" -ForegroundColor Gray
if ($Continuous) {
    Write-Host "  Mode: Continuous (every $IntervalSeconds seconds)" -ForegroundColor Yellow
    Write-Host "  Press Ctrl+C to stop" -ForegroundColor Yellow
}
Write-Host "================================================" -ForegroundColor Cyan

if ($Continuous) {
    Write-Host "`nStarting continuous data injection..." -ForegroundColor Green
    while ($true) {
        Send-AllDevicesData
        Start-Sleep -Seconds $IntervalSeconds
    }
} else {
    Send-AllDevicesData
    Write-Host "`nDone! Run with -Continuous flag for continuous data injection." -ForegroundColor Cyan
}
