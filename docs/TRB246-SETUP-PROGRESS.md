# TRB246 Setup Progress - Resume Point

**Last Updated:** January 28, 2026, 6:36 PM
**Status:** IN PROGRESS - Stuck on HTTPS/SSL configuration

---

## What Has Been Done

1. **Firmware upgraded** to TRB2M_R_00.07.19.4 (latest)
2. **SIM card configured** - JIO 4G LTE connection working
3. **Device registered in Supabase** - TRB246-001 exists in devices table
4. **Data to Server collection created** - Named "collection1"

### Current Configuration

**Data Input:**
- Name: Supabese
- Type: Base
- Format type: Custom
- Format string: `{"device_id":"TRB246-001","flow_rate":0,"totalizer":0}`

**Collection Settings:**
- Enable: ON
- Period: 60 seconds
- Retry: ON
- Format type: JSON

**Server Configuration:**
- Server address: `https://aynoltymgusyasgxshng.supabase.co/rest/v1/flow_data`
- HTTP Headers:
  - `apikey: YOUR_SUPABASE_SERVICE_ROLE_KEY`
  - `Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY`
  - `Content-Type: application/json`
  - `Prefer: return=minimal`

---

## Current Issue

**Problem:** HTTPS/SSL configuration failing

When "Enable secure connection" is ON with "Certificate files from device" ON:
- TRB246 requires Client certificate and Client private keyfile
- Supabase doesn't need client certificates (only server verification)
- Configuration fails to save with "Some fields are invalid"

When "Enable secure connection" is OFF:
- URL uses HTTP instead of HTTPS
- TRB246 reports success but data doesn't reach Supabase
- Supabase requires HTTPS for API calls

---

## Resume Steps

### Option 1: Try with Enable secure connection OFF but HTTPS URL

1. Go to **Services > Data to Server**
2. Edit **collection1** > **Server configuration**
3. Set:
   - Server address: `https://aynoltymgusyasgxshng.supabase.co/rest/v1/flow_data`
   - Enable secure connection: **OFF**
4. Save & Apply
5. Check if data appears in Supabase flow_data table

### Option 2: Use FlowNexus API endpoint instead

Instead of direct Supabase, use the FlowNexus Next.js API:

1. Deploy FlowNexus to Vercel first
2. Configure TRB246 to send to: `https://your-flownexus-app.vercel.app/api/ingest`
3. Use header: `x-api-key: your-api-secret-key`
4. The API will forward data to Supabase

### Option 3: Contact Teltonika support

Ask about proper HTTPS configuration for Supabase REST API without client certificates.

---

## Supabase Details

- **Project URL:** `https://aynoltymgusyasgxshng.supabase.co`
- **Project ID:** aynoltymgusyasgxshng
- **Table:** flow_data
- **Service Role Key:** YOUR_SUPABASE_SERVICE_ROLE_KEY

---

## Files Created During Setup

- `docs/TRB246-CONFIGURATION-GUIDE.md` - Full configuration guide
- `scripts/test-trb246-connection.ps1` - PowerShell test script
- `scripts/setup-tbr246-device.sql` - SQL for device registration

---

## Quick Test Command

After configuration, test with this SQL in Supabase:

```sql
SELECT * FROM flow_data
WHERE device_id = 'TRB246-001'
ORDER BY created_at DESC
LIMIT 5;
```

---

Version 1.4 | January 28, 2026 | github.com/chatgptnotes/flownexus
