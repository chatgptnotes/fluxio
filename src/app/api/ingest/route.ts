import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Map TRB246 Modbus register addresses to field names
// Based on Nivus 750 PDF Rev04 (Nov 2024) - IEEE754 float Input Registers (FC4)
// Measurement Place 1, 1-based addressing (as sent by TRB246 full_addr)
// Byte order: CDAB (least significant register first) = 32bit_float3412 on TRB246
const MODBUS_REGISTER_MAP: Record<string, string> = {
  '11': 'flow_rate',       // Nivus 30011: Flow (m3/s), 2 regs IEEE754
  '13': 'level',           // Nivus 30013: Level (m), 2 regs IEEE754
  '15': 'velocity',        // Nivus 30015: Velocity (m/s), 2 regs IEEE754
  '17': 'temperature',     // Nivus 30017: Water Temperature (C), 2 regs IEEE754
  '5201': 'totalizer',     // Nivus 35201: Totalizer (m3), 2 regs IEEE754
}

// Interface for TRB246 Modbus data format
interface ModbusRegisterData {
  full_addr?: string
  address?: string | number
  data: number
}

// Convert TRB246 Modbus register array format to FlowNexus field format
function convertModbusFormat(data: unknown): Record<string, unknown> | null {
  // Check if data is an array
  if (!Array.isArray(data)) return null

  // Check if it's empty
  if (data.length === 0) return null

  // Check if all items have Modbus format (full_addr or address + data)
  const hasModbusFormat = data.every(
    (item): item is ModbusRegisterData =>
      typeof item === 'object' &&
      item !== null &&
      ('full_addr' in item || 'address' in item) &&
      'data' in item
  )

  if (!hasModbusFormat) return null

  // Convert to FlowNexus format
  const converted: Record<string, unknown> = {}
  for (const item of data as ModbusRegisterData[]) {
    const addr = String(item.full_addr ?? item.address)
    const fieldName = MODBUS_REGISTER_MAP[addr]
    if (fieldName) {
      converted[fieldName] = Number(item.data)
    }
  }

  // Return converted object if we found any valid fields
  return Object.keys(converted).length > 0 ? converted : null
}

// Interface for incoming data from Teltonika gateway
interface IngestData {
  device_id: string
  flow_rate?: number
  totalizer?: number
  temperature?: number
  pressure?: number
  level?: number // water level in mm
  velocity?: number // flow velocity in m/s
  battery_level?: number
  signal_strength?: number
  timestamp?: string
  metadata?: Record<string, unknown>
}

