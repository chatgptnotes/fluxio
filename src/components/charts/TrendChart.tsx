'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface TrendDataPoint {
  created_at: string
  flow_rate: number | null
}

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d'

interface TrendChartProps {
  data: TrendDataPoint[]
  className?: string
  /** Default selected time range */
  defaultRange?: TimeRange
  /** Called when time range changes, with hours value */
  onRangeChange?: (hours: number) => void
}

const RANGES: { key: TimeRange; label: string; hours: number }[] = [
  { key: '1h', label: '1H', hours: 1 },
  { key: '6h', label: '6H', hours: 6 },
  { key: '24h', label: '24H', hours: 24 },
  { key: '7d', label: '7D', hours: 168 },
  { key: '30d', label: '30D', hours: 720 },
]

function formatAxisTime(ts: string, range: TimeRange) {
  const d = new Date(ts)
  if (range === '7d' || range === '30d') {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' })
  }
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}

export function TrendChart({
  data,
  className = '',
  defaultRange = '24h',
  onRangeChange,
}: TrendChartProps) {
  const [range, setRange] = useState<TimeRange>(defaultRange)

  const handleRangeChange = (newRange: TimeRange) => {
    setRange(newRange)
    const hours = RANGES.find((r) => r.key === newRange)?.hours ?? 24
    onRangeChange?.(hours)
  }

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const rangeConfig = RANGES.find((r) => r.key === range)
    const cutoff = new Date(Date.now() - (rangeConfig?.hours ?? 24) * 60 * 60 * 1000)

    const filtered = data
      .filter((d) => new Date(d.created_at) >= cutoff)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((d) => ({
        timestamp: d.created_at,
        flowRate: d.flow_rate != null ? d.flow_rate * 3600 : 0,
      }))

    // Downsample if too many points for chart performance (max ~500 points)
    const MAX_POINTS = 500
    if (filtered.length <= MAX_POINTS) return filtered

    const bucketSize = Math.ceil(filtered.length / MAX_POINTS)
    const downsampled: typeof filtered = []
    for (let i = 0; i < filtered.length; i += bucketSize) {
      const bucket = filtered.slice(i, i + bucketSize)
      const avgFlow = bucket.reduce((sum, p) => sum + p.flowRate, 0) / bucket.length
      // Use the middle timestamp of the bucket for better time representation
      downsampled.push({
        timestamp: bucket[Math.floor(bucket.length / 2)].timestamp,
        flowRate: avgFlow,
      })
    }
    return downsampled
  }, [data, range])

  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <span className="material-icons text-purple-500" style={{ fontSize: '20px' }}>trending_up</span>
          Flow Rate Trend
        </h3>
        <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRangeChange(r.key)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r.key
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          No data for selected time range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(ts) => formatAxisTime(ts, range)}
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
            formatter={(value: any) => [`${Number(value ?? 0).toFixed(2)} m\u00B3/h`, 'Flow Rate']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Area
              type="monotone"
              dataKey="flowRate"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#flowGradient)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
