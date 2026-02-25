'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface TotalizerDataPoint {
  device_id: string
  totalizer: number | null
}

interface TotalizerChartProps {
  data: TotalizerDataPoint[]
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

export function TotalizerChart({ data, className = '' }: TotalizerChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Get latest totalizer per device
    const deviceMap = new Map<string, number>()
    for (const point of data) {
      if (point.totalizer != null) {
        deviceMap.set(point.device_id, point.totalizer)
      }
    }

    return Array.from(deviceMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([device_id, totalizer]) => ({
        device_id,
        label: DEVICE_LABELS[device_id] || device_id,
        totalizer,
        color: DEVICE_COLORS[device_id] || '#6b7280',
      }))
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className={`rounded-xl bg-white p-6 shadow-sm border border-gray-200 ${className}`}>
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <span className="material-icons text-green-500" style={{ fontSize: '20px' }}>bar_chart</span>
          Totalizer by Device
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
          No totalizer data available
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl bg-white p-6 shadow-sm border border-gray-200 ${className}`}>
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="material-icons text-green-500" style={{ fontSize: '20px' }}>bar_chart</span>
        Totalizer by Device (m&#179;)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            label={{ value: 'm\u00B3', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }}
          />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: any) => [`${Number(value ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })} m\u00B3`, 'Totalizer']}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
          <Bar dataKey="totalizer" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {chartData.map((entry) => (
              <Cell key={entry.device_id} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