// Normalize TRB246 Modbus data format to FlowNexus format
function normalizeData(data: Record<string, unknown>, defaultDeviceId: string): Record<string, unknown> {
  const normalized: Record<string, unknown> = {}

  // Handle device_id - use provided or default
  normalized.device_id = data.device_id || data.Device_id || data.DEVICE_ID || defaultDeviceId

  // Handle flow_rate (case-insensitive)
  const flowRate = data.flow_rate ?? data.Flow_rate ?? data.FLOW_RATE ?? data.flowRate
  if (flowRate !== undefined) normalized.flow_rate = Number(flowRate)

  // Handle totalizer (case-insensitive)
  const totalizer = data.totalizer ?? data.Totalizer ?? data.TOTALIZER
  if (totalizer !== undefined) normalized.totalizer = Number(totalizer)

  // Handle temperature (case-insensitive)
  const temperature = data.temperature ?? data.Temperature ?? data.TEMPERATURE
  if (temperature !== undefined) normalized.temperature = Number(temperature)

  // Handle pressure (case-insensitive)
  const pressure = data.pressure ?? data.Pressure ?? data.PRESSURE
  if (pressure !== undefined) normalized.pressure = Number(pressure)

  // Handle level/water_level (case-insensitive)
  const level = data.level ?? data.Level ?? data.LEVEL ?? data.water_level ?? data.Water_level
  if (level !== undefined) normalized.level = Number(level)

  // Handle velocity (case-insensitive)
  const velocity = data.velocity ?? data.Velocity ?? data.VELOCITY
  if (velocity !== undefined) normalized.velocity = Number(velocity)

  // Handle battery_level
  const batteryLevel = data.battery_level ?? data.Battery_level ?? data.batteryLevel
  if (batteryLevel !== undefined) normalized.battery_level = Number(batteryLevel)

  // Handle signal_strength
  const signalStrength = data.signal_strength ?? data.Signal_strength ?? data.signalStrength
  if (signalStrength !== undefined) normalized.signal_strength = Number(signalStrength)

  // Copy timestamp and metadata if present
  if (data.timestamp) normalized.timestamp = data.timestamp
  if (data.metadata) normalized.metadata = data.metadata

  return normalized
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
    typeof d.pressure === 'number' ||
    typeof d.level === 'number' ||
    typeof d.velocity === 'number'

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const rule of rules as any[]) {
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

      case 'zero_flow':
        if (
          data.flow_rate !== undefined &&
          data.flow_rate === 0
        ) {
          shouldAlert = true
          actualValue = data.flow_rate
          message = `Zero flow detected - flow rate is 0`
        }
        break
    }

    if (shouldAlert) {
      // Create alert
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('alerts').insert({
        device_id: deviceId,
        alert_type: rule.rule_type,
        severity: rule.severity,
        message,
        threshold_value: rule.threshold_value,
        actual_value: actualValue,
      } as any)
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

    // Get default device_id from header or query param (for TRB246 compatibility)
    const defaultDeviceId = request.headers.get('x-device-id') ||
                           request.nextUrl.searchParams.get('device_id') ||
                           'NIVUS_750_001'

    // Parse request body
    const body = await request.json()

    // Check if body is TRB246 Modbus register format and convert if needed
    const convertedModbus = convertModbusFormat(body)

    // Support both single object and array of objects
    // If we converted from Modbus format, use the converted object
    const rawDataArray = convertedModbus
      ? [convertedModbus]
      : Array.isArray(body) ? body : [body]

    // Normalize and validate all data
    const dataArray: IngestData[] = []
    for (const rawData of rawDataArray) {
      // Normalize the data format (handle TRB246 Modbus format)
      const normalized = normalizeData(rawData as Record<string, unknown>, defaultDeviceId)

      if (!validateData(normalized)) {
        return NextResponse.json(
          {
            error: 'Validation error',
            message: 'Invalid data format. Required: device_id and at least one measurement.',
            received: rawData,
            normalized: normalized,
          },
          { status: 400 }
        )
      }
      dataArray.push(normalized as IngestData)
    }

    // Filter out all-zero data points (ghost sender protection)
    // The TRB246 built-in "Data to Server" sometimes sends all-zero readings
    // when it fails to read Modbus registers. Our Lua sender already skips these,
    // but this server-side check catches them from any source.
    const filteredDataArray = dataArray.filter(data => {
      const noFlow = data.flow_rate === 0 || data.flow_rate === undefined || data.flow_rate === null
      const noTotal = data.totalizer === 0 || data.totalizer === undefined || data.totalizer === null
      const noLevel = data.level === 0 || data.level === undefined || data.level === null
      const noVelocity = data.velocity === 0 || data.velocity === undefined || data.velocity === null
      // Skip data points with no flow measurements (flow, totalizer, level, velocity all zero/absent)
      // Temperature alone is not a useful flow measurement
      const noFlowData = noFlow && noTotal && noLevel && noVelocity
      return !noFlowData
    })

    if (filteredDataArray.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All data points were zero, skipped ingestion',
        results: dataArray.map(d => ({ device_id: d.device_id, success: true, skipped: true })),
      })
    }

    // Create Supabase admin client
    const supabase = createAdminClient()

    // Process each data point
    const results = []
    for (const data of filteredDataArray) {
      // Build metadata object with level and velocity (since they don't have dedicated columns)
      const metadata: Record<string, unknown> = {
        ...(data.metadata || {}),
      }
      if (data.level !== undefined) metadata.water_level = data.level
      if (data.velocity !== undefined) metadata.velocity = data.velocity

      // Insert flow data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await supabase.from('flow_data').insert({
        device_id: data.device_id,
        flow_rate: data.flow_rate ?? null,
        totalizer: data.totalizer ?? null,
        temperature: data.temperature ?? null,
        pressure: data.pressure ?? null,
        battery_level: data.battery_level ?? null,
        signal_strength: data.signal_strength ?? null,
        created_at: data.timestamp || new Date().toISOString(),
        metadata,
      } as any)

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
    service: 'FlowNexus Data Ingest API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
}
