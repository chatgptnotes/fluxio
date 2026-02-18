'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Building2,
  User,
  Settings,
  ChevronRight,
  Droplet,
  Radio,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'

type DashboardSummary = Database['public']['Views']['dashboard_summary']['Row']

interface Company {
  id: string
  name: string
  code: string
  description: string | null
  deviceCount: number
  onlineDevices: number
  activeAlerts: number
}

export default function DashboardPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const { user: authUser, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const supabase = createClient()

  // Redirect non-admin users to pipeline view
  useEffect(() => {
    if (!authLoading && authUser) {
      if (!authUser.isSuperadmin && authUser.role !== 'admin') {
        router.replace('/cstps-pipeline')
        return
      }
    }
  }, [authUser, authLoading, router])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    await Promise.all([fetchCompanies(), fetchSummary()])
    setLoading(false)
  }

  async function fetchCompanies() {
    // For now, we'll create CSTPS as a hardcoded company with real device data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: devices } = await (supabase as any)
      .from('devices')
      .select('*')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: alerts } = await (supabase as any)
      .from('alerts')
      .select('*')
      .eq('is_resolved', false)

    const deviceCount = devices?.length || 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const onlineDevices = devices?.filter((d: any) => {
      if (!d.last_seen) return false
      const lastSeen = new Date(d.last_seen)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      return lastSeen > fiveMinutesAgo
    }).length || 0

    setCompanies([
      {
        id: 'cstps',
        name: 'CSTPS',
        code: 'CSTPS',
        description: 'Chandrapur Super Thermal Power Station - Flow Monitoring',
        deviceCount,
        onlineDevices,
        activeAlerts: alerts?.length || 0,
      }
    ])
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

  if (loading || authLoading) {
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
              <h1 className="text-3xl font-bold text-gray-900">FlowNexus</h1>
              <p className="mt-1 text-sm text-gray-500">
                Industrial Flow Monitoring Platform
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 rounded-full bg-green-100 px-3 py-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-green-600"></div>
                <span className="text-sm font-medium text-green-800">Live</span>
              </div>
              {authUser?.isSuperadmin || authUser?.role === 'admin' ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Link>
              ) : null}
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Overview Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Companies</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{companies.length}</p>
              </div>
              <div className="rounded-lg bg-blue-100 p-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Devices</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{summary?.total_devices || 0}</p>
              </div>
              <div className="rounded-lg bg-green-100 p-3">
                <Droplet className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Online Devices</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{summary?.online_devices || 0}</p>
              </div>
              <div className="rounded-lg bg-emerald-100 p-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">{summary?.active_alerts || 0}</p>
              </div>
              <div className="rounded-lg bg-amber-100 p-3">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Companies Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Companies</h2>
          <p className="text-sm text-gray-500">Select a company to view detailed monitoring dashboard</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.id}
              href={`/company/${company.code.toLowerCase()}`}
              className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-primary-300"
            >
              {/* Company Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="rounded-lg bg-white/20 p-2">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{company.name}</h3>
                      <p className="text-sm text-white/80">{company.code}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 text-white/60 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Company Stats */}
              <div className="p-6">
                <p className="mb-4 text-sm text-gray-600">{company.description}</p>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <Radio className="h-4 w-4 text-blue-500" />
                      <span className="text-2xl font-bold text-gray-900">{company.deviceCount}</span>
                    </div>
                    <p className="text-xs text-gray-500">Devices</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-2xl font-bold text-gray-900">{company.onlineDevices}</span>
                    </div>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <span className="text-2xl font-bold text-gray-900">{company.activeAlerts}</span>
                    </div>
                    <p className="text-xs text-gray-500">Alerts</p>
                  </div>
                </div>

                {/* Quick Links Preview */}
                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-400">
                  <span>Pipeline</span>
                  <span>|</span>
                  <span>Alarms</span>
                  <span>|</span>
                  <span>Reports</span>
                  <span>|</span>
                  <span>Devices</span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="absolute top-4 right-4">
                {company.onlineDevices > 0 ? (
                  <div className="flex items-center space-x-1 rounded-full bg-green-500/20 px-2 py-1">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-green-400"></div>
                    <span className="text-xs font-medium text-green-100">Active</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 rounded-full bg-gray-500/20 px-2 py-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                    <span className="text-xs font-medium text-gray-100">Offline</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Start Guide */}
        <Card title="Quick Start Guide" className="mt-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="font-medium text-blue-900">1. Select Company</h4>
              <p className="mt-2 text-sm text-blue-700">
                Click on a company card above to access its detailed monitoring dashboard.
              </p>
            </div>
            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="font-medium text-green-900">2. View Pipeline Data</h4>
              <p className="mt-2 text-sm text-green-700">
                Monitor real-time flow rates, totalizers, and device status in the pipeline view.
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <h4 className="font-medium text-purple-900">3. Manage Alarms</h4>
              <p className="mt-2 text-sm text-purple-700">
                View and acknowledge alarms, generate reports, and analyze historical data.
              </p>
            </div>
          </div>
        </Card>
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
