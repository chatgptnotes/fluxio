# TRB246 Configuration Scripts for FluxIO

This directory contains scripts to configure the Teltonika TRB246 gateway for the FluxIO IIoT platform.

## Quick Start

### Option 1: Windows (PowerShell) - Recommended

```powershell
# Step 1: Run diagnostics to see current state
.\diagnose-trb246.ps1 -Password 'Lightyear@123'

# Step 2: Configure Modbus devices
.\configure-trb246.ps1 -Password 'Lightyear@123'

# Step 3: Install the sender script (uses simulator version by default)
.\install-fluxio-sender.ps1 -Password 'Lightyear@123'

# Alternative: Use standard script for production devices
.\install-fluxio-sender.ps1 -Password 'Lightyear@123' -Script standard
```

### Option 2: Linux/macOS

```bash
# Configure Modbus and Data Sender via SSH
./configure-trb246.sh --host 192.168.1.2 --password 'Lightyear@123'

# Install the custom sender script (recommended due to TRB246 HTTPS issues)
./install-fluxio-sender.sh --host 192.168.1.2 --password 'Lightyear@123'
```

### Option 2: Manual Installation

1. SSH into the TRB246:
   ```bash
   ssh root@192.168.1.2
   # Password: Lightyear@123
   ```

2. Copy the sender script:
   ```bash
   # From your local machine
   scp scripts/fluxio_sender.sh root@192.168.1.2:/root/
   ```

3. Make it executable and add to cron:
   ```bash
   chmod +x /root/fluxio_sender.sh
   echo "* * * * * /root/fluxio_sender.sh" >> /etc/crontabs/root
   /etc/init.d/cron restart
   ```

## Files

| File | Description |
|------|-------------|
| `configure-trb246.sh` | Bash script to configure Modbus TCP and Data Sender |
| `configure-trb246.ps1` | PowerShell version for Windows |
| `diagnose-trb246.ps1` | Diagnostic script to check TRB246 configuration and connectivity |
| `fluxio_sender.sh` | Custom shell script for TRB246 to send data to FluxIO API |
| `fluxio_sender_simple.sh` | Simplified single-device version |
| `fluxio_sender_simulator.sh` | Auto-detecting version for simulator testing |
| `install-fluxio-sender.sh` | Automated installer for Linux/macOS |
| `install-fluxio-sender.ps1` | Automated installer for Windows (PowerShell) |
| `trb246-config.json` | JSON configuration backup (can import via Web UI) |

## Device Configuration

The scripts configure 6 Nivus 750 flow transmitters:

| Device ID | IP Address | Modbus Port | Slave ID |
|-----------|------------|-------------|----------|
| NIVUS_750_001 | 192.168.1.10 | 502 | 1 |
| NIVUS_750_002 | 192.168.1.11 | 502 | 1 |
| NIVUS_750_003 | 192.168.1.12 | 502 | 1 |
| NIVUS_750_004 | 192.168.1.13 | 502 | 1 |
| NIVUS_750_005 | 192.168.1.14 | 502 | 1 |
| NIVUS_750_006 | 192.168.1.15 | 502 | 1 |

## Modbus Register Map

Nivus 750 Modbus registers (1-based addressing for TRB246):

| Register | Address | Data Type | Field |
|----------|---------|-----------|-------|
| 1-2 | 40001 | Float32 | flow_rate (m3/h) |
| 3-4 | 40003 | Float32 | totalizer (m3) |
| 5-6 | 40005 | Float32 | temperature (C) |
| 7-8 | 40007 | Float32 | water_level (mm) |
| 9-10 | 40009 | Float32 | velocity (m/s) |

## TRB246 Gateway Details

- **Default IP:** 192.168.1.2
- **Username:** root (for SSH) or admin (for Web UI)
- **Password:** Lightyear@123
- **Web UI:** http://192.168.1.2

## Troubleshooting

### Check if data is being sent
```bash
# SSH into TRB246
ssh root@192.168.1.2

# View logs
logread | grep fluxio_sender

# Manual test
/root/fluxio_sender.sh

# Debug mode
DEBUG=1 /root/fluxio_sender.sh
```

### Check Modbus configuration
```bash
uci show modbus
```

### Check Data Sender configuration
```bash
uci show data_sender
```

### Restart services
```bash
/etc/init.d/modbus restart
/etc/init.d/data_sender restart
/etc/init.d/cron restart
```

### Known Issues

1. **TRB246 Data Sender HTTPS Redirect Issue**
   - The built-in data_sender does not follow HTTP 308 redirects
   - Solution: Use the custom `fluxio_sender.sh` script with cron instead

2. **Modbus Connection Timeout**
   - Ensure Nivus 750 devices are powered on and connected to network
   - Verify IP addresses are correct
   - Check firewall settings on the gateway

3. **Device Name Mismatch**
   - The sender script may use wrong device names
   - Use `diagnose-trb246.ps1` to check actual device names
   - The `fluxio_sender_simulator.sh` auto-detects device names

## Testing with Modbus Simulator

If you don't have actual Nivus 750 transmitters connected, use the Modbus simulator:

1. Start the Python simulator on your PC:
   ```bash
   cd scripts
   python modbus-simulator.py
   ```

2. Configure TRB246 to connect to your PC's IP (e.g., 192.168.1.100:502)

3. Use the simulator version of the sender:
   ```powershell
   .\install-fluxio-sender.ps1 -Password 'Lightyear@123' -Script simulator
   ```

## API Endpoint

The sender scripts send data to:
- **URL:** https://www.fluxio.work/api/ingest
- **Method:** POST
- **Authentication:** x-api-key header

## Supabase Direct Access (Backup)

If the FluxIO API is unavailable, configure direct Supabase access:
- **URL:** https://dzmiisuxwruoeklbkyzc.supabase.co/rest/v1/flow_data
- **Headers:**
  - `apikey: sb_publishable_ed4UwVUrD7rc2Qlx0Fp8sg_rdm3ctOL`
  - `Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY`
  - `Content-Type: application/json`

## Version

- **Version:** 1.4
- **Date:** 2026-02-01
- **Repository:** https://github.com/chatgptnotes/fluxio
