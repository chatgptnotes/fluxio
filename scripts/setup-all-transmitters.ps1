# ==============================================================================
# TRB246 Setup - All 6 Nivus 750 Transmitters
# ==============================================================================
# Uses Windows OpenSSH (built-in) or sshpass for password auth
# ==============================================================================

$TRB_IP = "192.168.1.2"
$TRB_USER = "root"
$TRB_PASS = "Lightyear@123"

# Try to find plink in common locations
$plinkPaths = @(
    "plink",
    "C:\Program Files\PuTTY\plink.exe",
    "C:\Program Files (x86)\PuTTY\plink.exe",
    "$env:USERPROFILE\Downloads\plink.exe"
)

$plink = $null
foreach ($path in $plinkPaths) {
    if (Get-Command $path -ErrorAction SilentlyContinue) {
        $plink = $path
        break
    }
}

if (-not $plink) {
    Write-Host "ERROR: plink not found. Please run these commands manually in a terminal where plink is available." -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual commands to run:" -ForegroundColor Yellow
    Write-Host ""

    $allCommands = @"
# SSH into TRB246 and run these commands:
# plink -ssh -l root -pw "Lightyear@123" 192.168.1.2

# Clear existing config
uci delete modbus 2>/dev/null

# Device 1 - 192.168.1.10
uci set modbus.device_1=device
uci set modbus.device_1.name='Nivus_001'
uci set modbus.device_1.enabled='1'
uci set modbus.device_1.protocol='tcp'
uci set modbus.device_1.ip='192.168.1.10'
uci set modbus.device_1.port='502'
uci set modbus.device_1.slave_id='1'
uci set modbus.device_1.period='60'
uci set modbus.device_1.timeout='5'

# Device 2 - 192.168.1.11
uci set modbus.device_2=device
uci set modbus.device_2.name='Nivus_002'
uci set modbus.device_2.enabled='1'
uci set modbus.device_2.protocol='tcp'
uci set modbus.device_2.ip='192.168.1.11'
uci set modbus.device_2.port='502'
uci set modbus.device_2.slave_id='1'
uci set modbus.device_2.period='60'
uci set modbus.device_2.timeout='5'

# Device 3 - 192.168.1.12
uci set modbus.device_3=device
uci set modbus.device_3.name='Nivus_003'
uci set modbus.device_3.enabled='1'
uci set modbus.device_3.protocol='tcp'
uci set modbus.device_3.ip='192.168.1.12'
uci set modbus.device_3.port='502'
uci set modbus.device_3.slave_id='1'
uci set modbus.device_3.period='60'
uci set modbus.device_3.timeout='5'

# Device 4 - 192.168.1.13
uci set modbus.device_4=device
uci set modbus.device_4.name='Nivus_004'
uci set modbus.device_4.enabled='1'
uci set modbus.device_4.protocol='tcp'
uci set modbus.device_4.ip='192.168.1.13'
uci set modbus.device_4.port='502'
uci set modbus.device_4.slave_id='1'
uci set modbus.device_4.period='60'
uci set modbus.device_4.timeout='5'

# Device 5 - 192.168.1.14
uci set modbus.device_5=device
uci set modbus.device_5.name='Nivus_005'
uci set modbus.device_5.enabled='1'
uci set modbus.device_5.protocol='tcp'
uci set modbus.device_5.ip='192.168.1.14'
uci set modbus.device_5.port='502'
uci set modbus.device_5.slave_id='1'
uci set modbus.device_5.period='60'
uci set modbus.device_5.timeout='5'

# Device 6 - 192.168.1.15
uci set modbus.device_6=device
uci set modbus.device_6.name='Nivus_006'
uci set modbus.device_6.enabled='1'
uci set modbus.device_6.protocol='tcp'
uci set modbus.device_6.ip='192.168.1.15'
uci set modbus.device_6.port='502'
uci set modbus.device_6.slave_id='1'
uci set modbus.device_6.period='60'
uci set modbus.device_6.timeout='5'

# Register requests for Device 1
uci set modbus.req_1_flow=request && uci set modbus.req_1_flow.device='device_1' && uci set modbus.req_1_flow.name='flow_rate' && uci set modbus.req_1_flow.function='3' && uci set modbus.req_1_flow.first_reg='1' && uci set modbus.req_1_flow.reg_count='2' && uci set modbus.req_1_flow.data_type='32bit_float_cdab'
uci set modbus.req_1_total=request && uci set modbus.req_1_total.device='device_1' && uci set modbus.req_1_total.name='totalizer' && uci set modbus.req_1_total.function='3' && uci set modbus.req_1_total.first_reg='3' && uci set modbus.req_1_total.reg_count='2' && uci set modbus.req_1_total.data_type='32bit_float_cdab'
uci set modbus.req_1_temp=request && uci set modbus.req_1_temp.device='device_1' && uci set modbus.req_1_temp.name='temperature' && uci set modbus.req_1_temp.function='3' && uci set modbus.req_1_temp.first_reg='5' && uci set modbus.req_1_temp.reg_count='2' && uci set modbus.req_1_temp.data_type='32bit_float_cdab'
uci set modbus.req_1_level=request && uci set modbus.req_1_level.device='device_1' && uci set modbus.req_1_level.name='water_level' && uci set modbus.req_1_level.function='3' && uci set modbus.req_1_level.first_reg='7' && uci set modbus.req_1_level.reg_count='2' && uci set modbus.req_1_level.data_type='32bit_float_cdab'
uci set modbus.req_1_vel=request && uci set modbus.req_1_vel.device='device_1' && uci set modbus.req_1_vel.name='velocity' && uci set modbus.req_1_vel.function='3' && uci set modbus.req_1_vel.first_reg='9' && uci set modbus.req_1_vel.reg_count='2' && uci set modbus.req_1_vel.data_type='32bit_float_cdab'

# Register requests for Device 2
uci set modbus.req_2_flow=request && uci set modbus.req_2_flow.device='device_2' && uci set modbus.req_2_flow.name='flow_rate' && uci set modbus.req_2_flow.function='3' && uci set modbus.req_2_flow.first_reg='1' && uci set modbus.req_2_flow.reg_count='2' && uci set modbus.req_2_flow.data_type='32bit_float_cdab'
uci set modbus.req_2_total=request && uci set modbus.req_2_total.device='device_2' && uci set modbus.req_2_total.name='totalizer' && uci set modbus.req_2_total.function='3' && uci set modbus.req_2_total.first_reg='3' && uci set modbus.req_2_total.reg_count='2' && uci set modbus.req_2_total.data_type='32bit_float_cdab'
uci set modbus.req_2_temp=request && uci set modbus.req_2_temp.device='device_2' && uci set modbus.req_2_temp.name='temperature' && uci set modbus.req_2_temp.function='3' && uci set modbus.req_2_temp.first_reg='5' && uci set modbus.req_2_temp.reg_count='2' && uci set modbus.req_2_temp.data_type='32bit_float_cdab'
uci set modbus.req_2_level=request && uci set modbus.req_2_level.device='device_2' && uci set modbus.req_2_level.name='water_level' && uci set modbus.req_2_level.function='3' && uci set modbus.req_2_level.first_reg='7' && uci set modbus.req_2_level.reg_count='2' && uci set modbus.req_2_level.data_type='32bit_float_cdab'
uci set modbus.req_2_vel=request && uci set modbus.req_2_vel.device='device_2' && uci set modbus.req_2_vel.name='velocity' && uci set modbus.req_2_vel.function='3' && uci set modbus.req_2_vel.first_reg='9' && uci set modbus.req_2_vel.reg_count='2' && uci set modbus.req_2_vel.data_type='32bit_float_cdab'

# Register requests for Device 3
uci set modbus.req_3_flow=request && uci set modbus.req_3_flow.device='device_3' && uci set modbus.req_3_flow.name='flow_rate' && uci set modbus.req_3_flow.function='3' && uci set modbus.req_3_flow.first_reg='1' && uci set modbus.req_3_flow.reg_count='2' && uci set modbus.req_3_flow.data_type='32bit_float_cdab'
uci set modbus.req_3_total=request && uci set modbus.req_3_total.device='device_3' && uci set modbus.req_3_total.name='totalizer' && uci set modbus.req_3_total.function='3' && uci set modbus.req_3_total.first_reg='3' && uci set modbus.req_3_total.reg_count='2' && uci set modbus.req_3_total.data_type='32bit_float_cdab'
uci set modbus.req_3_temp=request && uci set modbus.req_3_temp.device='device_3' && uci set modbus.req_3_temp.name='temperature' && uci set modbus.req_3_temp.function='3' && uci set modbus.req_3_temp.first_reg='5' && uci set modbus.req_3_temp.reg_count='2' && uci set modbus.req_3_temp.data_type='32bit_float_cdab'
uci set modbus.req_3_level=request && uci set modbus.req_3_level.device='device_3' && uci set modbus.req_3_level.name='water_level' && uci set modbus.req_3_level.function='3' && uci set modbus.req_3_level.first_reg='7' && uci set modbus.req_3_level.reg_count='2' && uci set modbus.req_3_level.data_type='32bit_float_cdab'
uci set modbus.req_3_vel=request && uci set modbus.req_3_vel.device='device_3' && uci set modbus.req_3_vel.name='velocity' && uci set modbus.req_3_vel.function='3' && uci set modbus.req_3_vel.first_reg='9' && uci set modbus.req_3_vel.reg_count='2' && uci set modbus.req_3_vel.data_type='32bit_float_cdab'

# Register requests for Device 4
uci set modbus.req_4_flow=request && uci set modbus.req_4_flow.device='device_4' && uci set modbus.req_4_flow.name='flow_rate' && uci set modbus.req_4_flow.function='3' && uci set modbus.req_4_flow.first_reg='1' && uci set modbus.req_4_flow.reg_count='2' && uci set modbus.req_4_flow.data_type='32bit_float_cdab'
uci set modbus.req_4_total=request && uci set modbus.req_4_total.device='device_4' && uci set modbus.req_4_total.name='totalizer' && uci set modbus.req_4_total.function='3' && uci set modbus.req_4_total.first_reg='3' && uci set modbus.req_4_total.reg_count='2' && uci set modbus.req_4_total.data_type='32bit_float_cdab'
uci set modbus.req_4_temp=request && uci set modbus.req_4_temp.device='device_4' && uci set modbus.req_4_temp.name='temperature' && uci set modbus.req_4_temp.function='3' && uci set modbus.req_4_temp.first_reg='5' && uci set modbus.req_4_temp.reg_count='2' && uci set modbus.req_4_temp.data_type='32bit_float_cdab'
uci set modbus.req_4_level=request && uci set modbus.req_4_level.device='device_4' && uci set modbus.req_4_level.name='water_level' && uci set modbus.req_4_level.function='3' && uci set modbus.req_4_level.first_reg='7' && uci set modbus.req_4_level.reg_count='2' && uci set modbus.req_4_level.data_type='32bit_float_cdab'
uci set modbus.req_4_vel=request && uci set modbus.req_4_vel.device='device_4' && uci set modbus.req_4_vel.name='velocity' && uci set modbus.req_4_vel.function='3' && uci set modbus.req_4_vel.first_reg='9' && uci set modbus.req_4_vel.reg_count='2' && uci set modbus.req_4_vel.data_type='32bit_float_cdab'

# Register requests for Device 5
uci set modbus.req_5_flow=request && uci set modbus.req_5_flow.device='device_5' && uci set modbus.req_5_flow.name='flow_rate' && uci set modbus.req_5_flow.function='3' && uci set modbus.req_5_flow.first_reg='1' && uci set modbus.req_5_flow.reg_count='2' && uci set modbus.req_5_flow.data_type='32bit_float_cdab'
uci set modbus.req_5_total=request && uci set modbus.req_5_total.device='device_5' && uci set modbus.req_5_total.name='totalizer' && uci set modbus.req_5_total.function='3' && uci set modbus.req_5_total.first_reg='3' && uci set modbus.req_5_total.reg_count='2' && uci set modbus.req_5_total.data_type='32bit_float_cdab'
uci set modbus.req_5_temp=request && uci set modbus.req_5_temp.device='device_5' && uci set modbus.req_5_temp.name='temperature' && uci set modbus.req_5_temp.function='3' && uci set modbus.req_5_temp.first_reg='5' && uci set modbus.req_5_temp.reg_count='2' && uci set modbus.req_5_temp.data_type='32bit_float_cdab'
uci set modbus.req_5_level=request && uci set modbus.req_5_level.device='device_5' && uci set modbus.req_5_level.name='water_level' && uci set modbus.req_5_level.function='3' && uci set modbus.req_5_level.first_reg='7' && uci set modbus.req_5_level.reg_count='2' && uci set modbus.req_5_level.data_type='32bit_float_cdab'
uci set modbus.req_5_vel=request && uci set modbus.req_5_vel.device='device_5' && uci set modbus.req_5_vel.name='velocity' && uci set modbus.req_5_vel.function='3' && uci set modbus.req_5_vel.first_reg='9' && uci set modbus.req_5_vel.reg_count='2' && uci set modbus.req_5_vel.data_type='32bit_float_cdab'

# Register requests for Device 6
uci set modbus.req_6_flow=request && uci set modbus.req_6_flow.device='device_6' && uci set modbus.req_6_flow.name='flow_rate' && uci set modbus.req_6_flow.function='3' && uci set modbus.req_6_flow.first_reg='1' && uci set modbus.req_6_flow.reg_count='2' && uci set modbus.req_6_flow.data_type='32bit_float_cdab'
uci set modbus.req_6_total=request && uci set modbus.req_6_total.device='device_6' && uci set modbus.req_6_total.name='totalizer' && uci set modbus.req_6_total.function='3' && uci set modbus.req_6_total.first_reg='3' && uci set modbus.req_6_total.reg_count='2' && uci set modbus.req_6_total.data_type='32bit_float_cdab'
uci set modbus.req_6_temp=request && uci set modbus.req_6_temp.device='device_6' && uci set modbus.req_6_temp.name='temperature' && uci set modbus.req_6_temp.function='3' && uci set modbus.req_6_temp.first_reg='5' && uci set modbus.req_6_temp.reg_count='2' && uci set modbus.req_6_temp.data_type='32bit_float_cdab'
uci set modbus.req_6_level=request && uci set modbus.req_6_level.device='device_6' && uci set modbus.req_6_level.name='water_level' && uci set modbus.req_6_level.function='3' && uci set modbus.req_6_level.first_reg='7' && uci set modbus.req_6_level.reg_count='2' && uci set modbus.req_6_level.data_type='32bit_float_cdab'
uci set modbus.req_6_vel=request && uci set modbus.req_6_vel.device='device_6' && uci set modbus.req_6_vel.name='velocity' && uci set modbus.req_6_vel.function='3' && uci set modbus.req_6_vel.first_reg='9' && uci set modbus.req_6_vel.reg_count='2' && uci set modbus.req_6_vel.data_type='32bit_float_cdab'

# Commit and restart
uci commit modbus
/etc/init.d/modbus_client restart

# Test connectivity
ping -c 1 192.168.1.10
ping -c 1 192.168.1.11
ping -c 1 192.168.1.12
ping -c 1 192.168.1.13
ping -c 1 192.168.1.14
ping -c 1 192.168.1.15

# Verify config
uci show modbus | grep -E 'device_[1-6]'
"@

    Write-Host $allCommands
    exit 1
}

