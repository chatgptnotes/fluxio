$headers = @{
    'apikey' = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'
    'Authorization' = 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
}

$response = Invoke-RestMethod -Uri 'https://aynoltymgusyasgxshng.supabase.co/rest/v1/flow_data?select=device_id,flow_rate,created_at&order=created_at.desc&limit=15' -Headers $headers

Write-Host "=== Latest Flow Data Records from Supabase ===" -ForegroundColor Cyan
Write-Host ""

if ($response.Count -eq 0) {
    Write-Host "NO DATA FOUND in flow_data table" -ForegroundColor Red
} else {
    Write-Host "Found $($response.Count) records:" -ForegroundColor Green
    Write-Host ""

    foreach ($record in $response) {
        $createdAt = [DateTime]::Parse($record.created_at)
        $localTime = $createdAt.ToLocalTime()
        $timeSince = (Get-Date) - $localTime

        Write-Host "Device: $($record.device_id)" -ForegroundColor Yellow
        Write-Host "  Flow Rate: $($record.flow_rate) m3/h"
        Write-Host "  Created At (UTC): $($record.created_at)"
        Write-Host "  Created At (Local): $($localTime.ToString('yyyy-MM-dd HH:mm:ss'))"
        Write-Host "  Time Since: $([math]::Round($timeSince.TotalMinutes, 1)) minutes ago"
        Write-Host ""
    }
}
