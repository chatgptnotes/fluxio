// Report Data Aggregation Utilities
import { cstpsPipes, NivusSensor } from '../cstps-data'
import { createAdminClient } from '@/lib/supabase/admin'

export interface ReportDateRange {
  startDate: Date
  endDate: Date
  label: string
}

export interface FlowDataPoint {
  timestamp: Date
  flowRate: number
  velocity: number
  waterLevel: number
  temperature: number
}

export interface PipeStatistics {
  pipeId: string
  deviceName: string
  location: string
  status: string
  minFlowRate: number
  maxFlowRate: number
  avgFlowRate: number
  totalVolume: number
  operatingHours: number
  batteryLevel: number
  signalStrength: number
}

export interface AlertSummary {
  type: 'critical' | 'warning' | 'info'
  count: number
  description: string
  timestamp: Date
}

export interface DailyDataPoint {
  date: string
  fullDate: Date
  totalFlow: number
}

export interface ReportData {
  reportType: 'daily' | 'monthly' | 'custom'
  dateRange: ReportDateRange
  generatedAt: Date
  summary: {
    totalFlowVolume: number
    avgFlowRate: number
    activeDevices: number
    totalDevices: number
    offlineDevices: number
    alertsTriggered: number
  }
  pipeStatistics: PipeStatistics[]
  hourlyData: { hour: number; totalFlow: number }[]
  dailyData: DailyDataPoint[]
  isSingleDay: boolean
  alerts: AlertSummary[]
  pipeHourlyData?: { pipeId: string; hourlyVolumes: number[] }[]
  deviceHealth: {
    pipeId: string
    deviceName: string
    batteryLevel: number
    signalStrength: number
    status: string
    lastCommunication: Date
  }[]
}

// Generate mock historical data for a pipe
function generateMockFlowData(
  pipe: NivusSensor,
  startDate: Date,
  endDate: Date,
  intervalMinutes: number = 5
): FlowDataPoint[] {
  const data: FlowDataPoint[] = []
  const baseFlowRate = pipe.parameters.flowRate
  const baseVelocity = pipe.parameters.velocity
  const baseWaterLevel = pipe.parameters.waterLevel
  const baseTemperature = pipe.parameters.temperature

  let current = new Date(startDate)
  while (current <= endDate) {
    // Add realistic variance
    const hourOfDay = current.getHours()
    // Flow tends to be higher during daytime
    const dayFactor = hourOfDay >= 6 && hourOfDay <= 18 ? 1.1 : 0.9
    const randomFactor = 0.9 + Math.random() * 0.2

    // Offline pipes have no flow
    const isOnline = pipe.status !== 'offline'

    data.push({
      timestamp: new Date(current),
      flowRate: isOnline ? baseFlowRate * dayFactor * randomFactor : 0,
      velocity: isOnline ? baseVelocity * randomFactor : 0,
      waterLevel: isOnline ? baseWaterLevel * randomFactor : pipe.parameters.waterLevel * 0.2,
      temperature: baseTemperature + (Math.random() - 0.5) * 2,
    })

    current = new Date(current.getTime() + intervalMinutes * 60 * 1000)
  }

  return data
}

// Calculate statistics for a pipe
function calculatePipeStatistics(
  pipe: NivusSensor,
  flowData: FlowDataPoint[]
): PipeStatistics {
  const flowRates = flowData.map((d) => d.flowRate).filter((f) => f > 0)

  const minFlowRate = flowRates.length > 0 ? Math.min(...flowRates) : 0
  const maxFlowRate = flowRates.length > 0 ? Math.max(...flowRates) : 0
  const avgFlowRate =
    flowRates.length > 0
      ? flowRates.reduce((sum, f) => sum + f, 0) / flowRates.length
      : 0

  // Calculate total volume (flow rate * time interval in hours)
  const intervalHours = 5 / 60 // 5 minutes
  const totalVolume = flowData.reduce((sum, d) => sum + d.flowRate * intervalHours, 0)

  // Operating hours (when flow > 0)
  const operatingHours = flowRates.length * intervalHours

  return {
    pipeId: pipe.id,
    deviceName: `Nivus-750-${pipe.pipeNumber}`,
    location: pipe.location,
    status: pipe.status,
    minFlowRate: Math.round(minFlowRate * 100) / 100,
    maxFlowRate: Math.round(maxFlowRate * 100) / 100,
    avgFlowRate: Math.round(avgFlowRate * 100) / 100,
    totalVolume: Math.round(totalVolume * 100) / 100,
    operatingHours: Math.round(operatingHours * 10) / 10,
    batteryLevel: pipe.parameters.batteryLevel,
    signalStrength: pipe.parameters.signalStrength,
  }
}

