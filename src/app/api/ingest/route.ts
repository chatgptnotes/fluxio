import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Interface for incoming data from Teltonika gateway
interface IngestData {
  device_id: string
  flow_rate?: number
  totalizer?: number
  temperature?: number
  pressure?: number
  battery_level?: number
  signal_strength?: number
  timestamp?: string
  metadata?: Record<string, unknown>
}

// Validate incoming data
function validateData(data: unknown): data is IngestData {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>

  if (typeof d.device_id !== 'string' || !d.device_id) return false

  // At least one measurement should be present
  const hasMeasurement =
    typeof d.flow_rate === 'number' ||
    typeof d.totalizer === 'number' ||
    typeof d.temperature === 'number' ||
    typeof d.pressure === 'number'

  return hasMeasurement
}

// Check alert conditions
async function checkAlertConditions(
  supabase: ReturnType<typeof createAdminClient>,
  deviceId: string,
  data: IngestData
) {
  // Get alert rules for this device
  const { data: rules, error: rulesError } = await supabase
    .from('alert_rules')
    .select('*')
    .eq('device_id', deviceId)
    .eq('is_enabled', true)

  if (rulesError || !rules) return

  for (const rule of rules) {
    let shouldAlert = false
    let actualValue: number | null = null
    let message = ''

    switch (rule.rule_type) {
      case 'high_flow':
        if (
          data.flow_rate !== undefined &&
          rule.threshold_value !== null &&
          data.flow_rate > rule.threshold_value
        ) {
          shouldAlert = true
          actualValue = data.flow_rate
          message = `Flow rate ${data.flow_rate.toFixed(2)} exceeds threshold ${rule.threshold_value.toFixed(2)}`
        }
        break

      case 'low_flow':
        if (
          data.flow_rate !== undefined &&
          rule.threshold_value !== null &&
          data.flow_rate < rule.threshold_value
        ) {
          shouldAlert = true
          actualValue = data.flow_rate
          message = `Flow rate ${data.flow_rate.toFixed(2)} below threshold ${rule.threshold_value.toFixed(2)}`
        }
        break

      case 'battery_low':
        if (
          data.battery_level !== undefined &&
          rule.threshold_value !== null &&
          data.battery_level < rule.threshold_value
        ) {
          shouldAlert = true
          actualValue = data.battery_level
          message = `Battery level ${data.battery_level.toFixed(0)}% below threshold ${rule.threshold_value.toFixed(0)}%`
        }
        break
    }

    if (shouldAlert) {
      // Create alert
      await supabase.from('alerts').insert({
        device_id: deviceId,
        alert_type: rule.rule_type,
        severity: rule.severity,
        message,
        threshold_value: rule.threshold_value,
        actual_value: actualValue,
      })
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check API key authentication
    const apiKey = request.headers.get('x-api-key')
    const expectedKey = process.env.API_SECRET_KEY

    if (!apiKey || apiKey !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Support both single object and array of objects
    const dataArray = Array.isArray(body) ? body : [body]

    // Validate all data
    for (const data of dataArray) {
      if (!validateData(data)) {
        return NextResponse.json(
          {
            error: 'Validation error',
            message: 'Invalid data format. Required: device_id and at least one measurement.',
          },
          { status: 400 }
        )
      }
    }

    // Create Supabase admin client
    const supabase = createAdminClient()

    // Process each data point
    const results = []
    for (const data of dataArray) {
      // Insert flow data
      const { error: insertError } = await supabase.from('flow_data').insert({
        device_id: data.device_id,
        flow_rate: data.flow_rate ?? null,
        totalizer: data.totalizer ?? null,
        temperature: data.temperature ?? null,
        pressure: data.pressure ?? null,
        battery_level: data.battery_level ?? null,
        signal_strength: data.signal_strength ?? null,
        created_at: data.timestamp || new Date().toISOString(),
        metadata: data.metadata || {},
      })

      if (insertError) {
        console.error('Error inserting flow data:', insertError)
        results.push({
          device_id: data.device_id,
          success: false,
          error: insertError.message,
        })
        continue
      }

      // Check alert conditions
      await checkAlertConditions(supabase, data.device_id, data)

      results.push({
        device_id: data.device_id,
        success: true,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Data ingested successfully',
      results,
    })
  } catch (error) {
    console.error('Error in ingest endpoint:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'FluxIO Data Ingest API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
}
