'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface TransmitterDetails {
  id: string
  name: string
  model: string
  flowRate: number
  totalizer: number
  velocity: number
  level: number
  temperature: number
  status: 'online' | 'offline' | 'warning'
  lastUpdate: string
  pipeline: string
  location: string
  installDate: string
  calibrationDate: string
  signalStrength: number
  batteryLevel: number
}

// Mock data for transmitters
const transmitterData: Record<string, TransmitterDetails> = {
  'FT-001': {
    id: 'FT-001',
    name: 'NIVUS 750 Transmitter #1',
    model: 'NIVUS NivuFlow 750',
    flowRate: 2450,
    totalizer: 1245678,
    velocity: 2.34,
    level: 1.85,
    temperature: 24.5,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    pipeline: 'L-01',
    location: 'IRAI Dam - Pipeline 1',
    installDate: '2024-03-15',
    calibrationDate: '2025-01-10',
    signalStrength: 95,
    batteryLevel: 100,
  },
  'FT-002': {
    id: 'FT-002',
    name: 'NIVUS 750 Transmitter #2',
    model: 'NIVUS NivuFlow 750',
    flowRate: 2380,
    totalizer: 1198234,
    velocity: 2.28,
    level: 1.79,
    temperature: 24.2,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    pipeline: 'L-02',
    location: 'IRAI Dam - Pipeline 2',
    installDate: '2024-03-15',
    calibrationDate: '2025-01-10',
    signalStrength: 92,
    batteryLevel: 100,
  },
  'FT-003': {
    id: 'FT-003',
    name: 'NIVUS 750 Transmitter #3',
    model: 'NIVUS NivuFlow 750',
    flowRate: 2520,
    totalizer: 1312456,
    velocity: 2.41,
    level: 1.92,
    temperature: 24.8,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    pipeline: 'L-03',
    location: 'IRAI Dam - Pipeline 3',
    installDate: '2024-03-15',
    calibrationDate: '2025-01-10',
    signalStrength: 98,
    batteryLevel: 100,
  },
  'FT-004': {
    id: 'FT-004',
    name: 'NIVUS 750 Transmitter #4',
    model: 'NIVUS NivuFlow 750',
    flowRate: 2290,
    totalizer: 1087234,
    velocity: 2.19,
    level: 1.72,
    temperature: 25.1,
    status: 'warning',
    lastUpdate: new Date().toISOString(),
    pipeline: 'L-04',
    location: 'IRAI Dam - Pipeline 4',
    installDate: '2024-03-15',
    calibrationDate: '2025-01-10',
    signalStrength: 72,
    batteryLevel: 85,
  },
  'FT-005': {
    id: 'FT-005',
    name: 'NIVUS 750 Transmitter #5',
    model: 'NIVUS NivuFlow 750',
    flowRate: 2410,
    totalizer: 1178923,
    velocity: 2.31,
    level: 1.81,
    temperature: 24.3,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    pipeline: 'L-05',
    location: 'IRAI Dam - Pipeline 5',
    installDate: '2024-03-15',
    calibrationDate: '2025-01-10',
    signalStrength: 94,
    batteryLevel: 100,
  },
  'FT-006': {
    id: 'FT-006',
    name: 'NIVUS 750 Transmitter #6',
    model: 'NIVUS NivuFlow 750',
    flowRate: 2350,
    totalizer: 1156789,
    velocity: 2.25,
    level: 1.77,
    temperature: 24.6,
    status: 'online',
    lastUpdate: new Date().toISOString(),
    pipeline: 'L-06',
    location: 'IRAI Dam - Pipeline 6',
    installDate: '2024-03-15',
    calibrationDate: '2025-01-10',
    signalStrength: 91,
    batteryLevel: 100,
  },
}

