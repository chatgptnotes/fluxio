'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cstpsPipes } from '@/lib/cstps-data'

// Define pipe type for drag and drop
interface PipeData {
  id: string
  pipeNumber: number
  deviceId: string
  status: 'online' | 'warning' | 'offline'
  parameters: {
    flowRate: number
    velocity: number
    waterLevel: number
    temperature: number
  }
}

// Fixed FT box positions for 3D view (in percentages) - permanently positioned
const fixedFtPositions = [
  { left: 52.74, top: 58.33 },  // FT-001
  { left: 39.74, top: 55.92 },  // FT-002
  { left: 45.85, top: 66.84 },  // FT-003
  { left: 32.33, top: 61.59 },  // FT-004
  { left: 39.64, top: 73.27 },  // FT-005
  { left: 25.90, top: 70.10 },  // FT-006
]

// Initial 2D FT positions - hardcoded after visual alignment
const initial2DPositions = [
  { left: 55.5, top: 37.6 },    // FT-001
  { left: 47.4, top: 43.5 },    // FT-002
  { left: 55.3, top: 49.0 },    // FT-003
  { left: 47.6, top: 55.2 },    // FT-004
  { left: 55.2, top: 60.3 },    // FT-005
  { left: 47.4, top: 66.3 },    // FT-006
]

