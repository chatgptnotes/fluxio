'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { cstpsPipes as staticCstpsPipes, NivusSensor } from '@/lib/cstps-data'

// Map device_id to pipe number and static data
const deviceToPipeMap: Record<string, { pipeNumber: number; staticIndex: number }> = {
  'NIVUS_750_001': { pipeNumber: 1, staticIndex: 0 },
  'NIVUS_750_002': { pipeNumber: 2, staticIndex: 1 },
  'NIVUS_750_003': { pipeNumber: 3, staticIndex: 2 },
  'NIVUS_750_004': { pipeNumber: 4, staticIndex: 3 },
  'NIVUS_750_005': { pipeNumber: 5, staticIndex: 4 },
  'NIVUS_750_006': { pipeNumber: 6, staticIndex: 5 },
}

// Timeout thresholds (in minutes)
const OFFLINE_THRESHOLD_MINUTES = 5
const WARNING_THRESHOLD_MINUTES = 3

interface FlowDataRecord {
  device_id: string
  flow_rate: number | null
  totalizer: number | null
  temperature: number | null
  pressure: number | null
  battery_level: number | null
  signal_strength: number | null
  created_at: string
  metadata?: {
    velocity?: number
    water_level?: number
    level?: number
    [key: string]: unknown
  }
}

interface PipeReading {
  id: string
  pipeNumber: number
  deviceId: string
  deviceName: string
  status: 'online' | 'warning' | 'offline'
  flowRate: number
  velocity: number
  waterLevel: number
  temperature: number
  totalizer: number
  lastUpdated: string
}

type TimeRange = '1h' | '5h' | '12h' | '24h' | 'tilldate'

const TIME_RANGES: { key: TimeRange; label: string; hours: number }[] = [
  { key: '1h', label: '1 Hr', hours: 1 },
  { key: '5h', label: '5 Hrs', hours: 5 },
  { key: '12h', label: '12 Hrs', hours: 12 },
  { key: '24h', label: '24 Hrs', hours: 24 },
  { key: 'tilldate', label: 'Till Date', hours: 0 },
]

function convertToReading(record: FlowDataRecord | null, staticPipe: NivusSensor): PipeReading {
  if (!record) {
    return {
      id: staticPipe.id,
      pipeNumber: staticPipe.pipeNumber,
      deviceId: staticPipe.deviceId,
      deviceName: staticPipe.deviceName,
      status: 'offline',
      flowRate: 0,
      velocity: 0,
      waterLevel: 0,
      temperature: 0,
      totalizer: 0,
      lastUpdated: '',
    }
  }

  let status: 'online' | 'warning' | 'offline' = 'online'
  const lastUpdate = new Date(record.created_at)
  const now = new Date()
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

  if (minutesSinceUpdate > OFFLINE_THRESHOLD_MINUTES) {
    status = 'offline'
  } else if (minutesSinceUpdate > WARNING_THRESHOLD_MINUTES) {
    status = 'warning'
  } else if ((record.battery_level ?? 100) < 30) {
    status = 'warning'
  }

  const velocity = record.metadata?.velocity ?? 0
  const waterLevel = record.metadata?.water_level ?? record.metadata?.level ?? 0

  if (status === 'offline') {
    return {
      id: staticPipe.id,
      pipeNumber: staticPipe.pipeNumber,
      deviceId: staticPipe.deviceId,
      deviceName: staticPipe.deviceName,
      status: 'offline',
      flowRate: 0,
      velocity: 0,
      waterLevel: 0,
      temperature: 0,
      totalizer: 0,
      lastUpdated: record.created_at,
    }
  }

  return {
    id: staticPipe.id,
    pipeNumber: staticPipe.pipeNumber,
    deviceId: staticPipe.deviceId,
    deviceName: staticPipe.deviceName,
    status,
    flowRate: record.flow_rate ?? 0,
    velocity,
    waterLevel,
    temperature: record.temperature ?? 0,
    totalizer: record.totalizer ?? 0,
    lastUpdated: record.created_at,
  }
}