export default function TransmitterDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [transmitter, setTransmitter] = useState<TransmitterDetails | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    // Load transmitter data
    const data = transmitterData[id]
    if (data) {
      setTransmitter(data)
    }

    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [id])

  if (!transmitter) {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center">
        <div className="text-white text-xl">Transmitter not found</div>
      </div>
    )
  }

  const statusColor = transmitter.status === 'online' ? '#4CAF50' :
                      transmitter.status === 'warning' ? '#FF9800' : '#F44336'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B2A] via-[#1B2838] to-[#0D1B2A]">
      {/* Header */}
      <header className="border-b border-[#00E5FF]/20 bg-[#0D1B2A]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/generate-dam-svg"
              className="flex items-center space-x-2 text-[#78909C] hover:text-white transition-all"
            >
              <span className="material-icons">arrow_back</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00E5FF] to-[#1565C0] flex items-center justify-center">
                <span className="material-icons text-white">sensors</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{transmitter.id}</h1>
                <p className="text-xs text-[#4FC3F7]">{transmitter.name}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg`} style={{ backgroundColor: `${statusColor}20`, border: `1px solid ${statusColor}50` }}>
              <div className="relative">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }}></div>
                <div className="absolute inset-0 w-3 h-3 rounded-full animate-ping" style={{ backgroundColor: statusColor, opacity: 0.5 }}></div>
              </div>
              <span className="text-sm font-medium capitalize" style={{ color: statusColor }}>{transmitter.status}</span>
            </div>
            <div className="text-[#78909C] text-sm">
              {currentTime.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Readings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Readings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Flow Rate */}
              <div className="bg-[#1B2838] rounded-xl p-4 border border-[#00E5FF]/20">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="material-icons text-[#00E5FF] text-sm">water_drop</span>
                  <span className="text-[#78909C] text-xs">Flow Rate</span>
                </div>
                <div className="text-3xl font-bold text-white">{transmitter.flowRate.toLocaleString()}</div>
                <div className="text-[#4FC3F7] text-sm">GPM</div>
              </div>

              {/* Velocity */}
              <div className="bg-[#1B2838] rounded-xl p-4 border border-[#00E5FF]/20">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="material-icons text-[#4CAF50] text-sm">speed</span>
                  <span className="text-[#78909C] text-xs">Velocity</span>
                </div>
                <div className="text-3xl font-bold text-white">{transmitter.velocity.toFixed(2)}</div>
                <div className="text-[#4FC3F7] text-sm">m/s</div>
              </div>

              {/* Level */}
              <div className="bg-[#1B2838] rounded-xl p-4 border border-[#00E5FF]/20">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="material-icons text-[#FF9800] text-sm">straighten</span>
                  <span className="text-[#78909C] text-xs">Level</span>
                </div>
                <div className="text-3xl font-bold text-white">{transmitter.level.toFixed(2)}</div>
                <div className="text-[#4FC3F7] text-sm">meters</div>
              </div>

              {/* Temperature */}
              <div className="bg-[#1B2838] rounded-xl p-4 border border-[#00E5FF]/20">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="material-icons text-[#F44336] text-sm">thermostat</span>
                  <span className="text-[#78909C] text-xs">Temperature</span>
                </div>
                <div className="text-3xl font-bold text-white">{transmitter.temperature.toFixed(1)}</div>
                <div className="text-[#4FC3F7] text-sm">°C</div>
              </div>
            </div>

            {/* Totalizer */}
            <div className="bg-[#1B2838] rounded-xl p-6 border border-[#00E5FF]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-[#00E5FF]">analytics</span>
                  <span className="text-white font-medium">Totalizer Reading</span>
                </div>
                <span className="text-[#78909C] text-sm">Cumulative</span>
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-5xl font-bold text-[#00E5FF] font-mono">{transmitter.totalizer.toLocaleString()}</span>
                <span className="text-xl text-[#4FC3F7]">gallons</span>
              </div>
            </div>

            {/* Signal and Battery */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1B2838] rounded-xl p-4 border border-[#00E5FF]/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="material-icons text-[#4CAF50]">signal_cellular_alt</span>
                    <span className="text-white text-sm">Signal Strength</span>
                  </div>
                  <span className="text-[#4CAF50] font-bold">{transmitter.signalStrength}%</span>
                </div>
                <div className="w-full bg-[#0D1B2A] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#4CAF50] to-[#8BC34A] h-2 rounded-full" style={{ width: `${transmitter.signalStrength}%` }}></div>
                </div>
              </div>

              <div className="bg-[#1B2838] rounded-xl p-4 border border-[#00E5FF]/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="material-icons text-[#00E5FF]">battery_full</span>
                    <span className="text-white text-sm">Battery Level</span>
                  </div>
                  <span className="text-[#00E5FF] font-bold">{transmitter.batteryLevel}%</span>
                </div>
                <div className="w-full bg-[#0D1B2A] rounded-full h-2">
                  <div className="bg-gradient-to-r from-[#00E5FF] to-[#4FC3F7] h-2 rounded-full" style={{ width: `${transmitter.batteryLevel}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Device Info */}
          <div className="space-y-6">
            {/* Device Information */}
            <div className="bg-[#1B2838] rounded-xl p-6 border border-[#00E5FF]/20">
              <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                <span className="material-icons text-[#00E5FF]">info</span>
                <span>Device Information</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#78909C] text-sm">Model</span>
                  <span className="text-white text-sm">{transmitter.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78909C] text-sm">Pipeline</span>
                  <span className="text-[#00E5FF] text-sm font-medium">{transmitter.pipeline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78909C] text-sm">Location</span>
                  <span className="text-white text-sm">{transmitter.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78909C] text-sm">Install Date</span>
                  <span className="text-white text-sm">{transmitter.installDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#78909C] text-sm">Last Calibration</span>
                  <span className="text-white text-sm">{transmitter.calibrationDate}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-[#1B2838] rounded-xl p-6 border border-[#00E5FF]/20">
              <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
                <span className="material-icons text-[#00E5FF]">bolt</span>
                <span>Quick Actions</span>
              </h3>
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-[#0D1B2A] hover:bg-[#263238] rounded-lg transition-all">
                  <span className="material-icons text-[#00E5FF]">history</span>
                  <span className="text-white text-sm">View History</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-[#0D1B2A] hover:bg-[#263238] rounded-lg transition-all">
                  <span className="material-icons text-[#4CAF50]">download</span>
                  <span className="text-white text-sm">Export Data</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-[#0D1B2A] hover:bg-[#263238] rounded-lg transition-all">
                  <span className="material-icons text-[#FF9800]">build</span>
                  <span className="text-white text-sm">Calibration</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-3 bg-[#0D1B2A] hover:bg-[#263238] rounded-lg transition-all">
                  <span className="material-icons text-[#F44336]">notifications</span>
                  <span className="text-white text-sm">Set Alerts</span>
                </button>
              </div>
            </div>

            {/* Last Update */}
            <div className="bg-[#1B2838]/50 rounded-xl p-4 border border-[#37474F]">
              <div className="flex items-center space-x-2 text-[#78909C] text-sm">
                <span className="material-icons text-base">update</span>
                <span>Last updated: {new Date(transmitter.lastUpdate).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-[10px] text-[#546E7A]">
        Version 1.5 | January 21, 2025 | FluxIO SCADA System
      </footer>
    </div>
  )
}
