# FluxIO Database Cleanup Script
# Clears alerts, flow_data tables and resets device last_seen
# Usage: .\clean-database.ps1

$ErrorActionPreference = "Stop"

# Supabase configuration - Using values from .env.local
$SUPABASE_URL = "https://dzmiisuxwruoeklbkyzc.supabase.co"
$SUPABASE_SERVICE_KEY = "sb_secret_HGAmOgL-ypdQsFAxNpQcXg_iOKvvVjb"

$headers = @{
    "apikey" = $SUPABASE_SERVICE_KEY
    "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}

Write-Host "FluxIO Database Cleanup" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Delete all alerts
Write-Host "1. Deleting all alerts..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/alerts?id=neq.00000000-0000-0000-0000-000000000000" `
        -Method Delete -Headers $headers
    Write-Host "   Alerts table cleared successfully" -ForegroundColor Green
} catch {
    Write-Host "   Error clearing alerts: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Delete all flow_data
Write-Host "2. Deleting all flow_data..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/flow_data?id=gt.0" `
        -Method Delete -Headers $headers
    Write-Host "   Flow_data table cleared successfully" -ForegroundColor Green
} catch {
    Write-Host "   Error clearing flow_data: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Reset device last_seen to null
Write-Host "3. Resetting device last_seen timestamps..." -ForegroundColor Yellow
try {
    $body = '{"last_seen": null}'
    $response = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/devices?device_id=like.NIVUS*" `
        -Method Patch -Headers $headers -Body $body
    Write-Host "   Device timestamps reset successfully" -ForegroundColor Green
} catch {
    Write-Host "   Error resetting devices: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Verification:" -ForegroundColor Cyan

# Verify alerts count
try {
    $countHeaders = @{
        "apikey" = $SUPABASE_SERVICE_KEY
        "Authorization" = "Bearer $SUPABASE_SERVICE_KEY"
        "Prefer" = "count=exact"
    }
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/alerts?select=id" -Headers $countHeaders
    $count = $response.Headers["Content-Range"] -replace ".*/"
    Write-Host "   Alerts count: $count" -ForegroundColor White
} catch {
    Write-Host "   Could not verify alerts count" -ForegroundColor Yellow
}

# Verify flow_data count
try {
    $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/flow_data?select=id" -Headers $countHeaders
    $count = $response.Headers["Content-Range"] -replace ".*/"
    Write-Host "   Flow_data count: $count" -ForegroundColor White
} catch {
    Write-Host "   Could not verify flow_data count" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Database is now ready for fresh deployment!" -ForegroundColor Green
