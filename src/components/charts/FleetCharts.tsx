'use client'

import { Card } from '@/components/ui/Card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react'

interface CompanySummary {
  name: string
  totalFlow: number
  alerts: number
  online: number
  total: number
}

interface FleetChartsProps {
  companies: CompanySummary[]
}

const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

export function FleetCharts({ companies }: FleetChartsProps) {
  // Sorting for "Top Companies by Volume"
  const sortedByFlow = [...companies].sort((a, b) => b.totalFlow - a.totalFlow).slice(0, 5)

  return (
    <div className="mb-8 grid gap-6 lg:grid-cols-2">
      {/* Top Companies by Volume Chart */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">Top Companies by Volume</h3>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">m³ (Total)</span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sortedByFlow} layout="vertical" margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fontWeight: 500, fill: '#4b5563' }}
                width={80}
              />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number | string | (number | string)[]) => {
                  const val = Array.isArray(value) ? value[0] : value;
                  return [`${Number(val).toLocaleString()} m³`, 'Total Flow'];
                }}
              />
              <Bar dataKey="totalFlow" radius={[0, 4, 4, 0]} barSize={24}>
                {sortedByFlow.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Fleet Alert Heatmap / Status Chart */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">Fleet Security & Health</h3>
          </div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Alerts</span>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={companies} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="alerts" name="Active Alerts" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="online" name="Online Devices" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
