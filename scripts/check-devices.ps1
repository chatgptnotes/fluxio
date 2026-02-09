$headers = @{
    'apikey' = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
    'Authorization' = 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
}

Write-Host "=== Checking Devices Table ===" -ForegroundColor Cyan
$devices = Invoke-RestMethod -Uri 'https://aynoltymgusyasgxshng.supabase.co/rest/v1/devices?select=device_id,name,status' -Headers $headers
$devices | Format-Table -AutoSize

Write-Host ""
Write-Host "=== Checking for NIVUS_750_001 ===" -ForegroundColor Cyan
$nivus = $devices | Where-Object { $_.device_id -eq 'NIVUS_750_001' }
if ($nivus) {
    Write-Host "FOUND: NIVUS_750_001" -ForegroundColor Green
    $nivus | Format-List
} else {
    Write-Host "NOT FOUND: NIVUS_750_001" -ForegroundColor Red
    Write-Host "This device needs to be registered in the devices table!"
}

Write-Host ""
Write-Host "=== Testing Direct Insert to flow_data ===" -ForegroundColor Cyan
$testBody = @{
    device_id = 'NIVUS_750_001'
    flow_rate = 123.45
    totalizer = 1000
    temperature = 25.5
} | ConvertTo-Json

try {
    $insertHeaders = @{
        'apikey' = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
        'Authorization' = 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
        'Content-Type' = 'application/json'
        'Prefer' = 'return=representation'
    }
    $result = Invoke-RestMethod -Uri 'https://aynoltymgusyasgxshng.supabase.co/rest/v1/flow_data' -Method POST -Headers $insertHeaders -Body $testBody
    Write-Host "INSERT SUCCESS!" -ForegroundColor Green
    $result | Format-List
} catch {
    Write-Host "INSERT FAILED!" -ForegroundColor Red
    Write-Host $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}