Write-Host "Using plink at: $plink" -ForegroundColor Green

function Run-SSH {
    param([string]$Command)
    Write-Host "Running: $Command" -ForegroundColor Cyan
    $result = & $plink -ssh -l $TRB_USER -pw $TRB_PASS $TRB_IP $Command 2>&1
    if ($result) { Write-Host $result }
    return $result
}

# Rest of script continues...
Write-Host "`n=== Configuring TRB246 for 6 Nivus transmitters ===" -ForegroundColor Yellow

Run-SSH "uci delete modbus 2>/dev/null; echo 'Config cleared'"

# Configure all 6 devices
for ($i = 1; $i -le 6; $i++) {
    $ip = "192.168.1.$($i + 9)"
    Write-Host "Configuring device_$i at $ip..." -ForegroundColor Cyan
    Run-SSH "uci set modbus.device_$i=device; uci set modbus.device_$i.name='Nivus_00$i'; uci set modbus.device_$i.enabled='1'; uci set modbus.device_$i.protocol='tcp'; uci set modbus.device_$i.ip='$ip'; uci set modbus.device_$i.port='502'; uci set modbus.device_$i.slave_id='1'; uci set modbus.device_$i.period='60'; uci set modbus.device_$i.timeout='5'"
}

# Configure register requests
for ($i = 1; $i -le 6; $i++) {
    Write-Host "Configuring registers for device_$i..." -ForegroundColor Cyan
    Run-SSH "uci set modbus.req_${i}_flow=request; uci set modbus.req_${i}_flow.device='device_$i'; uci set modbus.req_${i}_flow.name='flow_rate'; uci set modbus.req_${i}_flow.function='3'; uci set modbus.req_${i}_flow.first_reg='1'; uci set modbus.req_${i}_flow.reg_count='2'; uci set modbus.req_${i}_flow.data_type='32bit_float_cdab'"
    Run-SSH "uci set modbus.req_${i}_total=request; uci set modbus.req_${i}_total.device='device_$i'; uci set modbus.req_${i}_total.name='totalizer'; uci set modbus.req_${i}_total.function='3'; uci set modbus.req_${i}_total.first_reg='3'; uci set modbus.req_${i}_total.reg_count='2'; uci set modbus.req_${i}_total.data_type='32bit_float_cdab'"
    Run-SSH "uci set modbus.req_${i}_temp=request; uci set modbus.req_${i}_temp.device='device_$i'; uci set modbus.req_${i}_temp.name='temperature'; uci set modbus.req_${i}_temp.function='3'; uci set modbus.req_${i}_temp.first_reg='5'; uci set modbus.req_${i}_temp.reg_count='2'; uci set modbus.req_${i}_temp.data_type='32bit_float_cdab'"
    Run-SSH "uci set modbus.req_${i}_level=request; uci set modbus.req_${i}_level.device='device_$i'; uci set modbus.req_${i}_level.name='water_level'; uci set modbus.req_${i}_level.function='3'; uci set modbus.req_${i}_level.first_reg='7'; uci set modbus.req_${i}_level.reg_count='2'; uci set modbus.req_${i}_level.data_type='32bit_float_cdab'"
    Run-SSH "uci set modbus.req_${i}_vel=request; uci set modbus.req_${i}_vel.device='device_$i'; uci set modbus.req_${i}_vel.name='velocity'; uci set modbus.req_${i}_vel.function='3'; uci set modbus.req_${i}_vel.first_reg='9'; uci set modbus.req_${i}_vel.reg_count='2'; uci set modbus.req_${i}_vel.data_type='32bit_float_cdab'"
}

Run-SSH "uci commit modbus"
Run-SSH "/etc/init.d/modbus_client restart"

Write-Host "`n=== Configuration complete! ===" -ForegroundColor Green
