# FlowNexus Documentation

## Gateway Configuration

- **[TBR246_GATEWAY_CONFIGURATION.md](./TBR246_GATEWAY_CONFIGURATION.md)** - Complete guide for configuring Teltonika TBR 246 gateway to write data directly to Supabase

## Quick Start Scripts

Located in `/scripts/`:

- **setup-tbr246-device.sql** - Run in Supabase SQL Editor to register your Nivus 750 device
- **test-supabase-insert.ps1** - PowerShell script to test direct Supabase insert (Windows)
- **test-supabase-insert.sh** - Bash script to test direct Supabase insert (Linux/macOS)

## Architecture Overview

```
Option A: Direct to Supabase (Recommended)
==========================================
Nivus 750 → TBR 246 → Supabase → FlowNexus Website (on demand)

- Gateway writes directly to database
- Website does not need to run 24/7
- Data is always persisted

Option B: Via FlowNexus API
========================
Nivus 750 → TBR 246 → FlowNexus API → Supabase → FlowNexus Website

- API validates data and evaluates alerts
- Requires website to be running
- Provides additional processing
```

## Environment Variables

See `.env.example` for all configuration options.

Key variables for TBR 246 integration:

| Variable | Description | Used By |
|----------|-------------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access | Direct Supabase insert |
| `API_SECRET_KEY` | API authentication | FlowNexus API endpoint |

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Teltonika TBR 246 Wiki](https://wiki.teltonika-networks.com/view/TBR246)
- [Nivus Product Information](https://www.nivus.com)

---

*Version 1.3 | January 24, 2026 | flownexus*
