# TBR 246 Gateway - Supabase Direct Insert Test Script
# Run this script to verify your Supabase connection works

# ============================================
# CONFIGURATION - Update these values
# ============================================

$SUPABASE_URL = "https://aynoltymgusyasgxshng.supabase.co"
$SERVICE_ROLE_KEY = "YOUR_SUPABASE_SERVICE_ROLE_KEY"
$DEVICE_ID = "NIVUS_750_01"

# ============================================
# DO NOT MODIFY BELOW THIS LINE
# ============================================

Write-Host "TBR 246 Gateway - Supabase Insert Test" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check if placeholder values are still present (modify these if you need to use different credentials)
if ($SUPABASE_URL -like "*xxxxx*") {
    Write-Host "ERROR: Please update SUPABASE_URL with your project URL" -ForegroundColor Red
    exit 1
}

if ($SERVICE_ROLE_KEY -eq "your_service_role_key_here") {
    Write-Host "ERROR: Please update SERVICE_ROLE_KEY with your service_role key" -ForegroundColor Red
    exit 1
}

# Build the API endpoint
$endpoint = "$SUPABASE_URL/rest/v1/flow_data"

Write-Host "Testing connection to: $endpoint" -ForegroundColor Yellow
Write-Host ""

# Build headers
$headers = @{
    "apikey" = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# Build test payload with realistic values
$testData = @{
    device_id = $DEVICE_ID
    flow_rate = [math]::Round((Get-Random -Minimum 10.0 -Maximum 50.0), 2)
    totalizer = [math]::Round((Get-Random -Minimum 10000.0 -Maximum 20000.0), 2)
    temperature = [math]::Round((Get-Random -Minimum 15.0 -Maximum 30.0), 1)
    signal_strength = Get-Random -Minimum -80 -Maximum -50
    metadata = @{
        gateway_imei = "TEST_SCRIPT"
        source = "powershell_test"
        test_timestamp = (Get-Date).ToString("o")
    }
}

$body = $testData | ConvertTo-Json -Depth 3

Write-Host "Sending test data:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $endpoint -Method Post -Headers $headers -Body $body -ErrorAction Stop

    Write-Host "SUCCESS! Data inserted successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "Inserted record:" -ForegroundColor Yellow
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Check Supabase Table Editor > flow_data to see the record" -ForegroundColor White
    Write-Host "2. Configure your TBR 246 gateway with the same URL and headers" -ForegroundColor White
    Write-Host "3. Open FluxIO dashboard to verify data display" -ForegroundColor White
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.ErrorDetails.Message

    Write-Host "FAILED! HTTP Status: $statusCode" -ForegroundColor Red
    Write-Host ""

    switch ($statusCode) {
        401 {
            Write-Host "Authentication Error (401 Unauthorized)" -ForegroundColor Red
            Write-Host "- Check that you're using the service_role key (not anon key)" -ForegroundColor Yellow
            Write-Host "- Verify the key has no extra spaces or characters" -ForegroundColor Yellow
        }
        404 {
            Write-Host "Not Found Error (404)" -ForegroundColor Red
            Write-Host "- Check that the URL is correct" -ForegroundColor Yellow
            Write-Host "- Verify the flow_data table exists in Supabase" -ForegroundColor Yellow
        }
        409 {
            Write-Host "Conflict Error (409)" -ForegroundColor Red
            Write-Host "- The device_id '$DEVICE_ID' may not exist in the devices table" -ForegroundColor Yellow
            Write-Host "- Run the setup-tbr246-device.sql script first" -ForegroundColor Yellow
        }
        400 {
            Write-Host "Bad Request Error (400)" -ForegroundColor Red
            Write-Host "- Check the JSON format" -ForegroundColor Yellow
            Write-Host "- Verify column names match the table schema" -ForegroundColor Yellow
        }
        default {
            Write-Host "Unexpected error occurred" -ForegroundColor Red
        }
    }

    if ($errorMessage) {
        Write-Host ""
        Write-Host "Error details: $errorMessage" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
