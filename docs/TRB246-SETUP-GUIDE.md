# TRB246 End-to-End Test Setup Guide

This guide walks through setting up a complete test environment for the FluxIO IIoT platform using a Modbus TCP simulator on your laptop and the TRB246 gateway.

## Test Architecture

```
+-------------------------+        +-----------------+        +------------------+
|  Laptop                 |        |  TRB246         |        |  FluxIO Cloud    |
|  (Modbus TCP Simulator) | <----> |  Gateway        | -----> |  (Vercel)        |
|  192.168.2.100:502      |  ETH   |  192.168.2.1    |  4G    |  www.fluxio.work |
|  Simulates Nivus data   |        |  Reads & Sends  |        |  Stores data     |
+-------------------------+        +-----------------+        +------------------+
```

---

## Prerequisites

- Windows laptop with Python 3.8+
- TRB246 gateway with SIM card (for 4G connectivity)
- Ethernet cable
- Access to TRB246 web interface

---

## Part 1: Laptop Setup (Modbus TCP Simulator)

### Step 1.1: Install Python Dependencies

Open PowerShell or Command Prompt:

```powershell
pip install pymodbus
```

### Step 1.2: Configure Static IP Address

1. Open **Network Connections** (ncpa.cpl)
2. Right-click your Ethernet adapter > **Properties**
3. Select **Internet Protocol Version 4 (TCP/IPv4)** > **Properties**
4. Select **Use the following IP address**:
   - IP address: `192.168.2.100`
   - Subnet mask: `255.255.255.0`
   - Default gateway: (leave empty)
5. Click **OK** to save

### Step 1.3: Configure Windows Firewall

Allow inbound connections on port 502:

1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** > **New Rule**
3. Select **Port** > **Next**
4. Select **TCP** and enter port `502` > **Next**
5. Select **Allow the connection** > **Next**
6. Check all profiles (Domain, Private, Public) > **Next**
7. Name: `Modbus TCP Simulator` > **Finish**

Alternatively, run in PowerShell (Administrator):
```powershell
New-NetFirewallRule -DisplayName "Modbus TCP Simulator" -Direction Inbound -Protocol TCP -LocalPort 502 -Action Allow
```

### Step 1.4: Run the Simulator

Navigate to the FluxIO project directory:

```powershell
cd "D:\flowmeter Project\fluxio"
python scripts/modbus-simulator.py
```

If you get a permission error for port 502, either:
- Run as Administrator, or
- Use a different port: `python scripts/modbus-simulator.py --port 5020`

You should see output like:
```
======================================================================
  NIVUS FLOW TRANSMITTER SIMULATOR
  Modbus TCP Server for TRB246 Testing
======================================================================

  Server Address:  0.0.0.0:502
  Unit ID:         1

  Register Map (Holding Registers, Function Code 3):
  --------------------------------------------------
  | Register     | Address | Type    | Description      |
  --------------------------------------------------
  | flow_rate    | 0-1     | Float32 | Flow rate (m3/h) |
  | totalizer    | 2-3     | Float32 | Total vol (m3)   |
  | temperature  | 4-5     | Float32 | Temp (C)         |
  | level        | 6-7     | Float32 | Water level (mm) |
  | velocity     | 8-9     | Float32 | Velocity (m/s)   |
  --------------------------------------------------

2026-01-29 12:00:00 | INFO    | Data updater started (interval: 5s)
2026-01-29 12:00:00 | INFO    | Updated: Flow= 118.45 m3/h | Total=  458920.1 m3 | Temp= 24.3 C | Level= 345.2 mm | Vel= 1.18 m/s
```

### Step 1.5: Test the Simulator Locally

Open a second terminal and run:

```powershell
python scripts/test-modbus-client.py
```

You should see the current simulated values.

---

## Part 2: Connect TRB246 to Laptop

### Step 2.1: Physical Connection

1. Connect an Ethernet cable between:
   - TRB246 **LAN** port
   - Laptop Ethernet port

2. Power on the TRB246 if not already on

### Step 2.2: Access TRB246 Web Interface

1. Open a web browser
2. Navigate to: `http://192.168.2.1`
3. Login with your credentials (default: admin/admin01)

### Step 2.3: Verify Connectivity

From TRB246 web interface:
1. Navigate to **System** > **Administration** > **Troubleshoot**
2. In the Ping section, enter: `192.168.2.100`
3. Click **Ping**
4. You should see successful responses

---

## Part 3: Configure TRB246 Modbus TCP Client

### Step 3.1: Enable Modbus TCP Client

