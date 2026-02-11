'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ExploreInfographics from '@/components/ExploreInfographics'

interface SimulatedDevice {
  id: string
  name: string
  location: string
  status: 'online' | 'warning' | 'offline'
  flowRate: number
  totalizer: number
  temperature: number
  level: number
  velocity: number
  lastUpdate: string
}

const BASE_DEVICES: SimulatedDevice[] = [
  {
    id: 'NIVUS-001',
    name: 'Intake Chamber A',
    location: 'Water Treatment Plant, Zone 1',
    status: 'online',
    flowRate: 124.7,
    totalizer: 458920,
    temperature: 24.2,
    level: 1580,
    velocity: 1.34,
    lastUpdate: '',
  },
  {
    id: 'NIVUS-002',
    name: 'Distribution Main B',
    location: 'Pipeline Junction, Sector 4',
    status: 'online',
    flowRate: 87.3,
    totalizer: 312450,
    temperature: 23.8,
    level: 1120,
    velocity: 0.98,
    lastUpdate: '',
  },
  {
    id: 'NIVUS-003',
    name: 'Outfall Monitor C',
    location: 'Discharge Point, River Side',
    status: 'warning',
    flowRate: 201.5,
    totalizer: 891200,
    temperature: 25.1,
    level: 1890,
    velocity: 2.15,
    lastUpdate: '',
  },
  {
    id: 'NIVUS-004',
    name: 'Reservoir Inlet D',
    location: 'Dam Overflow, North Basin',
    status: 'online',
    flowRate: 56.2,
    totalizer: 178340,
    temperature: 22.9,
    level: 720,
    velocity: 0.61,
    lastUpdate: '',
  },
]

function randomVariation(base: number, pct: number): number {
  return +(base + base * (Math.random() * pct * 2 - pct)).toFixed(2)
}

