'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface FlowDataPoint {
  created_at: string
  device_id: string
  flow_rate: number | null
}

interface FlowRateChartProps {
  data: FlowDataPoint[]
  className?: string
}

const DEVICE_COLORS: Record<string, string> = {
  NIVUS_750_001: '#22d3ee',
  NIVUS_750_002: '#8b5cf6',
  NIVUS_750_003: '#10b981',
  NIVUS_750_004: '#f59e0b',
  NIVUS_750_005: '#ef4444',
  NIVUS_750_006: '#ec4899',
}

const DEVICE_LABELS: Record<string, string> = {
  NIVUS_750_001: 'FT-001',
  NIVUS_750_002: 'FT-002',
  NIVUS_750_003: 'FT-003',
  NIVUS_750_004: 'FT-004',
  NIVUS_750_005: 'FT-005',
  NIVUS_750_006: 'FT-006',
}

function formatTime(ts: string) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  })
}

export function FlowRateChart({ data, className = '' }: FlowRateChartProps) {
  const { chartData, deviceIds } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], deviceIds: [] }

    const deviceSet = new Set<string>()
    const timeMap = new Map<string, Record<string, number | null>>()

    for (const point of data) {
      deviceSet.add(point.device_id)
      const timeKey = point.created_at
      if (!timeMap.has(timeKey)) {
        timeMap.set(timeKey, { time: null } as unknown as Record<string, number | null>)
      }
      const entry = timeMap.get(timeKey)!
      // Convert m3/s to m3/h
      entry[point.device_id] = point.flow_rate != null ? point.flow_rate * 3600 : null
    }

    // Group by rounded minute buckets for cleaner visualization
    const bucketMap = new Map<number, Record<string, number | null>>()
    for (const [ts, values] of timeMap) {
      const d = new Date(ts)
      const bucket = Math.floor(d.getTime() / 60000) * 60000
      if (!bucketMap.has(bucket)) {
        bucketMap.set(bucket, {})
      }
      const existing = bucketMap.get(bucket)!
      for (const [key, val] of Object.entries(values)) {
        if (val !== null) {
          existing[key] = val as number
        }
      }
    }

    const sorted = Array.from(bucketMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([bucket, values]) => ({
        timestamp: new Date(bucket).toISOString(),
        ...values,
      }))

    return { chartData: sorted, deviceIds: Array.from(deviceSet).sort() }
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className={`rounded-xl bg-white p-6 shadow-sm border border-gray-200 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="material-icons text-blue-500" style={{ fontSize: '20px' }}>show_chart</span>
          Flow Rate Over Time
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          No flow data available
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm border border-gray-200 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="material-icons text-blue-500" style={{ fontSize: '20px' }}>show_chart</span>
        Flow Rate Over Time (m\u00B3/h)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatTime}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            label={{ value: 'm\u00B3/h', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }}
          />
          <Tooltip
            labelFormatter={(label) => {
              const d = new Date(label as string)
              return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any, name: any) => [
              `${Number(value ?? 0).toFixed(2)} m\u00B3/h`,
              DEVICE_LABELS[String(name)] || String(name),
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Legend
            formatter={(value: string) => DEVICE_LABELS[value] || value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {deviceIds.map((id) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              stroke={DEVICE_COLORS[id] || '#6b7280'}
              strokeWidth={2}
              dot={false}
              connectNulls
              name={id}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