export default function CSTPSPipelinePage() {
  const router = useRouter()
  const [hoveredPipe, setHoveredPipe] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'pid' | '3d' | '2d'>('pid')
  const [sensorOrder, setSensorOrder] = useState<PipeData[]>(cstpsPipes as PipeData[])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)


  // Container ref for 3D view
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Drag and drop handlers for sensor readings
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newOrder = [...sensorOrder]
      const [draggedItem] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(dragOverIndex, 0, draggedItem)
      setSensorOrder(newOrder)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, dragOverIndex, sensorOrder])

  const handlePipeClick = (pipeId: string) => {
    router.push(`/cstps-pipeline/${pipeId}`)
  }


  // Calculate totals
  const totalFlow = cstpsPipes.reduce((sum, p) => sum + p.parameters.flowRate, 0)
  const onlineCount = cstpsPipes.filter((p) => p.status === 'online').length
  const warningCount = cstpsPipes.filter((p) => p.status === 'warning').length
  const offlineCount = cstpsPipes.filter((p) => p.status === 'offline').length

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* SCADA Header Bar */}
      <header className="border-b-2 border-[#0288D1] bg-gradient-to-r from-[#1565C0] via-[#1976D2] to-[#1565C0]">
        {/* Mobile Header - Top Row */}
        <div className="flex items-center justify-between px-2 py-2 md:px-4">
          <div className="flex items-center space-x-2 md:space-x-4">
            <Link
              href="/"
              className="flex items-center rounded bg-white/20 px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm text-white transition-all hover:bg-white/30 border border-white/30"
            >
              <span className="font-medium">Back</span>
            </Link>
            <div className="h-6 w-px bg-white/30 hidden sm:block"></div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <div className="relative">
                <div className="h-2 w-2 md:h-3 md:w-3 rounded-full bg-[#4CAF50] shadow-[0_0_8px_#4CAF50]"></div>
                <div className="absolute inset-0 h-2 w-2 md:h-3 md:w-3 animate-ping rounded-full bg-[#4CAF50] opacity-75"></div>
              </div>
              <span className="text-[10px] md:text-sm font-bold tracking-wider text-white">
                <span className="hidden sm:inline">SYSTEM </span>ONLINE
              </span>
            </div>
          </div>
          <div className="text-center flex-1 mx-2">
            <h1 className="text-xs sm:text-sm md:text-lg font-bold tracking-wide md:tracking-[0.15em] text-white drop-shadow-md truncate">
              CSTPS WATER SUPPLY SCADA
            </h1>
            <span className="text-[8px] md:text-xs text-white/80 hidden sm:block">Process Flow Diagram - Gravity Fed System</span>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm">
            {/* Date/Time - Hidden on mobile, shown on tablet+ */}
            <div className="hidden lg:block rounded bg-white/20 px-2 md:px-3 py-1 font-mono text-white border border-white/30 text-xs">
              {currentTime ? currentTime.toLocaleDateString('en-GB') : '--/--/----'}
            </div>
            <div className="hidden md:block rounded bg-white/20 px-2 md:px-3 py-1 font-mono text-white border border-white/30 text-xs">
              {currentTime ? currentTime.toLocaleTimeString('en-GB') : '--:--:--'}
            </div>
            <Link
              href="/dashboard/reports"
              className="hidden sm:flex items-center rounded bg-white/20 px-3 py-1 text-white hover:bg-white/30 border border-white/30"
            >
              <span className="text-xs font-medium">Reports</span>
            </Link>
            <button className="flex items-center rounded bg-white/20 px-3 py-1 text-white hover:bg-white/30 border border-white/30">
              <span className="text-xs font-medium">Refresh</span>
            </button>
          </div>
        </div>
        {/* View Mode Toggle - Second Row on Mobile */}
        <div className="flex items-center justify-center px-2 pb-2 md:hidden">
          <div className="flex items-center bg-white/20 rounded border border-white/30">
            <button
              onClick={() => setViewMode('pid')}
              className={`flex items-center space-x-1 px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === 'pid'
                  ? 'bg-white text-[#1565C0]'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <span>P&ID View</span>
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-white text-[#1565C0]'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <span>3D View</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center px-3 py-1.5 text-xs font-medium transition-all ${
                viewMode === '2d'
                  ? 'bg-white text-[#1565C0]'
                  : 'text-white hover:bg-white/20'
              }`}
            >
              <span>2D View</span>
            </button>
          </div>
        </div>
        {/* Desktop View Mode Toggle - Inline */}
        <div className="hidden md:flex items-center justify-end px-4 pb-2">
          <div className="flex items-center bg-white/20 rounded border border-white/30">
            <button
              onClick={() => setViewMode('pid')}
              className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium transition-all ${
                viewMode === 'pid'
                  ? 'bg-white text-[#1565C0]'
                  : 'text-white hover:bg-white/20'
              }`}
              title="P&ID Diagram"
            >
              <span>P&ID View</span>
            </button>
            <button
              onClick={() => setViewMode('3d')}
              className={`flex items-center px-2 py-1 text-xs font-medium transition-all ${
                viewMode === '3d'
                  ? 'bg-white text-[#1565C0]'
                  : 'text-white hover:bg-white/20'
              }`}
              title="3D Isometric View"
            >
              <span>3D View</span>
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`flex items-center px-2 py-1 text-xs font-medium transition-all ${
                viewMode === '2d'
                  ? 'bg-white text-[#1565C0]'
                  : 'text-white hover:bg-white/20'
              }`}
              title="2D Aerial View"
            >
              <span>2D View</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main SCADA Display */}
      <main className="p-2 md:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4">
          {/* Left Panel - System Status - Shows as horizontal cards on mobile */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:gap-4 lg:space-y-0">
            {/* Status Summary */}
            <div className="rounded-lg border border-[#BDBDBD] bg-white shadow-sm">
              <div className="border-b border-[#E0E0E0] bg-[#EEEEEE] px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-[#424242]">
                  SYSTEM STATUS
                </span>
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-[#4CAF50] shadow-[0_0_6px_#4CAF50]"></div>
                    <span className="text-xs text-[#424242] font-semibold">ONLINE</span>
                  </div>
                  <span className="rounded bg-[#E8F5E9] px-2 py-0.5 font-mono text-sm font-bold text-[#2E7D32]">
                    {onlineCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-[#FFC107] shadow-[0_0_6px_#FFC107]"></div>
                    <span className="text-xs text-[#424242] font-semibold">WARNING</span>
                  </div>
                  <span className="rounded bg-[#FFF8E1] px-2 py-0.5 font-mono text-sm font-bold text-[#F57F17]">
                    {warningCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-3 w-3 rounded-full bg-[#F44336] shadow-[0_0_6px_#F44336]"></div>
                    <span className="text-xs text-[#424242] font-semibold">OFFLINE</span>
                  </div>
                  <span className="rounded bg-[#FFEBEE] px-2 py-0.5 font-mono text-sm font-bold text-[#C62828]">
                    {offlineCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Flow */}
            <div className="rounded-lg border border-[#BDBDBD] bg-white shadow-sm">
              <div className="border-b border-[#E0E0E0] bg-[#EEEEEE] px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-[#424242]">
                  TOTAL FLOW RATE
                </span>
              </div>
              <div className="p-4 text-center">
                <div className="rounded bg-[#1a1a2e] px-4 py-3 border border-[#0288D1]">
                  <div className="font-mono text-3xl font-bold text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.5)]">
                    {totalFlow.toFixed(1)}
                  </div>
                  <div className="text-xs text-[#4FC3F7] mt-1 font-mono">m3/h</div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-[#E0E0E0] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0288D1] to-[#00BCD4] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalFlow / 500) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-[#757575] mt-1 font-mono">
                  <span>0</span>
                  <span>500 m3/h</span>
                </div>
              </div>
            </div>

            {/* Alarms Panel */}
            <div className="rounded-lg border border-[#BDBDBD] bg-white shadow-sm">
              <div className="border-b border-[#E0E0E0] bg-[#EEEEEE] px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-[#424242]">
                  ACTIVE ALARMS
                </span>
                {cstpsPipes.filter(p => p.status !== 'online').length > 0 && (
                  <div className="h-2 w-2 rounded-full bg-[#F44336] animate-pulse shadow-[0_0_8px_#F44336]"></div>
                )}
              </div>
              <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                {cstpsPipes.filter(p => p.status !== 'online').map(pipe => (
                  <div
                    key={pipe.id}
                    className={`rounded px-2 py-1.5 text-xs border ${
                      pipe.status === 'warning'
                        ? 'bg-[#FFF8E1] text-[#F57F17] border-[#FFD54F]'
                        : 'bg-[#FFEBEE] text-[#C62828] border-[#EF9A9A] animate-pulse'
                    }`}
                  >
                    <div className="font-bold font-mono">{pipe.deviceId}</div>
                    <div className="text-[10px] opacity-75">
                      {pipe.status === 'warning' ? 'LOW BATTERY WARNING' : 'COMMUNICATION FAILURE'}
                    </div>
                  </div>
                ))}
                {cstpsPipes.filter(p => p.status !== 'online').length === 0 && (
                  <div className="text-center text-xs text-[#9E9E9E] py-4">
                    NO ACTIVE ALARMS
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center - Main Visualization */}
          <div className="lg:col-span-8 order-first lg:order-none">
            <div className="rounded-lg border border-[#BDBDBD] bg-white shadow-sm overflow-hidden">
              <div className="border-b border-[#E0E0E0] bg-[#EEEEEE] px-2 md:px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-bold tracking-wider text-[#424242]">
                  {viewMode === 'pid' ? 'P&ID - GRAVITY FED WATER TRANSMISSION' :
                   viewMode === '3d' ? '3D ISOMETRIC VIEW - IRAI DAM TO CSTPS' :
                   '2D AERIAL VIEW - WATER SUPPLY SYSTEM'}
                </span>
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] text-[#757575] font-mono">SCAN: 1000ms</span>
                  <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 rounded-full bg-[#4CAF50] animate-pulse"></div>
                    <span className="text-[10px] text-[#4CAF50] font-bold">LIVE</span>
                  </div>
                </div>
              </div>

              {/* 3D View with Template Image */}
              {viewMode === '3d' && (
                <div
                  ref={containerRef}
                  className="relative w-full"
                  style={{ paddingBottom: '56.25%' }}
                >
                  {/* Background Template Image */}
                  <img
                    src="/images/scada-3d-template.png"
                    alt="SCADA 3D Template"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Water Ripple Animation - Dam Reservoir */}
                  <div className="absolute" style={{ left: '5%', top: '15%', width: '12%', height: '35%' }}>
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Water shimmer effect */}
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                          backgroundSize: '200% 200%',
                          animation: 'waterShimmer 3s ease-in-out infinite'
                        }}
                      />
                      {/* Ripple circles */}
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="absolute rounded-full border border-white/40"
                          style={{
                            left: '30%',
                            top: '40%',
                            width: '40%',
                            height: '20%',
                            animation: `ripple 3s ease-out infinite`,
                            animationDelay: `${i * 1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Water Ripple Animation - CSTPS Reservoir */}
                  <div className="absolute" style={{ left: '52%', top: '58%', width: '18%', height: '20%' }}>
                    <div className="absolute inset-0 overflow-hidden">
                      <div
                        className="absolute w-full h-2 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"
                        style={{
                          top: '20%',
                          animation: 'wave 2s ease-in-out infinite'
                        }}
                      />
                    </div>
                  </div>


                  {/* FT Value Overlays - Click to view details */}
                  {cstpsPipes.map((pipe, index) => {
                    const hasFlow = pipe.status !== 'offline' && pipe.parameters.flowRate > 0
                    const statusColor = pipe.status === 'online' ? '#4CAF50' : pipe.status === 'warning' ? '#FFC107' : '#F44336'
                    const pos = fixedFtPositions[index]

                    return (
                      <div
                        key={`ft-${pipe.id}`}
                        className="absolute z-10 transition-all cursor-pointer hover:scale-105"
                        style={{
                          left: `${pos.left}%`,
                          top: `${pos.top}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => router.push(`/cstps-pipeline/${pipe.id}`)}
                        onMouseEnter={() => setHoveredPipe(pipe.id)}
                        onMouseLeave={() => setHoveredPipe(null)}
                      >
                        <div className={`relative bg-[#0D1B2A] rounded px-1 py-0.5 md:px-2 md:py-1 border ${
                          hoveredPipe === pipe.id
                            ? 'border-[#00E5FF] shadow-[0_0_10px_#00E5FF]'
                            : 'border-[#1565C0]'
                        } transition-all`}>
                          {/* Status LED */}
                          <div
                            className="absolute -top-1 -right-1 h-1.5 w-1.5 md:h-2.5 md:w-2.5 rounded-full"
                            style={{
                              backgroundColor: statusColor,
                              boxShadow: hasFlow ? `0 0 6px ${statusColor}` : 'none',
                              animation: hasFlow ? 'pulse 1.5s infinite' : 'none'
                            }}
                          />
                          {/* FT Label */}
                          <div className="text-[6px] md:text-[8px] text-[#90CAF9] font-mono">FT-{String(pipe.pipeNumber).padStart(3, '0')}</div>
                          {/* Flow Value */}
                          <div className={`text-[10px] md:text-sm font-bold font-mono ${hasFlow ? 'text-[#00E5FF]' : 'text-[#546E7A]'}`}>
                            {pipe.parameters.flowRate.toFixed(1)}
                            <span className="text-[6px] md:text-[8px] text-[#4FC3F7] ml-0.5">m3/h</span>
                          </div>
                        </div>
                        {/* Tooltip on hover */}
                        {hoveredPipe === pipe.id && (
                          <div
                            className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-white rounded shadow-lg border border-[#E0E0E0] p-2 z-20 whitespace-nowrap"
                          >
                            <div className="text-xs font-bold text-[#1565C0]">{pipe.deviceId}</div>
                            <div className="text-[10px] text-[#757575]">Click to view details</div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Enhanced Smoke Animation - Cooling Towers */}
                  {[0, 1, 2, 3].map(i => {
                    // Repositioned to match actual cooling tower locations in template
                    const towerPositions = [75, 79, 83, 87]
                    return (
                      <div
                        key={`smoke-${i}`}
                        className="absolute"
                        style={{
                          left: `${towerPositions[i]}%`,
                          top: '12%',
                          width: '5%',
                          height: '25%'
                        }}
                      >
                        {/* Multiple smoke layers for realistic effect */}
                        {[0, 1, 2, 3].map(j => (
                          <div
                            key={j}
                            className="absolute rounded-full"
                            style={{
                              width: j % 2 === 0 ? '100%' : '70%',
                              left: j % 2 === 0 ? '0' : '15%',
                              height: '70%',
                              background: `radial-gradient(ellipse at center, rgba(255,255,255,${0.6 - j * 0.1}) 0%, rgba(220,220,220,${0.4 - j * 0.08}) 40%, transparent 70%)`,
                              animation: `smokeRise ${3 + j * 0.7}s ease-out infinite, smokeDrift ${4 + j}s ease-in-out infinite`,
                              animationDelay: `${j * 0.6 + i * 0.4}s`
                            }}
                          />
                        ))}
                        {/* Wispy smoke tendrils */}
                        <div
                          className="absolute w-3/4 h-full"
                          style={{
                            left: '12.5%',
                            background: 'linear-gradient(to top, rgba(255,255,255,0.5), transparent 60%)',
                            filter: 'blur(3px)',
                            animation: `smokeRise ${4}s ease-out infinite`,
                            animationDelay: `${i * 0.5}s`
                          }}
                        />
                      </div>
                    )
                  })}

                  {/* Total Flow Display */}
                  <div className="absolute bottom-2 left-2 md:bottom-4 md:left-4 bg-[#0D1B2A]/90 rounded md:rounded-lg px-2 py-1 md:px-4 md:py-2 border border-[#1565C0]">
                    <div className="text-[8px] md:text-[10px] text-[#90CAF9] font-mono">TOTAL FLOW</div>
                    <div className="text-sm md:text-xl font-bold text-[#00E5FF] font-mono">
                      {totalFlow.toFixed(1)} <span className="text-xs md:text-sm text-[#4FC3F7]">m3/h</span>
                    </div>
                  </div>

                </div>
              )}

              {/* 2D Aerial View - Bird's Eye */}
              {viewMode === '2d' && (
                <div
                  ref={containerRef}
                  className="relative w-full"
                  style={{ paddingBottom: '56.25%' }}
                >
                  {/* Background Template Image */}
                  <img
                    src="/images/scada-2d-template.png"
                    alt="SCADA 2D Bird Eye View Template"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* Water Ripple Animation - IRAI Dam Reservoir */}
                  <div className="absolute" style={{ left: '2%', top: '15%', width: '18%', height: '55%' }}>
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Water shimmer effect */}
                      <div
                        className="absolute inset-0 opacity-15"
                        style={{
                          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)',
                          backgroundSize: '200% 200%',
                          animation: 'waterShimmer 3s ease-in-out infinite'
                        }}
                      />
                      {/* Ripple circles */}
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="absolute rounded-full border border-white/30"
                          style={{
                            left: '25%',
                            top: '35%',
                            width: '50%',
                            height: '30%',
                            animation: `ripple 3s ease-out infinite`,
                            animationDelay: `${i * 1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* FT Value Overlays - Click to view details */}
                  {cstpsPipes.map((pipe, index) => {
                    const hasFlow = pipe.status !== 'offline' && pipe.parameters.flowRate > 0
                    const statusColor = pipe.status === 'online' ? '#4CAF50' : pipe.status === 'warning' ? '#FFC107' : '#F44336'
                    const pos = initial2DPositions[index]

                    return (
                      <div
                        key={`ft-2d-${pipe.id}`}
                        className="absolute z-10 cursor-pointer hover:scale-105 transition-transform"
                        style={{
                          left: `${pos.left}%`,
                          top: `${pos.top}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        onClick={() => router.push(`/cstps-pipeline/${pipe.id}`)}
                        onMouseEnter={() => setHoveredPipe(pipe.id)}
                        onMouseLeave={() => setHoveredPipe(null)}
                      >
                        <div className={`relative bg-[#0D1B2A]/90 rounded px-1.5 py-0.5 border ${
                          hoveredPipe === pipe.id
                            ? 'border-[#00E5FF] shadow-[0_0_8px_#00E5FF]'
                            : 'border-[#00ACC1]'
                        } transition-all`}>
                          {/* Status LED - smaller */}
                          <div
                            className="absolute -top-1 -right-1 h-2 w-2 rounded-full border border-white"
                            style={{
                              backgroundColor: statusColor,
                              boxShadow: hasFlow ? `0 0 4px ${statusColor}` : 'none',
                              animation: hasFlow ? 'pulse 1.5s infinite' : 'none'
                            }}
                          />
                          {/* FT Label - smaller */}
                          <div className="text-[7px] text-[#90CAF9] font-mono font-bold leading-tight">FT-{String(pipe.pipeNumber).padStart(3, '0')}</div>
                          {/* Flow Value - compact */}
                          <div className={`text-[11px] font-bold font-mono leading-tight ${hasFlow ? 'text-[#00E5FF]' : 'text-[#546E7A]'}`}>
                            {pipe.parameters.flowRate.toFixed(1)}<span className="text-[7px] text-[#4FC3F7]">m3/h</span>
                          </div>
                        </div>
                        {/* Tooltip on hover */}
                        {hoveredPipe === pipe.id && (
                          <div
                            className="absolute left-full ml-1 top-1/2 -translate-y-1/2 bg-white rounded shadow-lg border border-[#E0E0E0] p-1.5 z-20 whitespace-nowrap"
                          >
                            <div className="text-[10px] font-bold text-[#1565C0]">{pipe.deviceId}</div>
                            <div className="text-[8px] text-[#757575]">Vel: {pipe.parameters.velocity.toFixed(2)} m/s</div>
                            <div className="text-[8px] text-[#757575]">Level: {pipe.parameters.waterLevel} mm</div>
                            <div className="text-[8px] text-[#1565C0] mt-0.5 font-medium">Click to view details</div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Smoke Animation - Cooling Towers (4 towers on the right) */}
                  {[0, 1, 2, 3].map(i => {
                    // Cooling tower positions for 2D view - 2x2 grid on right side
                    const towerPositions2D = [
                      { left: 82, top: 18 },
                      { left: 90, top: 18 },
                      { left: 82, top: 32 },
                      { left: 90, top: 32 },
                    ]
                    const towerPos = towerPositions2D[i]
                    return (
                      <div
                        key={`smoke-2d-${i}`}
                        className="absolute pointer-events-none"
                        style={{
                          left: `${towerPos.left}%`,
                          top: `${towerPos.top}%`,
                          width: '6%',
                          height: '15%',
                          transform: 'translate(-50%, -100%)'
                        }}
                      >
                        {/* Multiple smoke layers for realistic effect */}
                        {[0, 1, 2].map(j => (
                          <div
                            key={j}
                            className="absolute rounded-full"
                            style={{
                              width: j % 2 === 0 ? '100%' : '70%',
                              left: j % 2 === 0 ? '0' : '15%',
                              height: '80%',
                              background: `radial-gradient(ellipse at center, rgba(255,255,255,${0.5 - j * 0.12}) 0%, rgba(220,220,220,${0.3 - j * 0.08}) 50%, transparent 70%)`,
                              animation: `smokeRise ${3 + j * 0.5}s ease-out infinite, smokeDrift ${4 + j}s ease-in-out infinite`,
                              animationDelay: `${j * 0.5 + i * 0.3}s`
                            }}
                          />
                        ))}
                      </div>
                    )
                  })}

                  {/* Total Flow Display */}
                  <div className="absolute bottom-4 left-4 bg-[#0D1B2A]/95 rounded-lg px-4 py-2 border-2 border-[#00ACC1] shadow-lg">
                    <div className="text-[10px] text-[#90CAF9] font-mono font-bold">TOTAL FLOW</div>
                    <div className="text-2xl font-bold text-[#00E5FF] font-mono">
                      {totalFlow.toFixed(1)} <span className="text-sm text-[#4FC3F7]">m3/h</span>
                    </div>
                  </div>

                  {/* Online/Offline Status Summary */}
                  <div className="absolute bottom-4 right-4 bg-[#0D1B2A]/95 rounded-lg px-3 py-2 border-2 border-[#00ACC1] shadow-lg">
                    <div className="flex items-center space-x-3 text-xs font-mono">
                      <div className="flex items-center space-x-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#4CAF50] shadow-[0_0_6px_#4CAF50]"></div>
                        <span className="text-[#4CAF50] font-bold">{onlineCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#FFC107] shadow-[0_0_6px_#FFC107]"></div>
                        <span className="text-[#FFC107] font-bold">{warningCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-[#F44336] shadow-[0_0_6px_#F44336]"></div>
                        <span className="text-[#F44336] font-bold">{offlineCount}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* P&ID SVG Diagram (Original) */}
              {viewMode === 'pid' && (
              <div className="overflow-x-auto">
              <svg viewBox="0 0 1000 550" className="w-full min-w-[700px] bg-[#FAFAFA]">
                <defs>
                  {/* Grid pattern */}
                  <pattern id="pidGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E8E8E8" strokeWidth="0.5" />
                  </pattern>

                  {/* Darker Pipe gradient - 3D effect with better visibility */}
                  <linearGradient id="pipeGradientBlue" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#0277BD" />
                    <stop offset="25%" stopColor="#01579B" />
                    <stop offset="50%" stopColor="#014377" />
                    <stop offset="75%" stopColor="#01579B" />
                    <stop offset="100%" stopColor="#0277BD" />
                  </linearGradient>

                  {/* Inactive pipe gradient - darker gray */}
                  <linearGradient id="pipeGradientGray" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#757575" />
                    <stop offset="25%" stopColor="#616161" />
                    <stop offset="50%" stopColor="#424242" />
                    <stop offset="75%" stopColor="#616161" />
                    <stop offset="100%" stopColor="#757575" />
                  </linearGradient>

                  {/* Water fill gradient */}
                  <linearGradient id="waterFill" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#29B6F6" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#01579B" stopOpacity="0.9" />
                  </linearGradient>

                  {/* Glow filters */}
                  <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>

                  <filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>

                  {/* Drop shadow for pipes */}
                  <filter id="pipeShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="2" dy="2" stdDeviation="2" floodOpacity="0.3"/>
                  </filter>
                </defs>

                {/* Background with grid */}
                <rect width="100%" height="100%" fill="#FAFAFA" />
                <rect width="100%" height="100%" fill="url(#pidGrid)" />

                {/* Title Block */}
                <g transform="translate(500, 22)">
                  <text textAnchor="middle" fill="#37474F" fontSize="14" fontWeight="bold" fontFamily="Arial, sans-serif">
                    GRAVITY FED WATER TRANSMISSION - IRAI DAM TO CSTPS RESERVOIR
                  </text>
                  <text y="14" textAnchor="middle" fill="#78909C" fontSize="10" fontFamily="Arial, sans-serif">
                    (No Pumps - Natural Head Pressure)
                  </text>
                </g>

                {/* IRAI DAM - Clean integrated design */}
                <g transform="translate(0, 45)">
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0277BD" />
                      <stop offset="40%" stopColor="#29B6F6" />
                      <stop offset="100%" stopColor="#01579B" />
                    </linearGradient>
                    <linearGradient id="damWallGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#546E7A" />
                      <stop offset="50%" stopColor="#455A64" />
                      <stop offset="100%" stopColor="#37474F" />
                    </linearGradient>
                    <filter id="waterRipple" x="-20%" y="-20%" width="140%" height="140%">
                      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise">
                        <animate attributeName="baseFrequency" values="0.04;0.06;0.04" dur="8s" repeatCount="indefinite"/>
                      </feTurbulence>
                      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
                    </filter>
                  </defs>

                  {/* Dam label */}
                  <rect x="25" y="35" width="90" height="26" fill="#1565C0" stroke="#0D47A1" strokeWidth="1.5" rx="3" filter="url(#pipeShadow)"/>
                  <text x="70" y="53" textAnchor="middle" fill="white" fontSize="12" fontFamily="Arial" fontWeight="bold">
                    IRAI DAM
                  </text>

                  {/* Water body - shaped to meet dam wall cleanly */}
                  <path
                    d="M 5,70
                       Q -20,260 5,450
                       L 120,450
                       L 120,70
                       Z"
                    fill="url(#waterGradient)"
                    filter="url(#waterRipple)"
                    opacity="0.95"
                  />

                  {/* Water surface highlights */}
                  <ellipse cx="50" cy="150" rx="25" ry="8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1">
                    <animate attributeName="rx" values="22;30;22" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0.15;0.4" dur="3s" repeatCount="indefinite"/>
                  </ellipse>
                  <ellipse cx="60" cy="280" rx="20" ry="6" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1">
                    <animate attributeName="rx" values="18;26;18" dur="4s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.3;0.1;0.3" dur="4s" repeatCount="indefinite"/>
                  </ellipse>
                  <ellipse cx="55" cy="380" rx="22" ry="7" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1">
                    <animate attributeName="rx" values="20;28;20" dur="5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.25;0.08;0.25" dur="5s" repeatCount="indefinite"/>
                  </ellipse>

                  {/* Dam Wall - vertical wall on right side of water */}
                  <rect x="120" y="65" width="18" height="395" fill="url(#damWallGradient)" stroke="#263238" strokeWidth="2" filter="url(#pipeShadow)"/>

                  {/* Pipe outlet ports on dam wall - positioned to align with pipes */}
                  {[0, 1, 2, 3, 4, 5].map(i => {
                    const portY = 85 + i * 58  // Aligns with pipe yPos = 130 + i*58 in global coords (130-45=85)
                    return (
                      <g key={`port-${i}`}>
                        {/* Outlet flange */}
                        <rect x="134" y={portY - 10} width="8" height="20" fill="#455A64" stroke="#263238" strokeWidth="1" rx="2"/>
                        {/* Pipe opening */}
                        <rect x="136" y={portY - 7} width="6" height="14" fill="#01579B" rx="1">
                          <animate attributeName="fill" values="#01579B;#0288D1;#01579B" dur="2s" repeatCount="indefinite"/>
                        </rect>
                      </g>
                    )
                  })}

                  {/* Spillway indication at bottom */}
                  <rect x="10" y="460" width="110" height="8" fill="#455A64" stroke="#37474F" strokeWidth="1" rx="2"/>
                  <text x="65" y="467" textAnchor="middle" fill="#B0BEC5" fontSize="6" fontWeight="bold">SPILLWAY</text>

                  {/* Water reservoir labels */}
                  <text x="60" y="250" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity="0.95">WATER</text>
                  <text x="60" y="266" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" opacity="0.95">RESERVOIR</text>
                </g>

                {/* CSTPS RESERVOIR */}
                <g transform="translate(880, 80)">
                  {/* Reservoir tank */}
                  <rect x="0" y="0" width="90" height="350" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="3" rx="3" filter="url(#pipeShadow)"/>

                  {/* Water fill - animated */}
                  <rect x="3" y="50" width="84" height="297" fill="url(#waterFill)">
                    <animate attributeName="y" values="50;55;50" dur="4s" repeatCount="indefinite"/>
                    <animate attributeName="height" values="297;292;297" dur="4s" repeatCount="indefinite"/>
                  </rect>

                  {/* Water surface wave */}
                  <path d="M 3 50 Q 22 45, 45 50 T 87 50" fill="none" stroke="#29B6F6" strokeWidth="2">
                    <animate
                      attributeName="d"
                      values="M 3 50 Q 22 45, 45 50 T 87 50;M 3 55 Q 22 60, 45 55 T 87 55;M 3 50 Q 22 45, 45 50 T 87 50"
                      dur="4s"
                      repeatCount="indefinite"
                    />
                  </path>

                  {/* Level scale */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <g key={i}>
                      <line x1="-15" y1={35 + i * 70} x2="0" y2={35 + i * 70} stroke="#2E7D32" strokeWidth="1"/>
                      <text x="-20" y={39 + i * 70} textAnchor="end" fill="#37474F" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        {100 - i * 25}%
                      </text>
                    </g>
                  ))}

                  {/* Status LED */}
                  <circle cx="75" cy="15" r="6" fill="#4CAF50" filter="url(#glowGreen)">
                    <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                  </circle>

                  {/* Flow rate display */}
                  <g transform="translate(45, 200)">
                    <rect x="-35" y="-14" width="70" height="32" fill="#0D1B2A" stroke="#2E7D32" strokeWidth="1.5" rx="4"/>
                    <text y="2" textAnchor="middle" fill="#00E5FF" fontSize="14" fontFamily="monospace" fontWeight="bold">
                      {totalFlow.toFixed(1)}
                    </text>
                    <text y="14" textAnchor="middle" fill="#4FC3F7" fontSize="9" fontFamily="monospace">m3/h IN</text>
                  </g>

                  {/* Reservoir label */}
                  <rect x="-10" y="-32" width="110" height="24" fill="#2E7D32" stroke="#1B5E20" strokeWidth="1" rx="3"/>
                  <text x="45" y="-15" textAnchor="middle" fill="white" fontSize="10" fontFamily="Arial" fontWeight="bold">
                    CSTPS RESERVOIR
                  </text>
                </g>

                {/* PIPE LINES - GRAVITY FED (NO PUMPS) */}
                {cstpsPipes.map((pipe, index) => {
                  const yPos = 130 + index * 58
                  const isHovered = hoveredPipe === pipe.id
                  const hasFlow = pipe.status !== 'offline' && pipe.parameters.flowRate > 0
                  const statusColor = pipe.status === 'online' ? '#4CAF50' : pipe.status === 'warning' ? '#FFC107' : '#F44336'
                  const flowSpeed = Math.max(0.5, Math.min(3, pipe.parameters.flowRate / 30))

                  return (
                    <g key={pipe.id}>
                      {/* Pipeline elements - not clickable */}

                      {/* CONTINUOUS PIPE - Full length from Dam to CSTPS */}
                      {/* Pipe outline (dark border) - CONTINUOUS */}
                      <line
                        x1="138"
                        y1={yPos}
                        x2="880"
                        y2={yPos}
                        stroke="#263238"
                        strokeWidth="18"
                      />
                      {/* Pipe fill - CONTINUOUS */}
                      <line
                        x1="138"
                        y1={yPos}
                        x2="880"
                        y2={yPos}
                        stroke={hasFlow ? 'url(#pipeGradientBlue)' : 'url(#pipeGradientGray)'}
                        strokeWidth="14"
                      />
                      {/* Inner highlight - CONTINUOUS */}
                      <line
                        x1="138"
                        y1={yPos - 4}
                        x2="880"
                        y2={yPos - 4}
                        stroke={hasFlow ? '#4FC3F7' : '#9E9E9E'}
                        strokeWidth="2"
                        opacity="0.4"
                      />

                      {/* Pipe ID Label */}
                      <g transform={`translate(155, ${yPos - 20})`}>
                        <rect x="-20" y="-11" width="40" height="20" fill="#37474F" stroke="#263238" strokeWidth="1" rx="3"/>
                        <text y="4" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          L-{String(index + 1).padStart(2, '0')}
                        </text>
                      </g>

                      {/* Flow Animation Particles */}
                      {hasFlow && (
                        <g>
                          {[0, 1, 2, 3, 4, 5].map(i => (
                            <circle key={i} r="5" fill="#00E5FF" filter="url(#glowBlue)">
                              <animateMotion
                                dur={`${2.5 / flowSpeed}s`}
                                repeatCount="indefinite"
                                path={`M 143 ${yPos} L 875 ${yPos}`}
                                begin={`${i * 0.4}s`}
                              />
                              <animate
                                attributeName="opacity"
                                values="0;1;1;0"
                                dur={`${2.5 / flowSpeed}s`}
                                repeatCount="indefinite"
                                begin={`${i * 0.4}s`}
                              />
                            </circle>
                          ))}
                        </g>
                      )}

                      {/* CONTROL VALVE (CV) - DAM side (before flow transmitter) */}
                      <g transform={`translate(220, ${yPos})`}>
                        {/* Valve body - bowtie shape */}
                        <polygon points="-18,-18 0,0 -18,18" fill={hasFlow ? '#4CAF50' : '#757575'} stroke="#263238" strokeWidth="2"/>
                        <polygon points="18,-18 0,0 18,18" fill={hasFlow ? '#4CAF50' : '#757575'} stroke="#263238" strokeWidth="2"/>
                        {/* Actuator */}
                        <circle cy="-26" r="12" fill={hasFlow ? '#C8E6C9' : '#E0E0E0'} stroke="#263238" strokeWidth="2"/>
                        <line y1="-14" y2="0" stroke="#263238" strokeWidth="2.5"/>
                        {/* Position indicator */}
                        <text y="-23" textAnchor="middle" fill="#263238" fontSize="8" fontWeight="bold">
                          {hasFlow ? '100' : '0'}%
                        </text>
                        {/* Valve tag */}
                        <rect x="-22" y="22" width="44" height="18" fill="#37474F" stroke="#263238" strokeWidth="1" rx="2"/>
                        <text y="35" textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="bold">
                          CV-{String(index + 1).padStart(2, '0')}
                        </text>
                      </g>

                      {/* FLOW TRANSMITTER (FT) - After control valve - CLICKABLE */}
                      <g
                        transform={`translate(420, ${yPos})`}
                        onClick={() => handlePipeClick(pipe.id)}
                        onMouseEnter={() => setHoveredPipe(pipe.id)}
                        onMouseLeave={() => setHoveredPipe(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Hover highlight for FT block */}
                        {isHovered && (
                          <rect x="-25" y="-25" width="155" height="50" fill="#E3F2FD" stroke="#1565C0" strokeWidth="2" strokeDasharray="4 2" rx="6" opacity="0.7"/>
                        )}
                        {/* Instrument circle */}
                        <circle r="20" fill="white" stroke={isHovered ? '#0D47A1' : '#1565C0'} strokeWidth={isHovered ? 4 : 3}/>
                        <text y="-5" textAnchor="middle" fill="#1565C0" fontSize="10" fontWeight="bold">FT</text>
                        <text y="8" textAnchor="middle" fill="#37474F" fontSize="9" fontWeight="bold">{String(index + 1).padStart(3, '0')}</text>

                        {/* Status LED */}
                        <circle cx="14" cy="-14" r="5" fill={statusColor} filter={hasFlow ? 'url(#glowGreen)' : ''}>
                          {hasFlow && (
                            <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
                          )}
                        </circle>

                        {/* Digital Display - positioned to the right of FT */}
                        <g transform="translate(55, 0)">
                          <rect x="-5" y="-16" width="70" height="32" fill={isHovered ? '#0A1929' : '#0D1B2A'} stroke={isHovered ? '#00E5FF' : '#1565C0'} strokeWidth={isHovered ? 2 : 1.5} rx="4"/>
                          <text x="30" y="0" textAnchor="middle" fill="#00E5FF" fontSize="15" fontFamily="monospace" fontWeight="bold" filter={hasFlow ? 'url(#glowBlue)' : ''}>
                            {pipe.parameters.flowRate.toFixed(1)}
                          </text>
                          <text x="30" y="12" textAnchor="middle" fill="#4FC3F7" fontSize="8" fontFamily="monospace">m3/h</text>
                        </g>
                      </g>

                      {/* Flow Direction Arrow - middle of pipe */}
                      {hasFlow && (
                        <g transform={`translate(600, ${yPos})`}>
                          <polygon points="-8,-5 8,0 -8,5" fill="#FFFFFF" opacity="0.9">
                            <animate attributeName="opacity" values="0.5;1;0.5" dur="0.6s" repeatCount="indefinite"/>
                          </polygon>
                        </g>
                      )}

                      {/* Velocity indicator - near CSTPS side */}
                      <g transform={`translate(750, ${yPos - 22})`}>
                        <rect x="-32" y="-11" width="64" height="22" fill="white" stroke="#455A64" strokeWidth="1.5" rx="3"/>
                        <text y="5" textAnchor="middle" fill={hasFlow ? '#01579B' : '#757575'} fontSize="11" fontFamily="monospace" fontWeight="bold">
                          {pipe.parameters.velocity.toFixed(2)} m/s
                        </text>
                      </g>

                      {/* No Flow Indicator */}
                      {!hasFlow && (
                        <g>
                          <line x1="550" y1={yPos - 12} x2="570" y2={yPos + 12} stroke="#D32F2F" strokeWidth="4"/>
                          <line x1="570" y1={yPos - 12} x2="550" y2={yPos + 12} stroke="#D32F2F" strokeWidth="4"/>
                          <rect x="540" y={yPos + 18} width="60" height="16" fill="#FFEBEE" stroke="#D32F2F" strokeWidth="1" rx="2"/>
                          <text x="570" y={yPos + 30} textAnchor="middle" fill="#D32F2F" fontSize="9" fontWeight="bold">NO FLOW</text>
                        </g>
                      )}
                    </g>
                  )
                })}

                {/* LEGEND BOX */}
                <g transform="translate(20, 478)">
                  <rect x="0" y="0" width="960" height="52" fill="white" stroke="#455A64" strokeWidth="1.5" rx="4"/>

                  <text x="15" y="18" fill="#263238" fontSize="11" fontWeight="bold">LEGEND:</text>

                  {/* Gravity Flow indicator */}
                  <g transform="translate(95, 14)">
                    <polygon points="0,-6 8,0 0,6" fill="#1565C0"/>
                    <line x1="-15" y1="0" x2="0" y2="0" stroke="#01579B" strokeWidth="4"/>
                  </g>
                  <text x="115" y="18" fill="#37474F" fontSize="9" fontWeight="bold">GRAVITY FLOW</text>

                  {/* Control Valve */}
                  <g transform="translate(220, 14)">
                    <polygon points="-6,-6 0,0 -6,6" fill="#4CAF50" stroke="#263238" strokeWidth="1"/>
                    <polygon points="6,-6 0,0 6,6" fill="#4CAF50" stroke="#263238" strokeWidth="1"/>
                  </g>
                  <text x="240" y="18" fill="#37474F" fontSize="9">CONTROL VALVE</text>

                  {/* Flow Transmitter */}
                  <g transform="translate(345, 14)">
                    <circle r="9" fill="white" stroke="#1565C0" strokeWidth="2"/>
                    <text y="3" textAnchor="middle" fill="#1565C0" fontSize="7" fontWeight="bold">FT</text>
                  </g>
                  <text x="365" y="18" fill="#37474F" fontSize="9">FLOW TRANSMITTER</text>

                  {/* Status Indicators */}
                  <circle cx="490" cy="14" r="6" fill="#4CAF50"/>
                  <text x="502" y="18" fill="#37474F" fontSize="9">ONLINE</text>

                  <circle cx="565" cy="14" r="6" fill="#FFC107"/>
                  <text x="577" y="18" fill="#37474F" fontSize="9">WARNING</text>

                  <circle cx="650" cy="14" r="6" fill="#F44336"/>
                  <text x="662" y="18" fill="#37474F" fontSize="9">OFFLINE</text>

                  {/* Pipe indicator */}
                  <line x1="720" y1="14" x2="760" y2="14" stroke="#01579B" strokeWidth="6"/>
                  <line x1="720" y1="14" x2="760" y2="14" stroke="#263238" strokeWidth="8" strokeLinecap="round" opacity="0"/>
                  <text x="772" y="18" fill="#37474F" fontSize="9">WATER PIPE</text>

                  {/* Second row */}
                  <text x="15" y="40" fill="#546E7A" fontSize="9" fontFamily="monospace">
                    FT = FLOW TRANSMITTER | CV = CONTROL VALVE | NIVUS NivuFlow 750 Sensors
                  </text>
                  <text x="700" y="40" fill="#78909C" fontSize="9" fontFamily="monospace">
                    Teltonika RUT955 Gateway
                  </text>
                </g>
              </svg>
              </div>
              )}
            </div>
          </div>

          {/* Right Panel - Sensor Details (Draggable) */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-[#BDBDBD] bg-white shadow-sm">
              <div className="border-b border-[#E0E0E0] bg-[#EEEEEE] px-2 md:px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-[#424242]">
                  SENSOR READINGS
                </span>
              </div>
              <div className="p-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 lg:space-y-0 max-h-[300px] lg:max-h-[520px] overflow-y-auto">
                {sensorOrder.map((pipe, index) => {
                  const hasFlow = pipe.status !== 'offline' && pipe.parameters.flowRate > 0
                  const statusColor = pipe.status === 'online' ? '#4CAF50' : pipe.status === 'warning' ? '#FFC107' : '#F44336'
                  const isDragging = draggedIndex === index
                  const isDragOver = dragOverIndex === index
                  return (
                    <div
                      key={pipe.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`rounded-lg border p-2.5 transition-all cursor-grab active:cursor-grabbing ${
                        isDragging
                          ? 'opacity-50 border-[#1565C0] bg-[#E3F2FD] shadow-lg scale-105'
                          : isDragOver
                          ? 'border-[#1565C0] border-dashed bg-[#E3F2FD]/50'
                          : hoveredPipe === pipe.id
                          ? 'border-[#1565C0] bg-[#E3F2FD] shadow-md'
                          : 'border-[#E0E0E0] bg-[#FAFAFA] hover:border-[#90CAF9] hover:bg-[#E3F2FD]'
                      }`}
                      onMouseEnter={() => setHoveredPipe(pipe.id)}
                      onMouseLeave={() => setHoveredPipe(null)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          href={`/cstps-pipeline/${pipe.id}`}
                          className="text-xs font-bold text-[#263238] font-mono hover:text-[#1565C0]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          FT-{String(pipe.pipeNumber).padStart(3, '0')}
                        </Link>
                        <div className="flex items-center space-x-1">
                          {hasFlow && (
                            <div className="h-1.5 w-4 rounded-full bg-[#01579B] overflow-hidden">
                              <div className="h-full w-1/2 bg-[#29B6F6] animate-pulse"></div>
                            </div>
                          )}
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: statusColor,
                              boxShadow: pipe.status === 'online' ? `0 0 6px ${statusColor}` : 'none'
                            }}
                          ></div>
                        </div>
                      </div>
                      <Link
                        href={`/cstps-pipeline/${pipe.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="block"
                      >
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div className="bg-[#0D1B2A] rounded px-1.5 py-1">
                            <span className="text-[#90CAF9] block">FLOW</span>
                            <div className={`font-mono font-bold ${hasFlow ? 'text-[#00E5FF]' : 'text-[#546E7A]'}`}>
                              {pipe.parameters.flowRate.toFixed(1)}
                              <span className="text-[#4FC3F7] font-normal ml-0.5">m3/h</span>
                            </div>
                          </div>
                          <div className="bg-[#0D1B2A] rounded px-1.5 py-1">
                            <span className="text-[#90CAF9] block">VEL</span>
                            <div className={`font-mono font-bold ${hasFlow ? 'text-[#00E5FF]' : 'text-[#546E7A]'}`}>
                              {pipe.parameters.velocity.toFixed(2)}
                              <span className="text-[#4FC3F7] font-normal ml-0.5">m/s</span>
                            </div>
                          </div>
                          <div className="bg-[#0D1B2A] rounded px-1.5 py-1">
                            <span className="text-[#90CAF9] block">LEVEL</span>
                            <div className="font-mono font-bold text-[#00E5FF]">
                              {pipe.parameters.waterLevel}
                              <span className="text-[#4FC3F7] font-normal ml-0.5">mm</span>
                            </div>
                          </div>
                          <div className="bg-[#0D1B2A] rounded px-1.5 py-1">
                            <span className="text-[#90CAF9] block">TEMP</span>
                            <div className="font-mono font-bold text-[#00E5FF]">
                              {pipe.parameters.temperature.toFixed(1)}
                              <span className="text-[#4FC3F7] font-normal ml-0.5">C</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-3 md:mt-4 rounded-lg border border-[#BDBDBD] bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 md:px-4 py-2 gap-2 sm:gap-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 md:space-x-6 text-[10px] md:text-xs font-mono">
              <div className="flex items-center space-x-1 md:space-x-2">
                <span className="text-[#37474F] font-semibold">PLC:</span>
                <span className="text-[#4CAF50] flex items-center">
                  <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-[#4CAF50] mr-1 animate-pulse"></span>
                  <span className="hidden xs:inline">CONNECTED</span>
                  <span className="xs:hidden">OK</span>
                </span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <span className="text-[#37474F] font-semibold">MODBUS:</span>
                <span className="text-[#4CAF50]">OK</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <span className="text-[#37474F] font-semibold">DB:</span>
                <span className="text-[#4CAF50]">OK</span>
              </div>
              <div className="flex items-center space-x-1 md:space-x-2">
                <span className="text-[#37474F] font-semibold">SCAN:</span>
                <span className="text-[#1565C0]">{currentTime ? currentTime.toLocaleTimeString('en-GB') : '--:--:--'}</span>
              </div>
            </div>
            <div className="text-[9px] md:text-xs text-[#78909C] font-mono">
              <span className="hidden md:inline">FluxIO SCADA v1.7 | Gravity Fed System | </span>CSTPS Water Supply
            </div>
          </div>
        </div>
      </main>

      {/* Version Footer */}
      <footer className="text-center py-2 text-[9px] md:text-[10px] text-[#90A4AE]">
        Version 3.0 | January 22, 2026 | github.com/chatgptnotes/fluxio
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes flowRight {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: translateX(-10%);
          }
          50% {
            transform: translateX(10%);
          }
        }

        @keyframes smokeRise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.6;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-50px) scale(1.8);
            opacity: 0;
          }
        }

        @keyframes smokeDrift {
          0%, 100% {
            transform: translateX(0) translateY(0);
          }
          25% {
            transform: translateX(8px) translateY(-10px);
          }
          50% {
            transform: translateX(12px) translateY(-20px);
          }
          75% {
            transform: translateX(6px) translateY(-15px);
          }
        }

        @keyframes pipeGlow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes waterShimmer {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  )
}