1. Navigate to **Services** > **Modbus** > **Modbus TCP Client**
2. Click **Add** to create a new configuration

### Step 3.2: Configure Connection

| Field | Value |
|-------|-------|
| Name | `Nivus_Simulator` |
| Enabled | Yes (checked) |
| IP Address | `192.168.2.100` |
| Port | `502` |
| Period | `10` (seconds) |
| Timeout | `5` (seconds) |

### Step 3.3: Add Modbus Requests

Click **Add** under Requests for each register:

#### Request 1: Flow Rate
| Field | Value |
|-------|-------|
| Name | `flow_rate` |
| Enabled | Yes |
| Data Type | 32-bit Float (Big Endian / ABCD) |
| Function | 3 - Read Holding Registers |
| First Register | `0` |
| Register Count/Offset | `2` |

#### Request 2: Totalizer
| Field | Value |
|-------|-------|
| Name | `totalizer` |
| Enabled | Yes |
| Data Type | 32-bit Float (Big Endian / ABCD) |
| Function | 3 - Read Holding Registers |
| First Register | `2` |
| Register Count/Offset | `2` |

#### Request 3: Temperature
| Field | Value |
|-------|-------|
| Name | `temperature` |
| Enabled | Yes |
| Data Type | 32-bit Float (Big Endian / ABCD) |
| Function | 3 - Read Holding Registers |
| First Register | `4` |
| Register Count/Offset | `2` |

### Step 3.4: Save Configuration

Click **Save & Apply** at the bottom of the page.

### Step 3.5: Verify Modbus Data

1. Navigate to **Status** > **Modbus**
2. You should see:
   - Connection status: **Connected**
   - Last read time: Recent timestamp
   - Values updating every 10 seconds

---

## Part 4: Configure Data to Server (HTTP POST to FluxIO)

### Step 4.1: Create Data Sender

1. Navigate to **Services** > **Data to Server**
2. Click **Add** to create a new sender

### Step 4.2: Configure General Settings

| Field | Value |
|-------|-------|
| Name | `FluxIO_Cloud` |
| Enabled | Yes |
| URL/Host | `https://www.fluxio.work/api/ingest` |
| Protocol | HTTP(S) |
| Method | POST |

### Step 4.3: Configure Headers

Add these HTTP headers:

| Header Name | Value |
|-------------|-------|
| Content-Type | `application/json` |
| x-api-key | `fluxio_secure_key_2025_production` |

### Step 4.4: Configure Data Format

1. Set Format to **Custom**
2. Enter the JSON template:

```json
{
  "device_id": "TRB246-CSTPS-001",
  "flow_rate": %flow_rate%,
  "totalizer": %totalizer%,
  "temperature": %temperature%,
  "signal_strength": %GSM_SIGNAL%,
  "timestamp": "%TIME_UTC%"
}
```

Note: The `%variable%` placeholders will be replaced with actual Modbus values.

### Step 4.5: Configure Timing

| Field | Value |
|-------|-------|
| Period | `60` (seconds) |
| Retry on Fail | Yes |
| Retry Period | `30` (seconds) |
| Retry Count | `3` |

### Step 4.6: Save and Apply

Click **Save & Apply** to activate the configuration.

---

## Part 5: Verification

### Step 5.1: Check Modbus Status on TRB246

1. Navigate to **Status** > **Modbus**
2. Verify:
   - Connection: **Connected**
   - Last Read: Recent timestamp
   - Values match simulator output

### Step 5.2: Check Data to Server Status

1. Navigate to **Status** > **Data to Server**
2. Verify:
   - Status: **Connected** or **OK**
   - Last Send: Recent timestamp
   - No error messages

### Step 5.3: Check FluxIO Dashboard

1. Open: https://www.fluxio.work/cstps-pipeline
2. Look for device `TRB246-CSTPS-001`
3. Verify:
   - Device shows as **Online**
   - Flow data is updating
   - Values match simulator

### Step 5.4: Check Supabase (Optional)

If you have database access:

```sql
SELECT * FROM flow_data
WHERE device_id = 'TRB246-CSTPS-001'
ORDER BY timestamp DESC
LIMIT 10;
```

---

## Part 6: Troubleshooting

### Modbus Connection Failed

**Symptom:** TRB246 shows "Disconnected" or "Timeout" in Modbus status

**Solutions:**
1. Verify laptop IP is `192.168.2.100`
2. Verify simulator is running
3. Check Windows Firewall allows port 502
4. Ping from TRB246 to verify network connectivity
5. Try port 5020 if 502 has issues

### Data to Server Failed

**Symptom:** TRB246 shows errors in Data to Server status