// Generate hourly aggregated data
function generateHourlyData(
  allPipesData: Map<string, FlowDataPoint[]>
): { hour: number; totalFlow: number }[] {
  const hourlyTotals: { [hour: number]: number } = {}

  for (let h = 0; h < 24; h++) {
    hourlyTotals[h] = 0
  }

  allPipesData.forEach((flowData) => {
    flowData.forEach((point) => {
      const hour = point.timestamp.getHours()
      hourlyTotals[hour] += point.flowRate * (5 / 60) // 5-minute interval volume
    })
  })

  return Object.entries(hourlyTotals).map(([hour, totalFlow]) => ({
    hour: parseInt(hour),
    totalFlow: Math.round(totalFlow * 100) / 100,
  }))
}

// Check if report spans a single day
function isSingleDayReport(dateRange: ReportDateRange): boolean {
  const start = new Date(dateRange.startDate)
  const end = new Date(dateRange.endDate)
  return start.toDateString() === end.toDateString()
}

// Generate daily aggregated data for multi-day reports
function generateDailyData(
  allPipesData: Map<string, FlowDataPoint[]>,
  dateRange: ReportDateRange
): DailyDataPoint[] {
  const dailyTotals: Map<string, { fullDate: Date; totalFlow: number }> = new Map()

  // Initialize all days in the range (using IST date keys)
  const current = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  while (current <= endDate) {
    const dateKey = formatISTDateStr(current)
    dailyTotals.set(dateKey, { fullDate: new Date(current), totalFlow: 0 })
    current.setTime(current.getTime() + 86400000) // advance 1 day
  }

  // Aggregate flow data by day (using IST date keys)
  allPipesData.forEach((flowData) => {
    flowData.forEach((point) => {
      const dateKey = formatISTDateStr(point.timestamp)
      const existing = dailyTotals.get(dateKey)
      if (existing) {
        // Add flow rate * interval (5 min = 5/60 hours) to get volume
        existing.totalFlow += point.flowRate * (5 / 60)
      }
    })
  })

  // Convert to array and format dates
  return Array.from(dailyTotals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, data]) => ({
      date: data.fullDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Kolkata'
      }),
      fullDate: data.fullDate,
      totalFlow: Math.round(data.totalFlow * 100) / 100,
    }))
}

