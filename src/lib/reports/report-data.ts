// Report Data Aggregation Utilities
import { cstpsPipes, NivusSensor } from '../cstps-data'

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
  alerts: AlertSummary[]
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
    deviceName: pipe.deviceName,
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

// Generate mock alerts based on device status
function generateAlerts(
  pipes: NivusSensor[],
  dateRange: ReportDateRange
): AlertSummary[] {
  const alerts: AlertSummary[] = []

  pipes.forEach((pipe) => {
    if (pipe.status === 'offline') {
      alerts.push({
        type: 'critical',
        count: 1,
        description: `${pipe.deviceName} - Device Offline`,
        timestamp: new Date(dateRange.startDate.getTime() + Math.random() * (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
      })
    }

    if (pipe.status === 'warning') {
      alerts.push({
        type: 'warning',
        count: 1,
        description: `${pipe.deviceName} - Low Battery (${pipe.parameters.batteryLevel}%)`,
        timestamp: new Date(dateRange.startDate.getTime() + Math.random() * (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
      })
    }

    if (pipe.parameters.signalStrength < -70) {
      alerts.push({
        type: 'warning',
        count: 1,
        description: `${pipe.deviceName} - Weak Signal (${pipe.parameters.signalStrength} dBm)`,
        timestamp: new Date(dateRange.startDate.getTime() + Math.random() * (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
      })
    }

    // Random flow alerts
    if (pipe.parameters.flowRate > 100 && Math.random() > 0.7) {
      alerts.push({
        type: 'info',
        count: 1,
        description: `${pipe.deviceName} - High Flow Rate Detected`,
        timestamp: new Date(dateRange.startDate.getTime() + Math.random() * (dateRange.endDate.getTime() - dateRange.startDate.getTime())),
      })
    }
  })

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// Get date range presets
export function getDateRangePreset(preset: string): ReportDateRange {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: now,
        label: 'Today',
      }
    case 'yesterday':
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return {
        startDate: yesterday,
        endDate: today,
        label: 'Yesterday',
      }
    case 'thisWeek':
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      return {
        startDate: weekStart,
        endDate: now,
        label: 'This Week',
      }
    case 'lastWeek':
      const lastWeekEnd = new Date(today)
      lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay())
      const lastWeekStart = new Date(lastWeekEnd)
      lastWeekStart.setDate(lastWeekStart.getDate() - 7)
      return {
        startDate: lastWeekStart,
        endDate: lastWeekEnd,
        label: 'Last Week',
      }
    case 'thisMonth':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return {
        startDate: monthStart,
        endDate: now,
        label: 'This Month',
      }
    case 'lastMonth':
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return {
        startDate: lastMonthStart,
        endDate: lastMonthEnd,
        label: 'Last Month',
      }
    default:
      return {
        startDate: today,
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

  // Generate alerts
  const alerts = generateAlerts(pipes, dateRange)

  // Device health
  const deviceHealth = pipes.map((pipe) => ({
    pipeId: pipe.id,
    deviceName: pipe.deviceName,
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
    alerts,
    deviceHealth,
  }
}

// Format date for display
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Format datetime for display
export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