**Solutions:**
1. Verify TRB246 has internet (4G) connectivity
2. Check the URL is exactly: `https://www.fluxio.work/api/ingest`
3. Verify API key header is correct
4. Check FluxIO API is responding:
   ```powershell
   curl -X POST "https://www.fluxio.work/api/ingest" -H "Content-Type: application/json" -H "x-api-key: fluxio_secure_key_2025_production" -d "{\"device_id\":\"test\",\"flow_rate\":100}"
   ```

### Values Not Updating

**Symptom:** Values are stuck or not changing

**Solutions:**
1. Check simulator console for update messages
2. Verify Modbus period setting (should be 10 seconds)
3. Restart the simulator
4. Restart TRB246 Modbus service

### Float Values Incorrect

**Symptom:** Values are garbage or very wrong numbers

**Solutions:**
1. Verify Data Type is "32-bit Float (Big Endian / ABCD)"
2. Some devices use different byte orders. Try:
   - Big Endian (ABCD) - most common
   - Little Endian (DCBA)
   - Mid-Big Endian (BADC)
   - Mid-Little Endian (CDAB)

---

## Part 7: Field Deployment

After successful testing, to deploy with real Nivus transmitter:

### Option A: Nivus with Modbus TCP (Ethernet)

1. Disconnect laptop from TRB246
2. Connect Nivus transmitter Ethernet to TRB246
3. Update TRB246 Modbus TCP Client:
   - Change IP to Nivus IP address
   - Verify port (usually 502)
   - Adjust register addresses if different

### Option B: Nivus with Modbus RTU (RS-485)

1. Navigate to **Services** > **Modbus** > **Modbus Serial Client**
2. Configure RS-485 parameters:
   - Baud Rate: 9600 (check Nivus manual)
   - Parity: None
   - Data Bits: 8
   - Stop Bits: 1
3. Add same register requests
4. Update Data to Server to use serial Modbus values

---

## Quick Reference

| Component | Value |
|-----------|-------|
| Laptop IP | 192.168.2.100 |
| TRB246 IP | 192.168.2.1 |
| Modbus Port | 502 |
| FluxIO API | https://www.fluxio.work/api/ingest |
| API Key | fluxio_secure_key_2025_production |
| Device ID | TRB246-CSTPS-001 |

---

## Test Commands

**Test API directly from laptop:**
```powershell
curl -X POST "https://www.fluxio.work/api/ingest" `
  -H "Content-Type: application/json" `
  -H "x-api-key: fluxio_secure_key_2025_production" `
  -d '{"device_id":"TRB246-CSTPS-001","flow_rate":125.5,"totalizer":458920,"temperature":25.3}'
```

**Test Modbus connectivity:**
```powershell
python scripts/test-modbus-client.py --host 127.0.0.1 --port 502
```

**Run simulator with custom settings:**
```powershell
python scripts/modbus-simulator.py --port 5020 --interval 10 --verbose
```

---

## Part 8: Custom Sender Script (Recommended)

The TRB246's built-in Data to Server service has issues with HTTPS redirects. For reliable data transmission, use the custom sender script approach.

### Step 8.1: Install the Sender Script (Windows PowerShell)

```powershell
# Navigate to scripts directory
cd "D:\flowmeter Project\fluxio\scripts"

# Run the complete setup script
.\setup-trb246-complete.ps1 -Password 'Lightyear@123'
```

Or install manually:

```powershell
# Copy script to TRB246
pscp -pw "Lightyear@123" fluxio_sender_db.sh root@192.168.1.2:/root/fluxio_sender.sh

# Make executable
plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "chmod +x /root/fluxio_sender.sh"

# Add to cron (runs every minute)
plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "echo '* * * * * /root/fluxio_sender.sh' >> /etc/crontabs/root"

# Restart cron
plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "/etc/init.d/cron restart"
```

### Step 8.2: Test the Sender

```powershell
# Manual test with verbose output
plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "/root/fluxio_sender.sh -v"
```

### Step 8.3: Monitor Logs

```powershell
# View recent logs
plink -ssh -l root -pw "Lightyear@123" 192.168.1.2 "logread | grep fluxio"
```

### Available Sender Scripts

| Script | Best For |
|--------|----------|
| `fluxio_sender_db.sh` | Direct database read (most reliable) |
| `fluxio_sender_simulator.sh` | Auto-detect device name |
| `fluxio_sender_simple.sh` | Single device, ubus interface |
| `fluxio_sender.sh` | Full featured, multi-device |

---

Version: 1.4 | February 1, 2026 | fluxio