// Generate mock alerts based on device status
function generateAlerts(
  pipes: NivusSensor[],
  dateRange: ReportDateRange
): AlertSummary[] {
  const alerts: AlertSummary[] = []

  pipes.forEach((pipe) => {
    const simpleName = `Nivus-750-${pipe.pipeNumber}`
    if (pipe.status === 'offline') {
      alerts.push({
        type: 'critical',
        count: 1,
        description: `${simpleName} - Device Offline`,
        timestamp: new Date(dateRange.startDate.getTime() + Math.random() * (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
      })
    }

    if (pipe.status === 'warning') {
      alerts.push({
        type: 'warning',
        count: 1,
        description: `${simpleName} - Low Battery (${pipe.parameters.batteryLevel}%)`,
        timestamp: new Date(dateRange.startDate.getTime() + Math.random() * (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
      })
    }

    if (pipe.parameters.signalStrength < -70) {
      alerts.push({
        type: 'warning',
        count: 1,
        description: `${simpleName} - Weak Signal (${pipe.parameters.signalStrength} dBm)`,
        timestamp: new Date(dateRange.startDate.getTime() + Math.random() * (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
      })
    }

    // Random flow alerts
    if (pipe.parameters.flowRate > 100 && Math.random() > 0.7) {
      alerts.push({
        type: 'info',
        count: 1,
        description: `${simpleName} - High Flow Rate Detected`,
        timestamp: new Date(dateRange.startDate.getTime() + Math.random() * (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
      })
    }
  })

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// Get IST midnight as a UTC Date object.
// IST 00:00 on a given date = UTC 18:30 on the previous day.
function istMidnightAsUTC(year: number, month: number, day: number): Date {
  // Date.UTC gives ms for that date at 00:00 UTC
  // Subtract 5h30m offset to convert IST midnight to UTC
  return new Date(Date.UTC(year, month, day) - 5.5 * 3600 * 1000)
}

// Get current IST date components (works on any server timezone)
function getISTNow(): { now: Date; year: number; month: number; date: number; day: number } {
  const now = new Date()
  // Shift to IST to get correct calendar date
  const istMs = now.getTime() + 5.5 * 3600 * 1000
  const istDate = new Date(istMs)
  return {
    now,
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    date: istDate.getUTCDate(),
    day: istDate.getUTCDay(),
  }
}

// Get date range presets (all boundaries aligned to IST midnight)
export function getDateRangePreset(preset: string): ReportDateRange {
  const { now, year, month, date, day } = getISTNow()
  const todayStart = istMidnightAsUTC(year, month, date)

  switch (preset) {
    case 'today':
      return {
        startDate: todayStart,
        endDate: now,
        label: 'Today',
      }
    case 'yesterday': {
      const yesterdayStart = istMidnightAsUTC(year, month, date - 1)
      return {
        startDate: yesterdayStart,
        endDate: todayStart,
        label: 'Yesterday',
      }
    }
    case 'thisWeek': {
      const weekStart = istMidnightAsUTC(year, month, date - day)
      return {
        startDate: weekStart,
        endDate: now,
        label: 'This Week',
      }
    }
    case 'lastWeek': {
      const lastWeekEnd = istMidnightAsUTC(year, month, date - day)
      const lastWeekStart = istMidnightAsUTC(year, month, date - day - 7)
      return {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        label: 'Last Week',
      }
    }
    case 'thisMonth': {
      const monthStart = istMidnightAsUTC(year, month, 1)
      return {
        startDate: monthStart,
        endDate: now,
        label: 'This Month',
      }
    }
    case 'lastMonth': {
      const lastMonthEnd = istMidnightAsUTC(year, month, 1)
      const lastMonthStart = istMidnightAsUTC(year, month - 1, 1)
      return {
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
        label: 'Last Month',
      }
    }
    default:
      return {
        startDate: todayStart,
        endDate: now,
        label: 'Custom',
      }
  }
}

// Main function to generate report data
export function generateReportData(
  reportType: 'daily' | 'monthly' | 'custom',
  dateRange: ReportDateRange,
  deviceId?: string
): ReportData {
  // Filter pipes if specific device requested
  const pipes = deviceId && deviceId !== 'all'
    ? cstpsPipes.filter((p) => p.id === deviceId)
    : cstpsPipes

  // Generate mock flow data for each pipe
  const allPipesData = new Map<string, FlowDataPoint[]>()
  pipes.forEach((pipe) => {
    const flowData = generateMockFlowData(pipe, dateRange.startDate, dateRange.endDate)
    allPipesData.set(pipe.id, flowData)
  })

  // Calculate statistics for each pipe
  const pipeStatistics = pipes.map((pipe) => {
    const flowData = allPipesData.get(pipe.id) || []
    return calculatePipeStatistics(pipe, flowData)
  })

  // Calculate summary
  const totalFlowVolume = pipeStatistics.reduce((sum, p) => sum + p.totalVolume, 0)
  const avgFlowRate =
    pipeStatistics.length > 0
      ? pipeStatistics.reduce((sum, p) => sum + p.avgFlowRate, 0) / pipeStatistics.length
      : 0
  // Count devices: 'online' and 'warning' are considered active/operational
  const activeDevices = pipes.filter((p) => p.status === 'online' || p.status === 'warning').length
  const totalDevices = pipes.length
  const offlineDevices = pipes.filter((p) => p.status === 'offline').length

  // Generate hourly data
  const hourlyData = generateHourlyData(allPipesData)

  // Generate daily data for multi-day reports
  const dailyData = generateDailyData(allPipesData, dateRange)

  // Check if single day report
  const singleDay = isSingleDayReport(dateRange)

  // Generate alerts
  const alerts = generateAlerts(pipes, dateRange)

  // Device health
  const deviceHealth = pipes.map((pipe) => ({
    pipeId: pipe.id,
    deviceName: `Nivus-750-${pipe.pipeNumber}`,
    batteryLevel: pipe.parameters.batteryLevel,
    signalStrength: pipe.parameters.signalStrength,
    status: pipe.status,
    lastCommunication: new Date(pipe.lastUpdated),
  }))

  return {
    reportType,
    dateRange,
    generatedAt: new Date(),
    summary: {
      totalFlowVolume: Math.round(totalFlowVolume * 100) / 100,
      avgFlowRate: Math.round(avgFlowRate * 100) / 100,
      activeDevices,
      totalDevices,
      offlineDevices,
      alertsTriggered: alerts.length,
    },
    pipeStatistics,
    hourlyData,
    dailyData,
    isSingleDay: singleDay,
    alerts,
    deviceHealth,
  }
}

// Pipe ID to Supabase device_id mapping
const PIPE_DEVICE_MAP: Record<string, string> = {
  'pipe-1': 'NIVUS_750_001',
  'pipe-2': 'NIVUS_750_002',
  'pipe-3': 'NIVUS_750_003',
  'pipe-4': 'NIVUS_750_004',
  'pipe-5': 'NIVUS_750_005',
  'pipe-6': 'NIVUS_750_006',
}

// Fetch real flow_data from Supabase for a device within a date range.
// Uses pagination to fetch ALL rows (Supabase caps at 1000 per request).
async function fetchFlowDataFromSupabase(
  supabase: ReturnType<typeof createAdminClient>,
  deviceId: string,
  startDate: Date,
  endDate: Date
): Promise<FlowDataPoint[]> {
  const allRows: FlowDataPoint[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('flow_data')
      .select('flow_rate, totalizer, temperature, created_at, metadata')
      .eq('device_id', deviceId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error || !data) {
      console.error(`Error fetching flow_data for ${deviceId} (offset ${offset}):`, error)
      break
    }

    // Nivus 750 register units from TRB246 Modbus:
    // - flow_rate (reg 30011): m3/s, convert to m3/h (* 3600)
    // - velocity (reg 30015): m/s (no conversion needed)
    // - water_level (reg 30013): m, convert to mm (* 1000)
    // - temperature (reg 30017): C (no conversion needed)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = data.map((row: any) => ({
      timestamp: new Date(row.created_at),
      flowRate: (row.flow_rate ?? 0) * 3600,       // m3/s -> m3/h
      velocity: row.metadata?.velocity ?? 0,         // m/s
      waterLevel: (row.metadata?.water_level ?? 0) * 1000, // m -> mm
      temperature: row.temperature ?? 0,             // C
    }))

    allRows.push(...rows)
    offset += pageSize
    hasMore = data.length === pageSize // More pages if we got a full page
  }

  console.log(`Fetched ${allRows.length} rows for ${deviceId}`)
  return allRows
}

// Fetch real alerts from Supabase for the date range
async function fetchAlertsFromSupabase(
  supabase: ReturnType<typeof createAdminClient>,
  startDate: Date,
  endDate: Date
): Promise<AlertSummary[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('alerts')
    .select('alert_type, severity, message, created_at, device_id')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(50)

  if (error || !data) {
    console.error('Error fetching alerts:', error)
    return []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => {
    let type: 'critical' | 'warning' | 'info' = 'info'
    if (row.severity === 'critical') type = 'critical'
    else if (row.severity === 'warning') type = 'warning'

    return {
      type,
      count: 1,
      description: row.message || `${row.alert_type} on ${row.device_id}`,
      timestamp: new Date(row.created_at),
    }
  })
}

// Calculate real pipe statistics from Supabase flow_data
function calculateRealPipeStatistics(
  pipe: NivusSensor,
  flowData: FlowDataPoint[]
): PipeStatistics {
  const flowRates = flowData.map(d => d.flowRate).filter(f => f > 0)

  const minFlowRate = flowRates.length > 0 ? Math.min(...flowRates) : 0
  const maxFlowRate = flowRates.length > 0 ? Math.max(...flowRates) : 0
  const avgFlowRate = flowRates.length > 0
    ? flowRates.reduce((sum, f) => sum + f, 0) / flowRates.length
    : 0

  // Calculate total volume from flow_rate (m3/h) readings.
  // Data comes in ~1 min intervals from TRB246.
  // For each reading, volume = flow_rate * interval_hours.
  let totalVolume = 0
  for (let i = 0; i < flowData.length; i++) {
    let intervalHours: number
    if (i < flowData.length - 1) {
      intervalHours = (flowData[i + 1].timestamp.getTime() - flowData[i].timestamp.getTime()) / (1000 * 3600)
      // Cap interval to 5 minutes to avoid counting large gaps (device offline)
      if (intervalHours > 5 / 60) intervalHours = 1 / 60
    } else {
      intervalHours = 1 / 60 // Assume 1 minute for last reading
    }
    totalVolume += flowData[i].flowRate * intervalHours
  }

  // Operating hours: count readings with flow > 0, each ~1 min apart
  const operatingHours = flowRates.length / 60

  return {
    pipeId: pipe.id,
    deviceName: `Nivus-750-${pipe.pipeNumber}`,
    location: pipe.location,
    status: flowData.length > 0 ? 'online' : 'offline',
    minFlowRate: Math.round(minFlowRate * 100) / 100,
    maxFlowRate: Math.round(maxFlowRate * 100) / 100,
    avgFlowRate: Math.round(avgFlowRate * 100) / 100,
    totalVolume: Math.round(totalVolume * 100) / 100,
    operatingHours: Math.round(operatingHours * 10) / 10,
    batteryLevel: pipe.parameters.batteryLevel,
    signalStrength: pipe.parameters.signalStrength,
  }
}

// Generate hourly data from real readings
function generateRealHourlyData(
  allPipesData: Map<string, FlowDataPoint[]>
): { hour: number; totalFlow: number }[] {
  const hourlyTotals: Record<number, number> = {}
  for (let h = 0; h < 24; h++) hourlyTotals[h] = 0

  allPipesData.forEach(flowData => {
    for (let i = 0; i < flowData.length; i++) {
      const point = flowData[i]
      const hour = point.timestamp.getHours()
      let intervalHours: number
      if (i < flowData.length - 1) {
        intervalHours = (flowData[i + 1].timestamp.getTime() - point.timestamp.getTime()) / (1000 * 3600)
        if (intervalHours > 5 / 60) intervalHours = 1 / 60
      } else {
        intervalHours = 1 / 60
      }
      hourlyTotals[hour] += point.flowRate * intervalHours
    }
  })

  return Object.entries(hourlyTotals).map(([hour, totalFlow]) => ({
    hour: parseInt(hour),
    totalFlow: Math.round(totalFlow * 100) / 100,
  }))
}

// Generate daily data from real readings
function generateRealDailyData(
  allPipesData: Map<string, FlowDataPoint[]>,
  dateRange: ReportDateRange
): DailyDataPoint[] {
  const dailyTotals: Map<string, { fullDate: Date; totalFlow: number }> = new Map()

  const current = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  while (current <= endDate) {
    const dateKey = formatISTDateStr(current)
    dailyTotals.set(dateKey, { fullDate: new Date(current), totalFlow: 0 })
    current.setTime(current.getTime() + 86400000) // advance 1 day
  }

  allPipesData.forEach(flowData => {
    for (let i = 0; i < flowData.length; i++) {
      const point = flowData[i]
      const dateKey = formatISTDateStr(point.timestamp)
      const existing = dailyTotals.get(dateKey)
      if (existing) {
        let intervalHours: number
        if (i < flowData.length - 1) {
          intervalHours = (flowData[i + 1].timestamp.getTime() - point.timestamp.getTime()) / (1000 * 3600)
          if (intervalHours > 5 / 60) intervalHours = 1 / 60
        } else {
          intervalHours = 1 / 60
        }
        existing.totalFlow += point.flowRate * intervalHours
      }
    }
  })

  return Array.from(dailyTotals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([, data]) => ({
      date: data.fullDate.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Kolkata',
      }),
      fullDate: data.fullDate,
      totalFlow: Math.round(data.totalFlow * 100) / 100,
    }))
}

// Generate per-pipe hourly volume breakdown from real readings (grouped by IST hour)
function generatePerPipeHourlyData(
  allPipesData: Map<string, FlowDataPoint[]>
): { pipeId: string; hourlyVolumes: number[] }[] {
  const result: { pipeId: string; hourlyVolumes: number[] }[] = []

  allPipesData.forEach((flowData, pipeId) => {
    const hourlyVolumes = new Array(24).fill(0)

    for (let i = 0; i < flowData.length; i++) {
      const point = flowData[i]
      // Group by IST hour (UTC+5:30) so chart labels show clean IST times
      const istMs = point.timestamp.getTime() + 5.5 * 3600 * 1000
      const hour = new Date(istMs).getUTCHours()
      let intervalHours: number
      if (i < flowData.length - 1) {
        intervalHours = (flowData[i + 1].timestamp.getTime() - point.timestamp.getTime()) / (1000 * 3600)
        if (intervalHours > 5 / 60) intervalHours = 1 / 60
      } else {
        intervalHours = 1 / 60
      }
      hourlyVolumes[hour] += point.flowRate * intervalHours
    }

    result.push({
      pipeId,
      hourlyVolumes: hourlyVolumes.map(v => Math.round(v * 100) / 100),
    })
  })

  return result
}

/**
 * Generate report data from real Supabase flow_data.
 * This is the production version that replaces the mock data generator.
 */
export async function generateReportDataFromSupabase(
  reportType: 'daily' | 'monthly' | 'custom',
  dateRange: ReportDateRange,
  deviceId?: string
): Promise<ReportData> {
  const supabase = createAdminClient()

  // Determine which pipes to include
  const pipes = deviceId && deviceId !== 'all'
    ? cstpsPipes.filter(p => p.id === deviceId)
    : cstpsPipes

  // Fetch real flow data for each pipe from Supabase
  const allPipesData = new Map<string, FlowDataPoint[]>()
  for (const pipe of pipes) {
    const supabaseDeviceId = PIPE_DEVICE_MAP[pipe.id] || pipe.deviceId
    const flowData = await fetchFlowDataFromSupabase(
      supabase,
      supabaseDeviceId,
      dateRange.startDate,
      dateRange.endDate
    )
    allPipesData.set(pipe.id, flowData)
  }

  // Calculate real statistics for each pipe
  const pipeStatistics = pipes.map(pipe => {
    const flowData = allPipesData.get(pipe.id) || []
    return calculateRealPipeStatistics(pipe, flowData)
  })

  // Summary
  const totalFlowVolume = pipeStatistics.reduce((sum, p) => sum + p.totalVolume, 0)
  const activePipeStats = pipeStatistics.filter(p => p.avgFlowRate > 0)
  const avgFlowRate = activePipeStats.length > 0
    ? activePipeStats.reduce((sum, p) => sum + p.avgFlowRate, 0) / activePipeStats.length
    : 0
  const activeDevices = pipeStatistics.filter(p => p.status === 'online').length
  const totalDevices = pipes.length
  const offlineDevices = totalDevices - activeDevices

  // Hourly and daily data from real readings
  const hourlyData = generateRealHourlyData(allPipesData)
  const dailyData = generateRealDailyData(allPipesData, dateRange)
  const singleDay = isSingleDayReport(dateRange)

  // Per-pipe hourly breakdown for segmented bar chart
  const pipeHourlyData = generatePerPipeHourlyData(allPipesData)

  // Fetch real alerts from Supabase
  const alerts = await fetchAlertsFromSupabase(supabase, dateRange.startDate, dateRange.endDate)

  // Device health: use last reading timestamp from real data
  const deviceHealth = pipes.map(pipe => {
    const flowData = allPipesData.get(pipe.id) || []
    const lastReading = flowData.length > 0 ? flowData[flowData.length - 1].timestamp : new Date(pipe.lastUpdated)
    const hasRecentData = flowData.length > 0

    return {
      pipeId: pipe.id,
      deviceName: `Nivus-750-${pipe.pipeNumber}`,
      batteryLevel: pipe.parameters.batteryLevel,
      signalStrength: pipe.parameters.signalStrength,
      status: hasRecentData ? 'online' : 'offline',
      lastCommunication: lastReading,
    }
  })

  return {
    reportType,
    dateRange,
    generatedAt: new Date(),
    summary: {
      totalFlowVolume: Math.round(totalFlowVolume * 100) / 100,
      avgFlowRate: Math.round(avgFlowRate * 100) / 100,
      activeDevices,
      totalDevices,
      offlineDevices,
      alertsTriggered: alerts.length,
    },
    pipeStatistics,
    hourlyData,
    dailyData,
    isSingleDay: singleDay,
    alerts,
    pipeHourlyData,
    deviceHealth,
  }
}

// Convert any Date to IST by applying UTC+5:30 offset
function toIST(date: Date): Date {
  // Get UTC time, then add 5h30m to get IST
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000
  return new Date(utcMs + 5.5 * 3600 * 1000)
}

// Format date as YYYY-MM-DD in IST (for file paths, database records)
export function formatISTDateStr(date: Date): string {
  const ist = toIST(date)
  const y = ist.getFullYear()
  const m = String(ist.getMonth() + 1).padStart(2, '0')
  const d = String(ist.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Format date for display in IST (Indian Standard Time)
export function formatDate(date: Date): string {
  const ist = toIST(date)
  const day = ist.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[ist.getMonth()]
  const year = ist.getFullYear()
  return `${day} ${month} ${year}`
}

// Format datetime for display in IST (Indian Standard Time)
export function formatDateTime(date: Date): string {
  const ist = toIST(date)
  const day = ist.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[ist.getMonth()]
  const year = ist.getFullYear()
  let hours = ist.getHours()
  const minutes = ist.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm} IST`
}