export default function ExplorePage() {
  const [devices, setDevices] = useState<SimulatedDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('NIVUS-001')
  const [flowHistory, setFlowHistory] = useState<number[]>([])
  const [tick, setTick] = useState(0)
  const [alertVisible, setAlertVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1)
      const now = new Date().toLocaleTimeString()
      setDevices(
        BASE_DEVICES.map((d) => ({
          ...d,
          flowRate: randomVariation(d.flowRate, 0.05),
          totalizer: +(d.totalizer + Math.random() * 2).toFixed(1),
          temperature: randomVariation(d.temperature, 0.02),
          level: Math.round(randomVariation(d.level, 0.03)),
          velocity: randomVariation(d.velocity, 0.04),
          lastUpdate: now,
        }))
      )
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const current = devices.find((d) => d.id === selectedDevice)
    if (current) {
      setFlowHistory((prev) => [...prev.slice(-19), current.flowRate])
    }
  }, [devices, selectedDevice])

  useEffect(() => {
    if (tick > 0 && tick % 8 === 0) {
      setAlertVisible(true)
      setTimeout(() => setAlertVisible(false), 5000)
    }
  }, [tick])

  const selected = devices.find((d) => d.id === selectedDevice) || devices[0]
  const maxFlow = Math.max(...flowHistory, 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-primary-950 text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600">
              <span className="material-icons text-white text-xl">water_drop</span>
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">FlowNexus</span>
              <span className="ml-2 rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-300 border border-cyan-500/30">
                Live Demo
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-300">Simulated Data Streaming</span>
            </div>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/25"
            >
              Sign Up Free
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      {/* Alert Toast */}
      {alertVisible && (
        <div className="fixed top-16 right-4 z-50 animate-slide-in-bottom">
          <div className="flex items-center space-x-3 rounded-xl border border-amber-500/40 bg-amber-950/90 px-5 py-3 shadow-2xl backdrop-blur-xl">
            <span className="material-icons text-amber-400">warning</span>
            <div>
              <div className="text-sm font-semibold text-amber-200">High Flow Alert</div>
              <div className="text-xs text-amber-300/70">NIVUS-003 exceeded 200 m3/h threshold</div>
            </div>
            <button onClick={() => setAlertVisible(false)} className="ml-3 text-amber-400/60 hover:text-amber-300">
              <span className="material-icons text-sm">close</span>
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Stats Bar */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: 'devices', label: 'Active Devices', value: `${devices.filter((d) => d.status === 'online').length}/${devices.length}`, color: 'text-green-400' },
            { icon: 'speed', label: 'Avg Flow Rate', value: `${devices.length ? (devices.reduce((a, d) => a + d.flowRate, 0) / devices.length).toFixed(1) : '0'} m3/h`, color: 'text-cyan-400' },
            { icon: 'notifications_active', label: 'Active Alerts', value: '1', color: 'text-amber-400' },
            { icon: 'uptime', label: 'System Uptime', value: '99.97%', color: 'text-emerald-400' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="flex items-center space-x-2">
                <span className={`material-icons text-lg ${stat.color}`}>{stat.icon}</span>
                <span className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="mt-1 text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Device List */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
              <div className="border-b border-white/10 px-4 py-3">
                <h2 className="flex items-center space-x-2 text-sm font-semibold">
                  <span className="material-icons text-base text-cyan-400">router</span>
                  <span>Monitoring Points</span>
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device.id)}
                    className={`w-full px-4 py-3 text-left transition-all hover:bg-white/5 ${
                      selectedDevice === device.id ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400' : 'border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{device.name}</span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          device.status === 'online'
                            ? 'bg-green-400 shadow-green-400/50 shadow-sm'
                            : device.status === 'warning'
                            ? 'bg-amber-400 shadow-amber-400/50 shadow-sm animate-pulse'
                            : 'bg-red-400'
                        }`}
                      />
                    </div>
                    <div className="mt-0.5 text-xs text-white/40">{device.id}</div>
                    <div className="mt-1.5 flex items-center space-x-3 text-xs">
                      <span className="text-cyan-300">{device.flowRate} m3/h</span>
                      <span className="text-white/30">|</span>
                      <span className="text-white/50">{device.temperature}C</span>
                      <span className="text-white/30">|</span>
                      <span className="text-white/50">{device.level} mm</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Device Detail Card */}
            {selected && (
              <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
                <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    <p className="text-xs text-white/40">{selected.location}</p>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-white/40">
                    <span className="material-icons text-sm">schedule</span>
                    <span>Updated: {selected.lastUpdate}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-5">
                  {[
                    { label: 'Flow Rate', value: `${selected.flowRate}`, unit: 'm3/h', icon: 'water_drop', color: 'text-cyan-400' },
                    { label: 'Totalizer', value: `${selected.totalizer.toLocaleString()}`, unit: 'm3', icon: 'functions', color: 'text-blue-400' },
                    { label: 'Temperature', value: `${selected.temperature}`, unit: 'C', icon: 'thermostat', color: 'text-orange-400' },
                    { label: 'Level', value: `${selected.level}`, unit: 'mm', icon: 'straighten', color: 'text-emerald-400' },
                    { label: 'Velocity', value: `${selected.velocity}`, unit: 'm/s', icon: 'speed', color: 'text-purple-400' },
                  ].map((metric) => (
                    <div key={metric.label} className="rounded-lg bg-white/5 p-3 border border-white/5">
                      <div className="flex items-center space-x-1.5 mb-2">
                        <span className={`material-icons text-sm ${metric.color}`}>{metric.icon}</span>
                        <span className="text-[10px] uppercase tracking-wider text-white/40">{metric.label}</span>
                      </div>
                      <div className="text-xl font-bold tabular-nums">{metric.value}</div>
                      <div className="text-[10px] text-white/30">{metric.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Chart */}
            <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden">
              <div className="border-b border-white/10 px-5 py-3 flex items-center justify-between">
                <h3 className="flex items-center space-x-2 text-sm font-semibold">
                  <span className="material-icons text-base text-cyan-400">show_chart</span>
                  <span>Live Flow Rate</span>
                </h3>
                <span className="flex items-center space-x-1 text-xs text-green-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span>Streaming</span>
                </span>
              </div>
              <div className="p-5">
                <div className="flex h-40 items-end space-x-1">
                  {flowHistory.map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${(val / maxFlow) * 100}%`,
                          background: `linear-gradient(to top, rgba(6,182,212,0.3), rgba(6,182,212,${0.5 + (i / flowHistory.length) * 0.5}))`,
                          minHeight: '4px',
                        }}
                      />
                    </div>
                  ))}
                  {flowHistory.length === 0 && (
                    <div className="flex w-full items-center justify-center text-sm text-white/30">
                      <span className="material-icons animate-spin mr-2 text-base">autorenew</span>
                      Initializing data stream...
                    </div>
                  )}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-white/30">
                  <span>-40s</span>
                  <span>-20s</span>
                  <span>Now</span>
                </div>
              </div>
            </div>

            {/* CTA Banner */}
            <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/50 to-blue-950/50 p-6 backdrop-blur-md">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <h3 className="text-lg font-bold">This is simulated data.</h3>
                  <p className="mt-1 text-sm text-white/60">
                    Connect your Nivus transmitters via TRB246 gateway and see real measurements here.
                  </p>
                </div>
                <Link
                  href="/signup"
                  className="shrink-0 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5"
                >
                  Connect Your Devices
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* AI-Generated Platform Visualizations */}
        <div className="mt-10 mb-8">
          <ExploreInfographics />
        </div>

        {/* How It Works - Animated Pipeline */}
        <div className="mt-10 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">How FlowNexus Works</h2>
            <p className="mt-2 text-sm text-white/50">From field sensor to actionable insight in seconds</p>
          </div>
          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
            {[
              { icon: 'sensors', label: 'Nivus Sensor', sub: 'Measures flow, level, temp', color: 'from-cyan-500 to-cyan-700' },
              { icon: 'router', label: 'TRB246 Gateway', sub: 'Modbus TCP/RTU to cloud', color: 'from-blue-500 to-blue-700' },
              { icon: 'cloud_upload', label: 'FlowNexus Cloud', sub: 'Real-time ingestion API', color: 'from-violet-500 to-violet-700' },
              { icon: 'dashboard', label: 'Live Dashboard', sub: 'Monitor, alert, analyze', color: 'from-emerald-500 to-emerald-700' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center text-center w-40">
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}>
                    <span className="material-icons text-white text-2xl">{step.icon}</span>
                  </div>
                  <div className="mt-3 text-sm font-semibold">{step.label}</div>
                  <div className="mt-0.5 text-[11px] text-white/40">{step.sub}</div>
                </div>
                {i < 3 && (
                  <div className="hidden sm:flex items-center w-20 mx-2">
                    <div className="relative h-0.5 w-full bg-white/10 overflow-hidden rounded">
                      <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-cyan-400 to-transparent animate-travel-right rounded" />
                    </div>
                    <span className="material-icons text-white/20 text-sm -ml-1">chevron_right</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Platform Capabilities Infographic */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Platform Capabilities</h2>
            <p className="mt-2 text-sm text-white/50">Everything you need for industrial flow monitoring</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Real-Time Monitoring */}
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-cyan-500/30 hover:bg-white/8">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-500/5 transition-all group-hover:bg-cyan-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/20">
                  <span className="material-icons text-cyan-400 text-2xl">monitoring</span>
                </div>
                <h3 className="mt-4 text-base font-bold">Real-Time Monitoring</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Watch flow rates, water levels, and temperatures update every second. Instant visibility across all your monitoring points.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Sub-second updates', 'Multi-device view', 'Live charts'].map((tag) => (
                    <span key={tag} className="rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300 border border-cyan-500/15">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Intelligent Alerts */}
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-amber-500/30 hover:bg-white/8">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/5 transition-all group-hover:bg-amber-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/20">
                  <span className="material-icons text-amber-400 text-2xl">notifications_active</span>
                </div>
                <h3 className="mt-4 text-base font-bold">Intelligent Alerts</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Set custom thresholds for high flow, low flow, device offline, and temperature anomalies. Get notified before problems escalate.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Custom thresholds', 'Email/SMS', 'Severity levels'].map((tag) => (
                    <span key={tag} className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 border border-amber-500/15">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Historical Analytics */}
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-violet-500/30 hover:bg-white/8">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/5 transition-all group-hover:bg-violet-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/20">
                  <span className="material-icons text-violet-400 text-2xl">analytics</span>
                </div>
                <h3 className="mt-4 text-base font-bold">Historical Analytics</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Query weeks or months of time-series data. Spot trends, detect anomalies, and generate compliance reports automatically.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Time-series DB', 'Trend analysis', 'PDF reports'].map((tag) => (
                    <span key={tag} className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-300 border border-violet-500/15">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Multi-Site Management */}
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-emerald-500/30 hover:bg-white/8">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/5 transition-all group-hover:bg-emerald-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                  <span className="material-icons text-emerald-400 text-2xl">hub</span>
                </div>
                <h3 className="mt-4 text-base font-bold">Multi-Site Management</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Manage multiple pipelines and treatment plants from a single dashboard. Role-based access for operators, engineers, and managers.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Multi-company', 'Role-based access', 'Pipeline views'].map((tag) => (
                    <span key={tag} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/15">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modbus Integration */}
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-blue-500/30 hover:bg-white/8">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/5 transition-all group-hover:bg-blue-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20">
                  <span className="material-icons text-blue-400 text-2xl">settings_ethernet</span>
                </div>
                <h3 className="mt-4 text-base font-bold">Plug-and-Play Hardware</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  Connect Nivus transmitters via Teltonika TRB246 gateways. Supports Modbus TCP, RTU, and RS-485. Zero custom firmware needed.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['Modbus TCP/RTU', 'TRB246 gateway', '4G/LTE uplink'].map((tag) => (
                    <span key={tag} className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300 border border-blue-500/15">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:border-rose-500/30 hover:bg-white/8">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/5 transition-all group-hover:bg-rose-500/10" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/20">
                  <span className="material-icons text-rose-400 text-2xl">shield</span>
                </div>
                <h3 className="mt-4 text-base font-bold">Enterprise Security</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  API key authentication, row-level security, encrypted data in transit and at rest. Full audit trail of every action.
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['API key auth', 'RLS policies', 'Audit logging'].map((tag) => (
                    <span key={tag} className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[10px] font-medium text-rose-300 border border-rose-500/15">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Supported Measurements */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">What We Measure</h2>
            <p className="mt-2 text-sm text-white/50">Industrial-grade flow monitoring parameters</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { icon: 'water_drop', label: 'Flow Rate', value: '0 - 999 m3/h', color: 'cyan' },
              { icon: 'functions', label: 'Totalizer', value: 'Cumulative volume', color: 'blue' },
              { icon: 'thermostat', label: 'Temperature', value: '-20 to 80 C', color: 'orange' },
              { icon: 'straighten', label: 'Water Level', value: '0 - 5000 mm', color: 'emerald' },
              { icon: 'speed', label: 'Velocity', value: '0 - 10 m/s', color: 'purple' },
            ].map((m) => (
              <div key={m.label} className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-md transition-all hover:bg-white/8">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full bg-${m.color}-500/15 border border-${m.color}-500/20`}>
                  <span className={`material-icons text-${m.color}-400 text-2xl`}>{m.icon}</span>
                </div>
                <div className="mt-3 text-sm font-semibold">{m.label}</div>
                <div className="mt-1 text-[11px] text-white/40">{m.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-gradient-to-br from-primary-900/50 via-cyan-900/30 to-blue-900/50 p-8 text-center backdrop-blur-md">
          <span className="material-icons text-5xl text-cyan-400 mb-4">rocket_launch</span>
          <h2 className="text-2xl font-bold">Ready to Monitor Your Infrastructure?</h2>
          <p className="mt-3 text-sm text-white/50 max-w-lg mx-auto">
            Go from unboxing your TRB246 gateway to live data in under 30 minutes.
            No custom firmware, no complex setup.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3 text-base font-semibold shadow-lg shadow-cyan-500/20 transition-all hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-0.5"
            >
              <span className="material-icons text-lg">person_add</span>
              <span>Create Free Account</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center space-x-2 rounded-xl border border-white/20 px-8 py-3 text-base font-medium text-white/70 transition-all hover:bg-white/5 hover:text-white"
            >
              <span className="material-icons text-lg">arrow_back</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-white/5 py-4 text-center text-xs text-white/20">
        Version 1.3 | February 11, 2026 | github.com/chatgptnotes/flownexus
      </div>
    </div>
  )
}
