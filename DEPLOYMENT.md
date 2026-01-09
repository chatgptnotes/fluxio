# FluxIO Deployment Guide

## Production Deployment

FluxIO has been successfully deployed to Vercel.

### Live URLs

- **Production:** https://fluxio-three.vercel.app
- **GitHub Repository:** https://github.com/chatgptnotes/fluxio

### Local Development

- **Local Server:** http://localhost:3000
- **Command:** `pnpm dev`

---

## Quick Start

### 1. Set Up Supabase

Before the application is fully functional, you need to configure Supabase:

```bash
# Create a Supabase project at https://supabase.com
# Copy your project URL and keys from Settings > API
```

### 2. Configure Environment Variables

In Vercel dashboard:

1. Go to your project: https://vercel.com/chatgptnotes-6366s-projects/fluxio
2. Navigate to Settings > Environment Variables
3. Add the following:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
API_SECRET_KEY=your_secure_random_string
```

### 3. Deploy Database Schema

```bash
# Option 1: Supabase Dashboard
# Copy contents of supabase/migrations/20240101000000_initial_schema.sql
# Paste in Supabase SQL Editor and run

# Option 2: Supabase CLI
brew install supabase/tap/supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

### 4. Redeploy Application

After adding environment variables:

```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

---

## Testing the API

### Health Check

```bash
curl https://fluxio-three.vercel.app/api/ingest
```

Expected response:
```json
{
  "status": "ok",
  "service": "FluxIO Data Ingest API",
  "version": "1.0.0",
  "timestamp": "2025-01-09T..."
}
```

### Send Test Data

```bash
curl -X POST https://fluxio-three.vercel.app/api/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_API_SECRET_KEY" \
  -d '{
    "device_id": "NIVUS_01",
    "flow_rate": 12.5,
    "totalizer": 4500.25,
    "temperature": 22.3
  }'
```

---

## Configure Your Teltonika Gateway

### Gateway Configuration Steps

1. **Access Gateway:**
   - Connect to gateway at http://192.168.1.1

2. **Configure Modbus:**
   - Go to Services > Modbus
   - Set up Modbus Master for your Nivus devices

3. **Configure Data to Server:**
   - Go to Services > Data to Server
   - **URL:** https://fluxio-three.vercel.app/api/ingest
   - **Method:** POST
   - **Headers:** x-api-key: YOUR_API_SECRET_KEY
   - **Body Format:** JSON
   - **Interval:** 60 seconds

### Example Gateway JSON Payload

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

---

## Monitoring & Logs

### View Deployment Logs

```bash
vercel logs fluxio-three.vercel.app
```

### View Real-time Logs

```bash
vercel logs fluxio-three.vercel.app --follow
```

### Inspect Deployment

```bash
vercel inspect fluxio-three.vercel.app
```

---

## Custom Domain (Optional)

To use a custom domain:

1. Go to Vercel dashboard > Domains
2. Add your domain
3. Configure DNS records as shown
4. Wait for SSL certificate provisioning

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | https://xxx.supabase.co |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | eyJhbGc... |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key | eyJhbGc... |
| API_SECRET_KEY | API authentication key | random_secure_string |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NEXT_PUBLIC_SITE_URL | Application URL | Auto-detected |
| NODE_ENV | Environment | production |

---

## Troubleshooting

### Dashboard Shows No Data

1. Check Supabase connection:
   - Verify environment variables in Vercel
   - Check Supabase project is active

2. Check database schema:
   - Run migration in Supabase SQL editor
   - Verify tables exist

3. Send test data:
   - Use curl command above
   - Check Supabase table browser

### API Returns 401 Unauthorized

- Verify API_SECRET_KEY matches in both gateway and Vercel env vars
- Ensure x-api-key header is present in gateway request

### Gateway Can't Reach API

- Use ngrok for local testing first
- Verify gateway internet connectivity
- Check Vercel deployment status
- Ensure no firewall blocking requests

---

## Next Steps

1. **Configure Supabase:** Set up your database with the migration
2. **Add Environment Variables:** Configure all required env vars in Vercel
3. **Test API:** Send sample data using curl
4. **Configure Gateway:** Point your Teltonika to the production URL
5. **Monitor Dashboard:** Watch real-time data flow in

---

## Support Resources

- **Documentation:** README.md, ARCHITECTURE.md
- **GitHub Issues:** https://github.com/chatgptnotes/fluxio/issues
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

**Version:** 1.3
**Last Updated:** January 9, 2025
**Repository:** https://github.com/chatgptnotes/fluxio
