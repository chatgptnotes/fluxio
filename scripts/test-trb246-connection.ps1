# TRB246 Connection Test Script for FluxIO
# Run this script to verify your TRB246 gateway can communicate with FluxIO

param(
    [string]$ApiUrl = "http://localhost:3000/api/ingest",
    [string]$ApiKey = "your-api-secret-key",
    [string]$DeviceId = "TRB246-001"
)

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  FluxIO - TRB246 Connection Test" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: API Health Check
Write-Host "[1/3] Testing API health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$ApiUrl" -Method GET -ErrorAction Stop
    Write-Host "  Status: $($healthResponse.status)" -ForegroundColor Green
    Write-Host "  Service: $($healthResponse.service)" -ForegroundColor Green
    Write-Host "  Version: $($healthResponse.version)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: Cannot reach API endpoint" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Authentication Test
Write-Host "[2/3] Testing API authentication..." -ForegroundColor Yellow
$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = $ApiKey
}

$testData = @{
    device_id = $DeviceId
    flow_rate = 0.0
    totalizer = 0.0
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $testData -ErrorAction Stop
    if ($authResponse.success) {
        Write-Host "  Authentication: SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "  Authentication: FAILED" -ForegroundColor Red
        Write-Host "  Response: $($authResponse | ConvertTo-Json)" -ForegroundColor Red
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "  Authentication: FAILED (Invalid API Key)" -ForegroundColor Red
        Write-Host "  Check your API_SECRET_KEY in .env file" -ForegroundColor Yellow
    } else {
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit 1
}
Write-Host ""

# Test 3: Sample Data Ingestion
Write-Host "[3/3] Testing data ingestion with sample payload..." -ForegroundColor Yellow
$sampleData = @{
    device_id = $DeviceId
    flow_rate = 125.75
    totalizer = 98765.43
    temperature = 23.5
    pressure = 1.2
    battery_level = 92
    signal_strength = -65
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    metadata = @{
        test = $true
        source = "test-script"
    }
} | ConvertTo-Json -Depth 3

try {
    $ingestResponse = Invoke-RestMethod -Uri $ApiUrl -Method POST -Headers $headers -Body $sampleData -ErrorAction Stop
    Write-Host "  Data Ingestion: SUCCESS" -ForegroundColor Green
    Write-Host "  Device: $DeviceId" -ForegroundColor Green
    Write-Host "  Response: $($ingestResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "  Data Ingestion: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  All Tests Passed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your FluxIO API is ready to receive data from TRB246." -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Configure TRB246 Data to Server with:" -ForegroundColor White
Write-Host "     URL: $ApiUrl" -ForegroundColor Gray
Write-Host "     Header: x-api-key: $ApiKey" -ForegroundColor Gray
Write-Host "     Device ID: $DeviceId" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Open FluxIO dashboard to see incoming data:" -ForegroundColor White
Write-Host "     http://localhost:3000" -ForegroundColor Gray
Write-Host ""
