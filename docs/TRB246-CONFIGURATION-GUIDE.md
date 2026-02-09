# Teltonika TRB246 Configuration Guide for FluxIO

Complete setup guide for connecting Nivus flow transmitters to FluxIO via TRB246 gateway.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Device Access](#initial-device-access)
3. [Network Configuration](#network-configuration)
4. [Modbus Configuration](#modbus-configuration)
5. [Data to Server Configuration](#data-to-server-configuration)
6. [Testing the Connection](#testing-the-connection)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] TRB246 gateway with firmware 7.x or later
- [ ] SIM card with active data plan (if using cellular)
- [ ] Nivus flow transmitter with Modbus RTU/TCP enabled
- [ ] RS-485 cable (for Modbus RTU connection)
- [ ] Computer with Ethernet port
- [ ] FluxIO API endpoint URL and API key

### Required Information

| Item | Value | Notes |
|------|-------|-------|
| FluxIO API URL | `https://your-domain.vercel.app/api/ingest` | Your deployed FluxIO URL |
| API Key | `your-api-secret-key` | From `.env` file (`API_SECRET_KEY`) |
| Device ID | `TRB246-001` | Unique identifier for this gateway |
| Modbus Slave ID | `1` | Default Nivus address |

---

## Initial Device Access

### Step 1: Physical Connection

1. Connect the TRB246 to your computer via Ethernet cable
2. Connect power supply (9-30V DC) to the TRB246
3. Wait for the device to boot (LED indicators will stabilize)

### Step 2: Access Web Interface

1. Set your computer's IP to `192.168.2.x` (e.g., `192.168.2.100`)
2. Open browser and navigate to: `http://192.168.2.1`
3. Default credentials:
   - **Username:** `admin`
   - **Password:** (printed on device label, or `admin01` for older firmware)

### Step 3: Initial Setup Wizard

1. Change the default password (required)
2. Set timezone to your local timezone
3. Skip other wizard steps for now (we'll configure manually)

---

## Network Configuration

### Option A: Cellular Connection (Recommended for Remote Sites)

1. Navigate to: **Network > Mobile**
2. Insert SIM card and configure:

```
APN: [Your carrier's APN]
Authentication: None (or PAP/CHAP if required)
PIN: [SIM PIN if set]
```

3. Click **Save & Apply**
4. Verify connection in **Status > Network > Mobile**

### Option B: Ethernet/WAN Connection

1. Navigate to: **Network > WAN**
2. Configure as needed:
   - **Protocol:** DHCP or Static IP
   - **Gateway:** Your network gateway
   - **DNS:** 8.8.8.8, 8.8.4.4

3. Click **Save & Apply**

### Verify Internet Connectivity

1. Navigate to: **System > Administration > Troubleshoot**
2. Run ping test to `8.8.8.8`
3. Run ping test to your FluxIO domain

---

## Modbus Configuration

### RS-485 Wiring (Nivus to TRB246)

Connect the Nivus transmitter to TRB246 RS-485 port:

```
Nivus Terminal    TRB246 Terminal
─────────────────────────────────
A+ (Data+)   -->  A (Pin 3)
B- (Data-)   -->  B (Pin 4)
GND          -->  GND (Pin 5)
```

### Configure RS-485 Serial Port

1. Navigate to: **Services > Serial Utilities > RS232/RS485**
2. Click **Add** to create new serial configuration:

```
Name: Nivus_RS485
Enabled: Yes
RS Type: RS485
Baud Rate: 9600 (match Nivus settings)
Data Bits: 8
Parity: None
Stop Bits: 1
Flow Control: None
```

3. Click **Save & Apply**

### Configure Modbus Master

1. Navigate to: **Services > Modbus > Modbus TCP Master** (or RTU Master)
2. Click **Add** to create new Modbus configuration:

**For Modbus RTU:**
```
Name: Nivus_Modbus
Enabled: Yes
Connection Type: Serial
Serial Device: /dev/rs485
Baud Rate: 9600
Data Bits: 8
Parity: None
Stop Bits: 1
Slave ID: 1
```

**For Modbus TCP:**
```
Name: Nivus_Modbus
Enabled: Yes
Connection Type: TCP
IP Address: [Nivus IP if using TCP]
Port: 502
Slave ID: 1
```

3. Click **Save & Apply**

### Configure Modbus Registers

Add register requests for Nivus data. Navigate to **Modbus > Modbus Data Requests**:

| Register Name | Register Address | Data Type | Function | Description |
|---------------|------------------|-----------|----------|-------------|
| flow_rate | 40001 | Float32 | 3 (Read Holding) | Current flow rate (m3/h) |
| totalizer | 40003 | Float32 | 3 (Read Holding) | Total volume (m3) |
| velocity | 40005 | Float32 | 3 (Read Holding) | Flow velocity (m/s) |
| level | 40007 | Float32 | 3 (Read Holding) | Water level (mm) |
| temperature | 40009 | Float32 | 3 (Read Holding) | Temperature (C) |

**Note:** Register addresses vary by Nivus model. Consult your Nivus documentation for exact addresses.

Example configuration for each register:
```
Name: flow_rate
Slave ID: 1
Function: Read Holding Registers (3)
First Register: 0 (or 40001 depending on addressing mode)
Number of Registers: 2
Data Type: 32bit Float, Big Endian
Period: 30 (seconds)
```

---

## Data to Server Configuration

### Configure HTTP POST to FluxIO

1. Navigate to: **Services > Data to Server**
2. Click **Add** to create new data sender:

```
Name: FluxIO_Sender
Enabled: Yes
Protocol: HTTP(S)
URL: https://your-domain.vercel.app/api/ingest
Method: POST
```

### HTTP Headers Configuration

Add the following headers:

```
Content-Type: application/json
x-api-key: your-api-secret-key
```

### JSON Payload Configuration

Configure the JSON format using Teltonika's format syntax:

```json
{
  "device_id": "TRB246-001",
  "flow_rate": %flow_rate%,
  "totalizer": %totalizer%,
  "temperature": %temperature%,
  "signal_strength": %signal%,
  "timestamp": "%timestamp%"
}
```

**Full Configuration:**
```
Data Format: Custom
Content: {"device_id":"TRB246-001","flow_rate":%flow_rate%,"totalizer":%totalizer%,"temperature":%temperature%,"signal_strength":%GSM_SIGNAL%,"timestamp":"%TIME_UTC%"}
Period: 60 (seconds)
Retry on Fail: Yes
Retry Period: 30
Retry Count: 3
```

### Alternative: Using Data to Server with Modbus Data

For newer firmware versions:

1. Navigate to: **Services > Data to Server**
2. Select **Data Source:** Modbus
3. Configure collection:

```
Name: FluxIO_Collection
Enabled: Yes

# Server Settings
Protocol: HTTPS
Server: your-domain.vercel.app
Port: 443
Path: /api/ingest
Method: POST

# Authentication
Headers:
  x-api-key: your-api-secret-key
  Content-Type: application/json

# Data Settings
Data Source: Modbus
Collection Period: 60 seconds
Send on Change: Yes

# Format
JSON Format: Custom
Template: See below
```

**Custom JSON Template:**
```json
{
  "device_id": "${SERIAL}",
  "flow_rate": ${modbus.flow_rate},
  "totalizer": ${modbus.totalizer},
  "temperature": ${modbus.temperature},
  "signal_strength": ${GSM_SIGNAL},
  "battery_level": ${input.analog1},
  "timestamp": "${TIMESTAMP_ISO}"
}
```

---

## Testing the Connection

### Step 1: Verify Modbus Communication

1. Navigate to: **Services > Modbus > Modbus Data**
2. Check that register values are being read
3. Values should update according to your configured period

### Step 2: Test HTTP Connection

1. Navigate to: **System > Administration > Troubleshoot**
2. Use the custom command feature to test:

```bash
curl -X POST https://your-domain.vercel.app/api/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-secret-key" \
  -d '{"device_id":"TRB246-001","flow_rate":123.45,"totalizer":9876.54}'
```

3. Expected response:
```json
{
  "success": true,
  "message": "Data ingested successfully",
  "results": [{"device_id": "TRB246-001", "success": true}]
}
```

### Step 3: Monitor Data to Server Status

1. Navigate to: **Status > Data to Server**
2. Check for:
   - Connection status: Connected
   - Last send: Recent timestamp
   - Success rate: Should be high percentage

### Step 4: Verify in FluxIO Dashboard

1. Open FluxIO dashboard: `https://your-domain.vercel.app`
2. Navigate to Devices page
3. Your TRB246 device should appear
4. Check flow data is being received

---

## Troubleshooting

### Connection Issues

| Problem | Possible Cause | Solution |
|---------|---------------|----------|
| No cellular connection | SIM not activated | Contact carrier to verify SIM |
| Cannot reach FluxIO | Firewall blocking | Check firewall rules |
| 401 Unauthorized | Wrong API key | Verify x-api-key header matches API_SECRET_KEY |
| 400 Bad Request | Invalid JSON | Check JSON format and required fields |

### Modbus Issues

| Problem | Possible Cause | Solution |
|---------|---------------|----------|
| No Modbus data | Wrong wiring | Check A+/B- connections |
| CRC errors | Baud rate mismatch | Match baud rate to Nivus settings |
| Timeout errors | Wrong slave ID | Verify Nivus Modbus address |
| Wrong values | Endianness issue | Try different byte order settings |

### Data Not Appearing in FluxIO

1. **Check device_id:** Must match a registered device in FluxIO
2. **Check timestamp:** Use ISO 8601 format
3. **Check API logs:** Look for errors in Vercel deployment logs
4. **Verify data format:** At least one measurement field required

### Debug Commands (via SSH)

```bash
# Check Modbus daemon status
/etc/init.d/modbusd status

# View Modbus logs
logread | grep modbus

# Test serial port
stty -F /dev/rs485

# Check Data to Server logs
logread | grep sender
```

---

## Advanced Configuration

### Multiple Devices

If connecting multiple Nivus transmitters:

1. Use Modbus TCP with different IP addresses, or
2. Use different Modbus slave IDs on RS-485 bus
3. Create separate Data to Server entries with unique device_id values

### Offline Data Buffering

1. Navigate to: **Services > Data to Server > Advanced**
2. Enable **Offline Mode**
3. Configure buffer size (number of records to store)
4. Data will be sent when connection is restored

### Secure Connection (TLS)

1. Use HTTPS URL for FluxIO API
2. TRB246 supports TLS 1.2/1.3
3. For self-signed certificates, upload CA certificate in **System > Certificates**

### SMS Alerts (Optional)

1. Navigate to: **Services > SMS Utilities > SMS Rules**
2. Create rule to send SMS when Modbus value exceeds threshold
3. Configure recipient phone numbers

---

## Quick Reference

### FluxIO API Endpoint
```
POST https://your-domain.vercel.app/api/ingest
```

### Required Headers
```
Content-Type: application/json
x-api-key: your-api-secret-key
```

### Minimum JSON Payload
```json
{
  "device_id": "TRB246-001",
  "flow_rate": 123.45
}
```

### Full JSON Payload
```json
{
  "device_id": "TRB246-001",
  "flow_rate": 123.45,
  "totalizer": 9876.54,
  "temperature": 25.3,
  "pressure": 1.5,
  "battery_level": 85,
  "signal_strength": -67,
  "timestamp": "2025-01-26T10:30:00Z",
  "metadata": {
    "firmware": "7.04.2",
    "location": "Site A"
  }
}
```

---

## Support Resources

- [Teltonika TRB246 Wiki](https://wiki.teltonika-networks.com/view/TRB246)
- [Teltonika Modbus Configuration](https://wiki.teltonika-networks.com/view/TRB246_Modbus)
- [Nivus Modbus Documentation](https://www.nivus.com)
- FluxIO Issues: https://github.com/chatgptnotes/fluxio/issues

---

Version 1.3 | January 26, 2025 | github.com/chatgptnotes/fluxio
