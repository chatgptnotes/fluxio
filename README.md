# FluxIO - IIoT Flow Monitoring Platform

A modern, real-time monitoring platform for Nivus flow transmitters with Teltonika gateway integration.

## Overview

FluxIO is a complete Industrial IoT (IIoT) solution that bridges the gap between your Nivus flow transmitters and the cloud. It provides:

- **Real-time data ingestion** from Teltonika TRB245 (or similar) gateways
- **Live dashboard** with WebSocket updates
- **Intelligent alerting** based on configurable rules
- **Historical analytics** with time-series data
- **Multi-device support** for scaling to hundreds of transmitters

## Architecture

```
┌─────────────────┐
│ Nivus Flow      │ RS485/Modbus
│ Transmitter     ├──────────┐
└─────────────────┘          │
                              │
┌─────────────────┐          │
│ Nivus Flow      │          │
│ Transmitter     ├──────────┤
└─────────────────┘          │
                              ▼
                    ┌──────────────────┐
                    │  Teltonika       │
                    │  TRB245 Gateway  │ 4G/LTE
                    │  (Modbus Master) ├────────────┐
                    └──────────────────┘            │
                                                     │ HTTPS/JSON
                                                     │
                                    ┌────────────────▼─────────────┐
                                    │                              │
                                    │   FluxIO Platform            │
                                    │   (Next.js + Supabase)       │
                                    │                              │
                                    │  ┌────────────────────────┐  │
                                    │  │  API Endpoints         │  │
                                    │  │  /api/ingest           │  │
                                    │  └────────────────────────┘  │
                                    │                              │
                                    │  ┌────────────────────────┐  │
                                    │  │  Supabase Backend      │  │
                                    │  │  - PostgreSQL          │  │
                                    │  │  - Realtime            │  │
                                    │  │  - Auth                │  │
                                    │  └────────────────────────┘  │
                                    │                              │
                                    │  ┌────────────────────────┐  │
                                    │  │  Dashboard UI          │  │
                                    │  │  - Device Status       │  │
                                    │  │  - Live Monitoring     │  │
                                    │  │  - Alerts              │  │
                                    │  └────────────────────────┘  │
                                    │                              │
                                    └──────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Supabase account
- Teltonika TRB245 gateway (or similar with Modbus Master + HTTP POST)

### 1. Clone and Install

```bash
cd Fluxio
pnpm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and keys
3. Run the migration to create tables:

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Alternatively, copy the contents of `supabase/migrations/20240101000000_initial_schema.sql` and run it in the Supabase SQL editor.

### 3. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_SECRET_KEY=generate_a_secure_random_string_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run Development Server

```bash
pnpm dev
```

Open http://localhost:3000 to see the dashboard.

### 5. Configure Your Gateway

#### Teltonika TRB245 Configuration

1. Access gateway web interface (usually http://192.168.1.1)
2. Go to **Services → Modbus**
3. Configure Modbus Master:
   - **Modbus Serial:** RS485
   - **Baud Rate:** 9600 (or match your Nivus)
   - **Data Bits:** 8
   - **Parity:** None
   - **Stop Bits:** 1

4. Add Modbus requests for each register:
   - **Slave ID:** 1 (or your Nivus device ID)
   - **Function Code:** 03 (Read Holding Registers)
   - **Register Address:** Check your Nivus manual
   - **Number of Registers:** 2 (for Float32)

5. Go to **Services → Data to Server**
6. Configure HTTP POST:
   - **URL:** `https://your-domain.com/api/ingest` (or ngrok URL for testing)
   - **Method:** POST
   - **Headers:** `x-api-key: YOUR_API_SECRET_KEY`
   - **Body Format:** JSON
   - **Interval:** 60 seconds (or desired frequency)

#### Example JSON Payload Format

The gateway should send:

```json
{
  "device_id": "NIVUS_01",
  "flow_rate": 12.5,
  "totalizer": 4500.25,
  "temperature": 22.3,
  "pressure": 1.2,
  "battery_level": 95,
  "signal_strength": -70
}
```

You can also send an array of readings:

```json
[
  {
    "device_id": "NIVUS_01",
    "flow_rate": 12.5,
    "totalizer": 4500.25
  },
  {
    "device_id": "NIVUS_02",
    "flow_rate": 8.3,
    "totalizer": 3200.10
  }
]
```

## Testing with Sample Data

You can test the API endpoint with curl:

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_SECRET_KEY" \
  -d '{
    "device_id": "NIVUS_01",
    "flow_rate": 12.5,
    "totalizer": 4500.25,
    "temperature": 22.3
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Data ingested successfully",
  "results": [
    {
      "device_id": "NIVUS_01",
      "success": true
    }
  ]
}
```

## Features

### 1. Real-time Dashboard

- Live device status monitoring
- Automatic updates via WebSocket
- Online/offline detection (15-minute timeout)
- Current flow rates and totalizer values

### 2. Alert System

Configure rules in the database:

```sql
INSERT INTO alert_rules (device_id, rule_name, rule_type, threshold_value, severity)
VALUES ('NIVUS_01', 'High Flow Alert', 'high_flow', 100.0, 'warning');
```

Supported rule types:
- `high_flow` - Triggers when flow_rate > threshold
- `low_flow` - Triggers when flow_rate < threshold
- `device_offline` - Triggers when no data for duration
- `battery_low` - Triggers when battery < threshold

### 3. Historical Data API

Get flow data with time filters:

```bash
GET /api/flow-data?device_id=NIVUS_01&start_time=2024-01-01T00:00:00Z&limit=1000
```

### 4. Device Management

Add new devices:

```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "NIVUS_05",
    "device_name": "Backup Flow Sensor",
    "location": "Plant C",
    "description": "Emergency backup sensor"
  }'
