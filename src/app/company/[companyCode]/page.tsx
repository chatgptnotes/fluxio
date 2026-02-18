'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  FileText,
  Radio,
  Settings,
  Droplet,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime, isDeviceOnline } from '@/lib/utils'
import type { Database } from '@/types/database'

type Device = Database['public']['Tables']['devices']['Row'] & {
  latest_data?: {
    flow_rate: number | null
    totalizer: number | null
    created_at: string
  } | null
}

type Alert = Database['public']['Tables']['alerts']['Row']

interface CompanyData {
  name: string
  code: string
  description: string
}

const COMPANIES: Record<string, CompanyData> = {
  cstps: {
    name: 'CSTPS',
    code: 'CSTPS',
    description: 'Chandrapur Super Thermal Power Station',
  },
}

export default function CompanyDashboardPage() {
  const params = useParams()
  const companyCode = (params.companyCode as string)?.toLowerCase()
  const company = COMPANIES[companyCode]

  const [devices, setDevices] = useState<Device[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'alarms' | 'reports' | 'devices'>('overview')

  const supabase = createClient()

  useEffect(() => {
    fetchData()

    // Real-time subscription for alerts
    const alertsChannel = supabase
      .channel('company_alerts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        () => fetchAlerts()
      )
      .subscribe()

    return () => {
      alertsChannel.unsubscribe()
    }
  }, [companyCode])

  async function fetchData() {
    await Promise.all([fetchDevices(), fetchAlerts()])
    setLoading(false)
  }

  async function fetchDevices() {
    const response = await fetch('/api/devices')
    if (response.ok) {
      const result = await response.json()
      setDevices(result.data || [])
    }
  }

  async function fetchAlerts() {
    const response = await fetch('/api/alerts?is_resolved=false&limit=20')
    if (response.ok) {
      const result = await response.json()
      setAlerts(result.data || [])
    }
  }

  if (!company) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Company Not Found</h2>
          <p className="mt-2 text-gray-600">The company "{companyCode}" does not exist.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-primary-600" />
          <p className="mt-4 text-gray-600">Loading {company.name} dashboard...</p>
        </div>
      </div>
    )
  }

  const onlineDevices = devices.filter(d => isDeviceOnline(d.last_seen)).length
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

  const tabs: Array<{ id: string; label: string; icon: typeof Activity; href?: string; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'pipeline', label: 'Pipeline', icon: Radio, href: '/cstps-pipeline' },
    { id: 'alarms', label: 'Alarms', icon: Bell, count: alerts.length },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'devices', label: 'Devices', icon: Settings, count: devices.length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                <p className="text-sm text-gray-500">{company.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 rounded-full bg-green-100 px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-600"></div>
                <span className="text-sm font-medium text-green-800">Live</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="mt-4 flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id

              if (tab.href) {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        isActive ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </Link>
                )
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      isActive ? 'bg-primary-200 text-primary-800' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid gap-6 md:grid-cols-4">
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Devices</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900">{devices.length}</p>
                  </div>
                  <div className="rounded-lg bg-blue-100 p-3">
                    <Radio className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Online</p>
                    <p className="mt-1 text-3xl font-bold text-green-600">{onlineDevices}</p>
                  </div>
                  <div className="rounded-lg bg-green-100 p-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                    <p className="mt-1 text-3xl font-bold text-amber-600">{alerts.length}</p>
                  </div>
                  <div className="rounded-lg bg-amber-100 p-3">
                    <Bell className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </div>
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Critical</p>
                    <p className="mt-1 text-3xl font-bold text-red-600">{criticalAlerts}</p>
                  </div>
                  <div className="rounded-lg bg-red-100 p-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Link
                href="/cstps-pipeline"
                className="group rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg transition-transform hover:scale-105"
              >
                <Radio className="h-8 w-8 mb-3" />
                <h3 className="text-lg font-semibold">Pipeline Monitor</h3>
                <p className="mt-1 text-sm text-blue-100">View real-time flow data</p>
              </Link>
              <button
                onClick={() => setActiveTab('alarms')}
                className="group rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-lg transition-transform hover:scale-105 text-left"
              >
                <Bell className="h-8 w-8 mb-3" />
                <h3 className="text-lg font-semibold">Alarms</h3>
                <p className="mt-1 text-sm text-amber-100">{alerts.length} active alerts</p>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="group rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg transition-transform hover:scale-105 text-left"
              >
                <FileText className="h-8 w-8 mb-3" />
                <h3 className="text-lg font-semibold">Reports</h3>
                <p className="mt-1 text-sm text-purple-100">Generate and view reports</p>
              </button>
              <button
                onClick={() => setActiveTab('devices')}
                className="group rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg transition-transform hover:scale-105 text-left"
              >
                <Settings className="h-8 w-8 mb-3" />
                <h3 className="text-lg font-semibold">Devices</h3>
                <p className="mt-1 text-sm text-green-100">{devices.length} installed devices</p>
              </button>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Alerts */}
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  {alerts.slice(0, 5).map((alert) => (
                    <div key={alert.id} className="flex items-start space-x-3 rounded-lg bg-gray-50 p-3">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-500' :
                        alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{alert.message}</p>
                        <p className="text-xs text-gray-500">{alert.device_id} - {formatRelativeTime(alert.created_at)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        alert.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
                      <p className="mt-2 text-sm text-gray-600">No active alerts</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Device Status */}
              <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h3>
                <div className="space-y-3">
                  {devices.slice(0, 5).map((device) => {
                    const online = isDeviceOnline(device.last_seen)
                    return (
                      <div key={device.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                        <div className="flex items-center space-x-3">
                          <div className={`h-3 w-3 rounded-full ${online ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{device.device_name}</p>
                            <p className="text-xs text-gray-500">{device.device_id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {device.latest_data?.flow_rate !== undefined ? (
                            <p className="text-sm font-semibold text-gray-900">
                              {((device.latest_data.flow_rate ?? 0) * 3600).toFixed(2)} m³/h
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">No data</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alarms Tab */}
        {activeTab === 'alarms' && (
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Active Alarms</h2>
              <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                {alerts.length} active
              </span>
            </div>
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start justify-between rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start space-x-4">
                    <AlertTriangle className={`h-6 w-6 mt-0.5 ${
                      alert.severity === 'critical' ? 'text-red-500' :
                      alert.severity === 'warning' ? 'text-amber-500' : 'text-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Device: {alert.device_id} | Type: {alert.alert_type}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        <Clock className="inline h-3 w-3 mr-1" />
                        {formatRelativeTime(alert.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">All Clear</h3>
                  <p className="mt-2 text-gray-500">No active alarms at this time.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
              <Link
                href={`/cstps-pipeline/${devices[0]?.device_id || 'NIVUS_750_001'}`}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <FileText className="h-4 w-4" />
                <span>Generate Report</span>
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-lg border border-gray-200 p-6 hover:border-primary-300 cursor-pointer transition-colors">
                <TrendingUp className="h-8 w-8 text-blue-500 mb-3" />
                <h3 className="font-semibold text-gray-900">Flow Summary</h3>
                <p className="text-sm text-gray-500 mt-1">Daily, weekly, monthly flow reports</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-6 hover:border-primary-300 cursor-pointer transition-colors">
                <AlertTriangle className="h-8 w-8 text-amber-500 mb-3" />
                <h3 className="font-semibold text-gray-900">Alarm History</h3>
                <p className="text-sm text-gray-500 mt-1">Historical alarm data and trends</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-6 hover:border-primary-300 cursor-pointer transition-colors">
                <Droplet className="h-8 w-8 text-green-500 mb-3" />
                <h3 className="font-semibold text-gray-900">Device Performance</h3>
                <p className="text-sm text-gray-500 mt-1">Uptime and performance metrics</p>
              </div>
            </div>
          </div>
        )}

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Installed Devices</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                {devices.length} devices
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Device Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Device ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Flow Rate</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => {
                    const online = isDeviceOnline(device.last_seen)
                    return (
                      <tr key={device.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className={`h-3 w-3 rounded-full ${online ? 'bg-green-500' : 'bg-gray-300'}`} />
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-gray-900">{device.device_name}</p>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">{device.device_id}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">{device.location || '-'}</td>
                        <td className="py-4 px-4">
                          {device.latest_data?.flow_rate !== undefined ? (
                            <span className="font-semibold text-gray-900">
                              {((device.latest_data.flow_rate ?? 0) * 3600).toFixed(2)} m³/h
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500">
                          {device.last_seen ? formatRelativeTime(device.last_seen) : 'Never'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {devices.length === 0 && (
                <div className="text-center py-12">
                  <Radio className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Devices</h3>
                  <p className="mt-2 text-gray-500">No devices have been registered for this company.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400">
            FlowNexus v1.6 | February 1, 2026 | flownexus
          </p>
        </div>
      </footer>
    </div>
  )
}
