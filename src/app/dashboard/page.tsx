'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Droplet,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatsCard } from '@/components/dashboard/StatsCard'
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
type DashboardSummary =
  Database['public']['Views']['dashboard_summary']['Row']

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  // Fetch initial data
  useEffect(() => {
    fetchData()

    // Set up real-time subscriptions
    const flowDataChannel = supabase
      .channel('flow_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'flow_data',
        },
        () => {
          fetchData()
        }
      )
      .subscribe()

    const alertsChannel = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          fetchAlerts()
          fetchSummary()
        }
      )
      .subscribe()

    return () => {
      flowDataChannel.unsubscribe()
      alertsChannel.unsubscribe()
    }
  }, [])

  async function fetchData() {
    await Promise.all([fetchDevices(), fetchAlerts(), fetchSummary()])
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
    const response = await fetch('/api/alerts?is_resolved=false&limit=10')
    if (response.ok) {
      const result = await response.json()
      setAlerts(result.data || [])
    }
  }

  async function fetchSummary() {
    const { data } = await supabase
      .from('dashboard_summary')
      .select('*')
      .single()

    if (data) {
      setSummary(data)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 animate-pulse text-primary-600" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">FluxIO</h1>
              <p className="mt-1 text-sm text-gray-500">
                Real-time Flow Monitoring Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 rounded-full bg-green-100 px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-600"></div>
                <span className="text-sm font-medium text-green-800">Live</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Devices"
            value={summary?.total_devices || 0}
            icon={Droplet}
            color="blue"
          />
          <StatsCard
            title="Online Devices"
            value={summary?.online_devices || 0}
            icon={CheckCircle2}
            color="green"
          />
          <StatsCard
            title="Active Alerts"
            value={summary?.active_alerts || 0}
            icon={AlertTriangle}
            color="yellow"
          />
          <StatsCard
            title="Critical Alerts"
            value={summary?.critical_alerts || 0}
            icon={AlertTriangle}
            color="red"
          />
        </div>

        {/* Devices and Alerts Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Devices List */}
          <Card
            title="Devices"
            subtitle={`${devices.length} flow transmitters`}
          >
            <div className="space-y-4">
              {devices.length === 0 ? (
                <p className="text-center text-sm text-gray-500">
                  No devices found. Add a device to get started.
                </p>
              ) : (
                devices.map((device) => {
                  const online = isDeviceOnline(device.last_seen)
                  return (
                    <div
                      key={device.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`h-3 w-3 rounded-full ${
                            online ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {device.device_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {device.device_id}
                          </p>
                          {device.location && (
                            <p className="text-xs text-gray-400">
                              {device.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {device.latest_data ? (
                          <>
                            <p className="text-lg font-semibold text-gray-900">
                              {device.latest_data.flow_rate?.toFixed(2) || '-'}{' '}
                              <span className="text-sm font-normal text-gray-500">
                                m³/h
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatRelativeTime(
                                device.latest_data.created_at
                              )}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-400">No data</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* Recent Alerts */}
          <Card
            title="Recent Alerts"
            subtitle={`${alerts.filter((a) => !a.is_resolved).length} active`}
          >
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                  <p className="mt-2 text-sm text-gray-600">
                    No active alerts
                  </p>
                  <p className="text-xs text-gray-400">
                    All systems operating normally
                  </p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-gray-200 p-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle
                          className={`mt-0.5 h-4 w-4 ${
                            alert.severity === 'critical'
                              ? 'text-red-500'
                              : alert.severity === 'warning'
                                ? 'text-yellow-500'
                                : 'text-blue-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {alert.device_id} •{' '}
                            {formatRelativeTime(alert.created_at)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          alert.severity === 'critical'
                            ? 'badge-error'
                            : alert.severity === 'warning'
                              ? 'badge-warning'
                              : 'badge-info'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card title="Quick Start Guide" className="mt-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="font-medium text-blue-900">1. Configure Gateway</h4>
              <p className="mt-2 text-sm text-blue-700">
                Set up your Teltonika TRB245 to send data to:
              </p>
              <code className="mt-2 block rounded bg-blue-100 p-2 text-xs text-blue-900">
                POST {window.location.origin}/api/ingest
              </code>
              <p className="mt-2 text-xs text-blue-600">
                Add header: x-api-key: YOUR_SECRET_KEY
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="font-medium text-green-900">2. Data Format</h4>
              <p className="mt-2 text-sm text-green-700">
                Send JSON data in this format:
              </p>
              <code className="mt-2 block rounded bg-green-100 p-2 text-xs text-green-900">
                {`{"device_id": "NIVUS_01", "flow_rate": 12.5}`}
              </code>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <h4 className="font-medium text-purple-900">3. View Data</h4>
              <p className="mt-2 text-sm text-purple-700">
                Data will appear here in real-time. Click on devices to view
                detailed analytics and historical data.
              </p>
            </div>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400">
            FluxIO v1.0.0 | {new Date().toLocaleDateString()} | Fluxio
          </p>
        </div>
      </footer>
    </div>
  )
}