```

## Database Schema

### Key Tables

- **devices** - Device registry with status and metadata
- **flow_data** - Time-series flow measurements
- **alerts** - Generated alerts with resolution tracking
- **alert_rules** - Configurable alerting rules
- **audit_logs** - User action tracking

### Views

- **dashboard_summary** - Aggregated stats for dashboard

### Functions

- `get_latest_flow_data()` - Get most recent reading per device
- `get_flow_statistics(device_id, start_time, end_time)` - Calculate statistics

## Deployment

### Option 1: Vercel (Recommended)

```bash
pnpm install -g vercel
vercel
```

Follow prompts and add environment variables in Vercel dashboard.

### Option 2: Docker

```bash
docker build -t fluxio .
docker run -p 3000:3000 --env-file .env fluxio
```

### Option 3: Traditional Server

```bash
pnpm build
pnpm start
```

Use PM2 or systemd for process management.

## Cost Estimates

### Supabase
- **Free tier:** Up to 500MB database, 2GB bandwidth (sufficient for 10-20 devices)
- **Pro tier:** $25/month (recommended for production)

### Teltonika TRB245
- **Device cost:** ~$160-220 USD
- **M2M SIM:** $2-5/month (minimal data usage: ~10MB/month per device)

### Vercel Hosting
- **Free tier:** Sufficient for most use cases
- **Pro tier:** $20/month if needed

### Total Monthly Cost (10 devices)
- **Hardware (one-time):** $1,600-2,200
- **Monthly:** $25 (Supabase) + $30 (SIM cards) = ~$55/month

## Monitoring & Maintenance

### Health Check

```bash
curl http://localhost:3000/api/ingest
```

Response:
```json
{
  "status": "ok",
  "service": "FluxIO Data Ingest API",
  "version": "1.0.0",
  "timestamp": "2024-01-09T..."
}
```

### Log Monitoring

Check Vercel logs or Supabase logs for errors.

### Backup Strategy

Supabase provides automatic daily backups (Pro plan). For critical data:

```bash
# Export flow data
supabase db dump -f backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### No data appearing?

1. Check gateway is sending data: Look at gateway logs
2. Verify API key is correct
3. Check Supabase connection: `pnpm supabase status`
4. Test API endpoint directly with curl

### Alerts not triggering?

1. Verify alert rules exist: `SELECT * FROM alert_rules WHERE is_enabled = true;`
2. Check rule thresholds are appropriate
3. Ensure flow data is being inserted correctly

### Gateway can't reach API?

1. Use ngrok for local testing: `ngrok http 3000`
2. Verify firewall settings
3. Check gateway internet connectivity
4. Ensure HTTPS if using production domain

## Security Best Practices

1. **API Key:** Use a strong random string (32+ characters)
2. **Environment Variables:** Never commit `.env` to git
3. **Supabase RLS:** Enable Row Level Security policies in production
4. **HTTPS:** Always use HTTPS in production
5. **Firewall:** Restrict API endpoint to known gateway IPs if possible

## Roadmap

- [ ] Advanced analytics dashboard with charts
- [ ] SMS/email notification system
- [ ] Mobile app (React Native)
- [ ] MQTT support as alternative to HTTP
- [ ] Multi-tenant support
- [ ] Predictive maintenance alerts
- [ ] Data export (CSV, Excel)
- [ ] Custom dashboards

## Support

For issues and questions:
- Check the troubleshooting section
- Review Supabase docs: https://supabase.com/docs
- Teltonika wiki: https://wiki.teltonika-networks.com

## License

MIT License - see LICENSE file

## Credits

Built with:
- Next.js 14
- Supabase
- Tailwind CSS
- TypeScript
- Recharts

---

**Version:** 1.0.0
**Last Updated:** January 9, 2025
**Repository:** Fluxio
