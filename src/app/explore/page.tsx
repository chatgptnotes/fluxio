'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
      </div>

      {/* Footer */}
      <div className="mt-12 border-t border-white/5 py-4 text-center text-xs text-white/20">
        Version 1.3 | February 11, 2026 | github.com/chatgptnotes/flownexus
      </div>
    </div>
  )
}
