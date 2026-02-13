# Test the FluxIO API with the exact format TRB246 sends

Write-Host "=== Testing FluxIO API with TRB246 Modbus Format ===" -ForegroundColor Cyan
Write-Host ""

# This is the exact format the TRB246 sends (Modbus register array)
$modbusData = @(
    @{ full_addr = "1"; data = 125.5 },
    @{ full_addr = "3"; data = 458920 },
    @{ full_addr = "5"; data = 25.3 }
) | ConvertTo-Json

Write-Host "Sending data:" -ForegroundColor Yellow
Write-Host $modbusData
Write-Host ""

$headers = @{
    'Content-Type' = 'application/json'
    'x-api-key' = 'fluxio_secure_key_2025_production'
    'x-device-id' = 'NIVUS_750_001'
}

try {
    $response = Invoke-RestMethod -Uri 'https://www.flownexus.work/api/ingest' -Method POST -Headers $headers -Body $modbusData
    Write-Host "API Response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "API Error!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Checking Latest Data in Supabase ===" -ForegroundColor Cyan

$dbHeaders = @{
    'apikey' = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
    'Authorization' = 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
}

$latestData = Invoke-RestMethod -Uri 'https://aynoltymgusyasgxshng.supabase.co/rest/v1/flow_data?select=id,device_id,flow_rate,totalizer,temperature,created_at&order=created_at.desc&limit=3' -Headers $dbHeaders

Write-Host "Latest 3 records:" -ForegroundColor Green
$latestData | Format-Table -AutoSize