export default function CSTRSReadingsPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [readings, setReadings] = useState<PipeReading[]>([])
  const [totalizerValues, setTotalizerValues] = useState<Record<string, number>>({})
  const [selectedRange, setSelectedRange] = useState<TimeRange>('tilldate')
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [loadingTotalizer, setLoadingTotalizer] = useState(false)

  // Auth check
  useEffect(() => {
    if (!isLoading && user) {
      const hasAccess = user.isSuperadmin || user.permissions?.canAccessReadings
      if (!hasAccess) {
        router.push('/unauthorized')
      }
    }
  }, [user, isLoading, router])

  // Clock
  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch totalizer data for selected time range
  const fetchTotalizer = useCallback(async (range: TimeRange) => {
    setLoadingTotalizer(true)
    try {
      const hours = TIME_RANGES.find((r) => r.key === range)?.hours ?? 0
      const response = await fetch(`/api/flow-data/totalizer?hours=${hours}`)
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const map: Record<string, number> = {}
          for (const item of result.data) {
            map[item.device_id] = item.totalizer_value
          }
          setTotalizerValues(map)
        }
      }
    } catch (err) {
      console.warn('Failed to fetch totalizer data:', err)
    } finally {
      setLoadingTotalizer(false)
    }
  }, [])

  // Fetch initial data and subscribe to real-time updates
  useEffect(() => {
    const supabase = createClient()
    let subscription: ReturnType<typeof supabase.channel> | null = null

    async function fetchLatestData() {
      try {
        const response = await fetch('/api/flow-data?limit=100')
        if (!response.ok) {
          const offlineReadings = staticCstpsPipes.map((sp) => convertToReading(null, sp))
          setReadings(offlineReadings)
          return
        }

        const result = await response.json()
        const deviceIds = Object.keys(deviceToPipeMap)
        const latestByDevice: Record<string, FlowDataRecord> = {}

        if (result.success && result.data && result.data.length > 0) {
          const flowDataRecords = (result.data as FlowDataRecord[]).filter(
            (record) => deviceIds.includes(record.device_id)
          )
          for (const record of flowDataRecords) {
            if (!latestByDevice[record.device_id]) {
              latestByDevice[record.device_id] = record
            }
          }
        }

        const updatedReadings = staticCstpsPipes.map((sp) => {
          const latestRecord = latestByDevice[sp.deviceId] || null
          return convertToReading(latestRecord, sp)
        })

        setReadings(updatedReadings)
      } catch (err) {
        console.warn('Failed to fetch flow data:', err)
        const offlineReadings = staticCstpsPipes.map((sp) => convertToReading(null, sp))
        setReadings(offlineReadings)
      }
    }

    function subscribeToUpdates() {
      const deviceIds = Object.keys(deviceToPipeMap)
      subscription = supabase
        .channel('cstps-readings-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'flow_data',
            filter: `device_id=in.(${deviceIds.join(',')})`,
          },
          (payload) => {
            const newRecord = payload.new as FlowDataRecord
            const mapping = deviceToPipeMap[newRecord.device_id]
            if (mapping) {
              const staticPipe = staticCstpsPipes[mapping.staticIndex]
              const updatedReading = convertToReading(newRecord, staticPipe)
              setReadings((prev) =>
                prev.map((r) =>
                  r.deviceId === newRecord.device_id ? updatedReading : r
                )
              )
            }
          }
        )
        .subscribe()
    }

    fetchLatestData()
    subscribeToUpdates()

    const refreshInterval = setInterval(fetchLatestData, 30000)

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription)
      }
      clearInterval(refreshInterval)
    }
  }, [])

  // Fetch totalizer on mount and when range changes
  useEffect(() => {
    fetchTotalizer(selectedRange)
  }, [selectedRange, fetchTotalizer])

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-[#1565C0] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[#424242] text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // Auth guard
  if (!user || !(user.isSuperadmin || user.permissions?.canAccessReadings)) {
    return null
  }

  const statusColor = (status: string) => {
    if (status === 'online') return '#4CAF50'
    if (status === 'warning') return '#FFC107'
    return '#F44336'
  }

  const statusLabel = (status: string) => {
    if (status === 'online') return 'ONLINE'
    if (status === 'warning') return 'WARNING'
    return 'OFFLINE'
  }

  const formatTimestamp = (ts: string) => {
    if (!ts) return '--'
    const d = new Date(ts)
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false })
  }

  const totalizerLabel = selectedRange === 'tilldate' ? 'Total (Till Date)' : `Consumption (${TIME_RANGES.find(r => r.key === selectedRange)?.label})`

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="border-b-2 border-[#0288D1] bg-gradient-to-r from-[#1565C0] via-[#1976D2] to-[#1565C0]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Link
              href="/cstps-pipeline"
              className="flex items-center rounded bg-white/20 px-4 py-1.5 text-sm text-white transition-all hover:bg-white/30 border border-white/30"
            >
              <span className="material-icons text-sm mr-1">arrow_back</span>
              <span className="font-medium">Back to SCADA</span>
            </Link>
            <div className="h-6 w-px bg-white/30"></div>
            <div className="flex items-center space-x-2">
              <span className="material-icons text-white text-xl">sensors</span>
              <h1 className="text-lg font-bold tracking-wide text-white">
                Flow Meter Readings
              </h1>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="hidden md:block rounded bg-white/20 px-3 py-1 font-mono text-white border border-white/30 text-xs">
              {currentTime ? currentTime.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' }) : '--/--/----'}
            </div>
            <div className="rounded bg-white/20 px-3 py-1 font-mono text-white border border-white/30 text-xs">
              {currentTime ? currentTime.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata' }) : '--:--:--'}
            </div>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <span className="material-icons text-sm">person</span>
              <span>{user.fullName}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Time Range Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#263238]">CSTPS NIVUS Sensor Readings</h2>
            <p className="text-sm text-[#757575]">Real-time data from 6 flow transmitters</p>
          </div>
          <div className="flex items-center bg-white rounded-lg border border-[#BDBDBD] shadow-sm overflow-hidden">
            {TIME_RANGES.map((range) => (
              <button
                key={range.key}
                onClick={() => setSelectedRange(range.key)}
                className={`px-4 py-2 text-sm font-medium transition-all border-r border-[#E0E0E0] last:border-r-0 ${
                  selectedRange === range.key
                    ? 'bg-[#1565C0] text-white'
                    : 'text-[#424242] hover:bg-[#E3F2FD]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Flow Meter Cards - 2x3 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {readings.map((reading) => {
            const hasFlow = reading.status !== 'offline' && reading.flowRate > 0
            const totVal = totalizerValues[reading.deviceId] ?? 0
            return (
              <div
                key={reading.id}
                className="rounded-lg border border-[#BDBDBD] bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-[#EEEEEE] border-b border-[#E0E0E0]">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-icons text-[#1565C0]">speed</span>
                      <div>
                        <div className="text-sm font-bold text-[#263238] font-mono">
                          FT-{String(reading.pipeNumber).padStart(3, '0')}
                        </div>
                        <div className="text-[10px] text-[#757575]">{reading.deviceName}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        color: statusColor(reading.status),
                        backgroundColor: reading.status === 'online' ? '#E8F5E9'
                          : reading.status === 'warning' ? '#FFF8E1' : '#FFEBEE',
                      }}
                    >
                      {statusLabel(reading.status)}
                    </span>
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{
                        backgroundColor: statusColor(reading.status),
                        boxShadow: hasFlow ? `0 0 8px ${statusColor(reading.status)}` : 'none',
                        animation: hasFlow ? 'pulse 1.5s infinite' : 'none',
                      }}
                    ></div>
                  </div>
                </div>

                {/* Current Readings Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#0D1B2A] rounded-lg px-3 py-2">
                      <div className="text-[10px] text-[#90CAF9] font-mono mb-1">FLOW RATE</div>
                      <div className={`text-lg font-bold font-mono ${hasFlow ? 'text-[#00E5FF]' : 'text-[#546E7A]'}`}>
                        {reading.flowRate.toFixed(1)}
                        <span className="text-[10px] text-[#4FC3F7] font-normal ml-1">m3/h</span>
                      </div>
                    </div>
                    <div className="bg-[#0D1B2A] rounded-lg px-3 py-2">
                      <div className="text-[10px] text-[#90CAF9] font-mono mb-1">VELOCITY</div>
                      <div className={`text-lg font-bold font-mono ${hasFlow ? 'text-[#00E5FF]' : 'text-[#546E7A]'}`}>
                        {reading.velocity.toFixed(2)}
                        <span className="text-[10px] text-[#4FC3F7] font-normal ml-1">m/s</span>
                      </div>
                    </div>
                    <div className="bg-[#0D1B2A] rounded-lg px-3 py-2">
                      <div className="text-[10px] text-[#90CAF9] font-mono mb-1">WATER LEVEL</div>
                      <div className="text-lg font-bold font-mono text-[#00E5FF]">
                        {reading.waterLevel}
                        <span className="text-[10px] text-[#4FC3F7] font-normal ml-1">mm</span>
                      </div>
                    </div>
                    <div className="bg-[#0D1B2A] rounded-lg px-3 py-2">
                      <div className="text-[10px] text-[#90CAF9] font-mono mb-1">TEMPERATURE</div>
                      <div className="text-lg font-bold font-mono text-[#00E5FF]">
                        {reading.temperature.toFixed(1)}
                        <span className="text-[10px] text-[#4FC3F7] font-normal ml-1">&deg;C</span>
                      </div>
                    </div>
                  </div>

                  {/* Totalizer Section */}
                  <div className="bg-[#0D1B2A] rounded-lg px-3 py-3 border border-[#1565C0]">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-[#90CAF9] font-mono">{totalizerLabel.toUpperCase()}</div>
                      {loadingTotalizer && (
                        <div className="h-3 w-3 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <div className="text-xl font-bold font-mono text-[#00E5FF]">
                      {totVal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      <span className="text-xs text-[#4FC3F7] font-normal ml-1">m3</span>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="mt-3 flex items-center gap-1 text-[10px] text-[#9E9E9E]">
                    <span className="material-icons text-xs">schedule</span>
                    <span>Last updated: {formatTimestamp(reading.lastUpdated)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-[10px] text-[#90A4AE]">
        FlowNexus v1.4 | February 12, 2026 | flownexus
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
