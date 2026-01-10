'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Activity,
  Droplet,
  Thermometer,
  Battery,
  Signal,
  Gauge,
  ArrowRightLeft,
  Clock,
  MapPin,
  Calendar,
  Waves,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react'
import {
  getPipeById,
  getStatusColor,
  getFlowDirectionLabel,
} from '@/lib/cstps-data'

// Generate mock historical data for trends
function generateHistoricalData(baseValue: number, variance: number, points: number = 60) {
  const now = Date.now()
  const interval = 5 * 60 * 1000 // 5 minutes
  const data: { timestamp: number; value: number }[] = []

  for (let i = points - 1; i >= 0; i--) {
    const timestamp = now - i * interval
    const randomVariance = (Math.random() - 0.5) * 2 * variance
    const value = Math.max(0, baseValue + randomVariance + Math.sin(i / 10) * variance * 0.5)
    data.push({ timestamp, value })
  }

  return data
}

// SCADA Trend Chart Component
function TrendChart({
  data,
  label,
  unit,
  color = '#22d3ee',
  height = 200,
  showGrid = true,
}: {
  data: { timestamp: number; value: number }[]
  label: string
  unit: string
  color?: string
  height?: number
  showGrid?: boolean
}) {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  const { minValue, maxValue, points, yLabels, timeLabels } = useMemo(() => {
    const values = data.map((d) => d.value)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const padding = range * 0.1

    const yMin = Math.floor((min - padding) * 10) / 10
    const yMax = Math.ceil((max + padding) * 10) / 10

    // Generate Y-axis labels
    const yLabels: number[] = []
    const yStep = (yMax - yMin) / 4
    for (let i = 0; i <= 4; i++) {
      yLabels.push(yMax - i * yStep)
    }

    // Generate time labels (every 15 minutes = 3 data points)
    const timeLabels: { x: number; label: string }[] = []
    for (let i = 0; i < data.length; i += 12) {
      const date = new Date(data[i].timestamp)
      timeLabels.push({
        x: (i / (data.length - 1)) * 100,
        label: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    }

    // Calculate SVG points
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = ((yMax - d.value) / (yMax - yMin)) * 100
      return { x, y, value: d.value, timestamp: d.timestamp }
    })

    return { minValue: yMin, maxValue: yMax, points, yLabels, timeLabels }
  }, [data])

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')

  const areaD = `${pathD} L 100 100 L 0 100 Z`

  return (
    <div className="rounded-lg border border-cyan-900/50 bg-[#151d2b] overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4 text-cyan-400" />
          <span className="text-xs font-bold tracking-wider text-cyan-400">{label}</span>
        </div>
        <div className="flex items-center space-x-3 text-[10px] text-gray-500">
          <span>5 MIN INTERVAL</span>
          <span>|</span>
          <span>5 HOUR HISTORY</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className="relative p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-4 bottom-12 w-12 flex flex-col justify-between text-right pr-2">
          {yLabels.map((label, i) => (
            <span key={i} className="text-[10px] font-mono text-gray-500">
              {label.toFixed(1)}
            </span>
          ))}
        </div>

        {/* Chart SVG */}
        <div className="ml-12 mr-4">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="w-full"
            style={{ height }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              {/* Grid pattern */}
              <pattern id={`grid-${label}`} width="10" height="25" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 25" fill="none" stroke="#1e3a5f" strokeWidth="0.3" />
              </pattern>

              {/* Area gradient */}
              <linearGradient id={`areaGradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>

              {/* Line glow */}
              <filter id={`glow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background */}
            <rect width="100" height="100" fill="#060a10" />

            {/* Grid */}
            {showGrid && <rect width="100" height="100" fill={`url(#grid-${label})`} />}

            {/* Horizontal grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#1e3a5f"
                strokeWidth="0.3"
                strokeDasharray={y === 50 ? '2 2' : 'none'}
              />
            ))}

            {/* Area fill */}
            <path d={areaD} fill={`url(#areaGradient-${label})`} />

            {/* Main line */}
            <path
              d={pathD}
              fill="none"
              stroke={color}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${label})`}
            />

            {/* Data points (interactive) */}
            {points.map((p, i) => (
              <g key={i}>
                {/* Hover area */}
                <rect
                  x={p.x - 1}
                  y="0"
                  width="2"
                  height="100"
                  fill="transparent"
                  onMouseEnter={() => setHoveredPoint(i)}
                />
                {/* Point dot (visible on hover or every 12th point) */}
                {(hoveredPoint === i || i % 12 === 0) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPoint === i ? 1.5 : 0.8}
                    fill={color}
                    stroke="#060a10"
                    strokeWidth="0.3"
                  />
                )}
              </g>
            ))}

            {/* Hover line */}
            {hoveredPoint !== null && (
              <line
                x1={points[hoveredPoint].x}
                y1="0"
                x2={points[hoveredPoint].x}
                y2="100"
                stroke={color}
                strokeWidth="0.3"
                strokeDasharray="2 2"
                opacity="0.5"
              />
            )}
          </svg>

          {/* X-axis labels */}
          <div className="relative h-6 mt-1">
            {timeLabels.map((t, i) => (
              <span
                key={i}
                className="absolute text-[10px] font-mono text-gray-500 transform -translate-x-1/2"
                style={{ left: `${t.x}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
        </div>

        {/* Hover tooltip */}
        {hoveredPoint !== null && (
          <div
            className="absolute bg-[#0d1520] border border-cyan-800/50 rounded px-2 py-1 text-xs pointer-events-none z-10"
            style={{
              left: `${Math.min(Math.max(points[hoveredPoint].x, 15), 85)}%`,
              top: '20px',
            }}
          >
            <div className="font-mono text-cyan-400 font-bold">
              {points[hoveredPoint].value.toFixed(2)} {unit}
            </div>
            <div className="text-gray-500 text-[10px]">
              {new Date(points[hoveredPoint].timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Current value display */}
        <div className="absolute top-4 right-4 bg-[#0d1520] border border-cyan-800/50 rounded px-3 py-2">
          <div className="text-[10px] text-gray-500 mb-1">CURRENT</div>
          <div className="font-mono text-lg font-bold" style={{ color }}>
            {data[data.length - 1].value.toFixed(2)}
            <span className="text-xs text-gray-500 ml-1">{unit}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Gauge component
function GaugeChart({
  value,
  max,
  label,
  unit,
  color = '#0ea5e9',
}: {
  value: number
  max: number
  label: string
  unit: string
  color?: string
}) {
  const percentage = Math.min((value / max) * 100, 100)
  const circumference = 2 * Math.PI * 45

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (percentage / 100) * circumference}
            className="transition-all duration-500"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white font-mono">{value.toFixed(1)}</span>
          <span className="text-[10px] text-gray-500">{unit}</span>
        </div>
      </div>
      <span className="mt-1 text-xs font-medium text-gray-400">{label}</span>
    </div>
  )
}

// Parameter card component
function ParameterCard({
  icon: Icon,
  label,
  value,
  unit,
  status,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  unit?: string
  status?: 'good' | 'warning' | 'critical'
}) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
  }

  return (
    <div className="rounded-lg border border-cyan-900/50 bg-[#0d1520] p-3 transition-all hover:border-cyan-800/50">
      <div className="mb-1.5 flex items-center space-x-2">
        <Icon className="h-4 w-4 text-cyan-500" />
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline space-x-1">
        <span
          className={`text-xl font-bold font-mono ${status ? statusColors[status] : 'text-white'}`}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-gray-500">{unit}</span>}
      </div>
    </div>
  )
}

export default function PipeDetailPage() {
  const params = useParams()
  const pipeId = params.pipeId as string
  const pipe = getPipeById(pipeId)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time on client only to avoid hydration mismatch
    setCurrentTime(new Date())
    setLastUpdate(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Generate historical data for trends
  const flowHistory = useMemo(
    () => (pipe ? generateHistoricalData(pipe.parameters.flowRate, pipe.parameters.flowRate * 0.15) : []),
    [pipe]
  )
  const velocityHistory = useMemo(
    () => (pipe ? generateHistoricalData(pipe.parameters.velocity, pipe.parameters.velocity * 0.1) : []),
    [pipe]
  )
  const levelHistory = useMemo(
    () => (pipe ? generateHistoricalData(pipe.parameters.waterLevel, pipe.parameters.waterLevel * 0.05) : []),
    [pipe]
  )
  const tempHistory = useMemo(
    () => (pipe ? generateHistoricalData(pipe.parameters.temperature, 2) : []),
    [pipe]
  )

  if (!pipe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1e2939]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500" />
          <h2 className="mt-4 text-2xl font-bold text-white">Pipe Not Found</h2>
          <p className="mt-2 text-gray-400">The requested pipe could not be found.</p>
          <Link
            href="/cstps-pipeline"
            className="mt-6 inline-flex items-center space-x-2 rounded-lg bg-cyan-600 px-6 py-3 font-semibold text-white transition-all hover:bg-cyan-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Pipeline</span>
          </Link>
        </div>
      </div>
    )
  }

  const { parameters } = pipe
  const hasFlow = pipe.status !== 'offline' && parameters.flowRate > 0

  const getBatteryStatus = (level: number): 'good' | 'warning' | 'critical' => {
    if (level > 50) return 'good'
    if (level > 20) return 'warning'
    return 'critical'
  }

  const getSignalStatus = (signal: number): 'good' | 'warning' | 'critical' => {
    if (signal > -60) return 'good'
    if (signal > -75) return 'warning'
    return 'critical'
  }

  return (
    <div className="min-h-screen bg-[#1e2939]">
      {/* Header */}
      <header className="border-b-2 border-cyan-900/50 bg-gradient-to-r from-[#0d1520] via-[#0f1a2a] to-[#0d1520]">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <Link
              href="/cstps-pipeline"
              className="flex items-center space-x-2 rounded bg-cyan-900/30 px-3 py-1.5 text-sm text-cyan-400 transition-all hover:bg-cyan-800/40 hover:text-cyan-300 border border-cyan-800/50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>BACK TO OVERVIEW</span>
            </Link>
            <div className="h-6 w-px bg-cyan-900/50"></div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold tracking-wider text-gray-400">
                FT-{String(pipe.pipeNumber).padStart(2, '0')}
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-sm text-cyan-400">{pipe.deviceName}</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 rounded-full px-3 py-1 ${
                pipe.status === 'online'
                  ? 'bg-green-900/30'
                  : pipe.status === 'warning'
                    ? 'bg-yellow-900/30'
                    : 'bg-red-900/30'
              }`}
            >
              <div
                className={`h-2 w-2 rounded-full ${
                  pipe.status === 'online'
                    ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]'
                    : pipe.status === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
              ></div>
              <span
                className={`text-xs font-bold ${
                  pipe.status === 'online'
                    ? 'text-green-400'
                    : pipe.status === 'warning'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {pipe.status.toUpperCase()}
              </span>
            </div>
            <div className="rounded bg-[#0d1520] px-3 py-1 font-mono text-sm text-cyan-300 border border-cyan-900/50">
              {currentTime ? currentTime.toLocaleTimeString('en-GB') : '--:--:--'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Column - Device Info & Parameters */}
          <div className="col-span-3 space-y-4">
            {/* Device Info */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-cyan-400">DEVICE INFO</span>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: getStatusColor(pipe.status) + '20' }}
                  >
                    <Waves className="h-5 w-5" style={{ color: getStatusColor(pipe.status) }} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{pipe.deviceId}</div>
                    <div className="text-[10px] text-gray-500">NIVUS 750 Flow Transmitter</div>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <MapPin className="h-3 w-3" />
                    <span>{pipe.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span>Installed: {pipe.installationDate}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span>Last Update: {new Date(pipe.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Gauges */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-cyan-400">LIVE READINGS</span>
                <div className="flex items-center space-x-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] text-green-400">LIVE</span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <GaugeChart
                  value={parameters.flowRate}
                  max={200}
                  label="Flow Rate"
                  unit="m³/h"
                  color={hasFlow ? '#22d3ee' : '#4b5563'}
                />
                <GaugeChart
                  value={parameters.velocity}
                  max={6}
                  label="Velocity"
                  unit="m/s"
                  color={hasFlow ? '#8b5cf6' : '#4b5563'}
                />
                <GaugeChart
                  value={parameters.waterLevel / 20}
                  max={100}
                  label="Level"
                  unit="%"
                  color="#10b981"
                />
                <GaugeChart
                  value={parameters.temperature}
                  max={60}
                  label="Temp"
                  unit="°C"
                  color="#f59e0b"
                />
              </div>
            </div>

            {/* Parameters */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-cyan-400">PARAMETERS</span>
              </div>
              <div className="p-2 grid grid-cols-2 gap-2">
                <ParameterCard icon={Droplet} label="Flow" value={parameters.flowRate.toFixed(2)} unit="m³/h" />
                <ParameterCard icon={Activity} label="Velocity" value={parameters.velocity.toFixed(2)} unit="m/s" />
                <ParameterCard icon={Gauge} label="Level" value={parameters.waterLevel} unit="mm" />
                <ParameterCard icon={Waves} label="Totalizer" value={parameters.totalizer.toLocaleString()} unit="m³" />
                <ParameterCard icon={Thermometer} label="Temp" value={parameters.temperature.toFixed(1)} unit="°C" />
                <ParameterCard
                  icon={Battery}
                  label="Battery"
                  value={parameters.batteryLevel}
                  unit="%"
                  status={getBatteryStatus(parameters.batteryLevel)}
                />
                <ParameterCard
                  icon={Signal}
                  label="Signal"
                  value={parameters.signalStrength}
                  unit="dBm"
                  status={getSignalStatus(parameters.signalStrength)}
                />
                <ParameterCard
                  icon={ArrowRightLeft}
                  label="Area"
                  value={parameters.crossSectionalArea.toFixed(3)}
                  unit="m²"
                />
              </div>
            </div>

            {/* Flow Direction */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-cyan-400">FLOW DIRECTION</span>
              </div>
              <div className="p-3 flex items-center space-x-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    parameters.flowDirection === 'forward'
                      ? 'bg-green-900/30'
                      : parameters.flowDirection === 'reverse'
                        ? 'bg-yellow-900/30'
                        : 'bg-gray-800'
                  }`}
                >
                  {parameters.flowDirection === 'forward' ? (
                    <ArrowRightLeft className="h-6 w-6 text-green-400" />
                  ) : parameters.flowDirection === 'reverse' ? (
                    <ArrowRightLeft className="h-6 w-6 rotate-180 text-yellow-400" />
                  ) : (
                    <Activity className="h-6 w-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {getFlowDirectionLabel(parameters.flowDirection)}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {parameters.flowDirection === 'forward'
                      ? 'Normal operation'
                      : parameters.flowDirection === 'reverse'
                        ? 'Reverse detected'
                        : 'Flow stopped'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Trends */}
          <div className="col-span-9 space-y-4">
            {/* Trend Header */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-r from-[#0d1520] via-[#0f1a2a] to-[#0d1520] px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="h-5 w-5 text-cyan-400" />
                  <span className="text-sm font-bold tracking-wider text-cyan-400">
                    HISTORICAL TRENDS - PIPE {String(pipe.pipeNumber).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-2 text-gray-400">
                    <RefreshCw className="h-3 w-3" />
                    <span>UPDATE INTERVAL: 5 MIN</span>
                  </div>
                  <div className="text-gray-600">|</div>
                  <div className="text-gray-400">
                    NEXT UPDATE: {lastUpdate ? new Date(lastUpdate.getTime() + 5 * 60 * 1000).toLocaleTimeString('en-GB') : '--:--:--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Trend Charts Grid */}
            <div className="grid grid-cols-2 gap-4">
              <TrendChart
                data={flowHistory}
                label="FLOW RATE TREND"
                unit="m³/h"
                color="#22d3ee"
                height={180}
              />
              <TrendChart
                data={velocityHistory}
                label="VELOCITY TREND"
                unit="m/s"
                color="#8b5cf6"
                height={180}
              />
              <TrendChart
                data={levelHistory}
                label="WATER LEVEL TREND"
                unit="mm"
                color="#10b981"
                height={180}
              />
              <TrendChart
                data={tempHistory}
                label="TEMPERATURE TREND"
                unit="°C"
                color="#f59e0b"
                height={180}
              />
            </div>

            {/* Statistics Panel */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-cyan-400">
                  STATISTICS (LAST 5 HOURS)
                </span>
              </div>
              <div className="p-4 grid grid-cols-4 gap-4">
                {[
                  {
                    label: 'Flow Rate',
                    data: flowHistory,
                    unit: 'm³/h',
                    color: '#22d3ee',
                  },
                  {
                    label: 'Velocity',
                    data: velocityHistory,
                    unit: 'm/s',
                    color: '#8b5cf6',
                  },
                  {
                    label: 'Water Level',
                    data: levelHistory,
                    unit: 'mm',
                    color: '#10b981',
                  },
                  {
                    label: 'Temperature',
                    data: tempHistory,
                    unit: '°C',
                    color: '#f59e0b',
                  },
                ].map((stat) => {
                  const values = stat.data.map((d) => d.value)
                  const min = Math.min(...values)
                  const max = Math.max(...values)
                  const avg = values.reduce((a, b) => a + b, 0) / values.length

                  return (
                    <div key={stat.label} className="rounded-lg bg-[#151d2b] border border-cyan-900/30 p-3">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                        {stat.label}
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">MIN</span>
                          <span className="font-mono" style={{ color: stat.color }}>
                            {min.toFixed(2)} {stat.unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">MAX</span>
                          <span className="font-mono" style={{ color: stat.color }}>
                            {max.toFixed(2)} {stat.unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">AVG</span>
                          <span className="font-mono font-bold" style={{ color: stat.color }}>
                            {avg.toFixed(2)} {stat.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-cyan-900/50 bg-gradient-to-r from-[#0d1520] via-[#0f1a2a] to-[#0d1520]">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-6 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">DEVICE:</span>
              <span className="text-cyan-400">{pipe.deviceId}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">COMM:</span>
              <span className={pipe.status === 'offline' ? 'text-red-400' : 'text-green-400'}>
                {pipe.status === 'offline' ? 'FAILED' : 'OK'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">MODBUS ADDR:</span>
              <span className="text-cyan-400">{pipe.pipeNumber}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">SCAN TIME:</span>
              <span className="text-cyan-400">{currentTime ? currentTime.toLocaleTimeString('en-GB') : '--:--:--'}</span>
            </div>
          </div>
          <div className="text-xs text-gray-600 font-mono">
            FluxIO SCADA v1.5 | NIVUS 750 Detail View
          </div>
        </div>
      </footer>
    </div>
  )
}
