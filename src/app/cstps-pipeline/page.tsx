'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { cstpsPipes, getStatusColor } from '@/lib/cstps-data'

export default function CSTPSPipelinePage() {
  const router = useRouter()
  const [hoveredPipe, setHoveredPipe] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    // Set initial time on client only to avoid hydration mismatch
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handlePipeClick = (pipeId: string) => {
    router.push(`/cstps-pipeline/${pipeId}`)
  }

  // Calculate totals
  const totalFlow = cstpsPipes.reduce((sum, p) => sum + p.parameters.flowRate, 0)
  const onlineCount = cstpsPipes.filter((p) => p.status === 'online').length
  const warningCount = cstpsPipes.filter((p) => p.status === 'warning').length
  const offlineCount = cstpsPipes.filter((p) => p.status === 'offline').length

  return (
    <div className="min-h-screen bg-white">
      {/* SCADA Header Bar */}
      <header className="border-b-2 border-cyan-900/50 bg-gradient-to-r from-[#0d1520] via-[#0f1a2a] to-[#0d1520]">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="flex items-center space-x-2 rounded bg-cyan-900/30 px-3 py-1.5 text-sm text-cyan-400 transition-all hover:bg-cyan-800/40 hover:text-cyan-300 border border-cyan-800/50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>EXIT</span>
            </Link>
            <div className="h-6 w-px bg-cyan-900/50"></div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
                <div className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-green-500 opacity-75"></div>
              </div>
              <span className="text-sm font-bold tracking-wider text-green-400">
                SYSTEM ONLINE
              </span>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-lg font-bold tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
              CSTPS WATER SUPPLY SCADA
            </h1>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="rounded bg-[#0d1520] px-3 py-1 font-mono text-cyan-300 border border-cyan-900/50">
              {currentTime ? currentTime.toLocaleDateString('en-GB') : '--/--/----'}
            </div>
            <div className="rounded bg-[#0d1520] px-3 py-1 font-mono text-cyan-300 border border-cyan-900/50">
              {currentTime ? currentTime.toLocaleTimeString('en-GB') : '--:--:--'}
            </div>
            <Link
              href="/dashboard/reports"
              className="flex items-center space-x-1 rounded bg-cyan-900/30 px-3 py-1 text-cyan-400 hover:bg-cyan-800/40 border border-cyan-800/50"
            >
              <span className="material-icons text-base">description</span>
              <span className="text-sm">REPORTS</span>
            </Link>
            <button className="flex items-center space-x-1 rounded bg-cyan-900/30 px-3 py-1 text-cyan-400 hover:bg-cyan-800/40 border border-cyan-800/50">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main SCADA Display */}
      <main className="p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - System Status */}
          <div className="col-span-2 space-y-4">
            {/* Status Summary */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-cyan-400">
                  SYSTEM STATUS
                </span>
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]"></div>
                    <span className="text-xs text-white font-bold">ONLINE</span>
                  </div>
                  <span className="rounded bg-green-900/30 px-2 py-0.5 font-mono text-sm font-bold text-green-400">
                    {onlineCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_6px_#eab308]"></div>
                    <span className="text-xs text-white font-bold">WARNING</span>
                  </div>
                  <span className="rounded bg-yellow-900/30 px-2 py-0.5 font-mono text-sm font-bold text-yellow-400">
                    {warningCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></div>
                    <span className="text-xs text-white font-bold">OFFLINE</span>
                  </div>
                  <span className="rounded bg-red-900/30 px-2 py-0.5 font-mono text-sm font-bold text-red-400">
                    {offlineCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Flow */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-cyan-400">
                  TOTAL FLOW RATE
                </span>
              </div>
              <div className="p-4 text-center">
                <div className="font-mono text-3xl font-bold text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                  {totalFlow.toFixed(1)}
                </div>
                <div className="text-xs text-white font-bold mt-1">m³/h</div>
                <div className="mt-2 h-1 w-full rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((totalFlow / 500) * 100, 100)}%` }}
                  >
                    <div className="h-full w-full animate-pulse bg-white/20"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alarms Panel */}
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-cyan-400">
                  ACTIVE ALARMS
                </span>
                {cstpsPipes.filter(p => p.status !== 'online').length > 0 && (
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]"></div>
                )}
              </div>
              <div className="p-2 space-y-1 max-h-40 overflow-y-auto">
                {cstpsPipes.filter(p => p.status !== 'online').map(pipe => (
                  <div
                    key={pipe.id}
                    className={`rounded px-2 py-1.5 text-xs border ${
                      pipe.status === 'warning'
                        ? 'bg-yellow-900/20 text-yellow-400 border-yellow-800/50'
                        : 'bg-red-900/20 text-red-400 border-red-800/50 animate-pulse'
                    }`}
                  >
                    <div className="font-bold font-mono">{pipe.deviceId}</div>
                    <div className="text-[10px] opacity-75">
                      {pipe.status === 'warning' ? 'LOW BATTERY WARNING' : 'COMMUNICATION FAILURE'}
                    </div>
                  </div>
                ))}
                {cstpsPipes.filter(p => p.status !== 'online').length === 0 && (
                  <div className="text-center text-xs text-white font-bold py-4">
                    NO ACTIVE ALARMS
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Center - Main SCADA Diagram */}
          <div className="col-span-8">
            <div className="rounded-lg border border-slate-300 bg-slate-100 overflow-hidden">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2 flex items-center justify-between">
                <span className="text-xs font-bold tracking-wider text-cyan-400">
                  PROCESS FLOW DIAGRAM - DAM TO CSTPS GENERATION PLANT
                </span>
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] text-white font-bold">SCAN RATE: 1000ms</span>
                  <div className="flex items-center space-x-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] text-green-400">LIVE</span>
                  </div>
                </div>
              </div>

              {/* SCADA SVG Diagram */}
              <svg
                viewBox="0 0 1000 520"
                className="w-full"
              >
                <defs>
                  {/* Grid pattern */}
                  <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#0c1929" strokeWidth="0.5" />
                  </pattern>

                  {/* Pipe gradient */}
                  <linearGradient id="pipeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#374151" />
                    <stop offset="30%" stopColor="#1f2937" />
                    <stop offset="70%" stopColor="#1f2937" />
                    <stop offset="100%" stopColor="#374151" />
                  </linearGradient>

                  {/* Empty pipe gradient (no flow) */}
                  <linearGradient id="emptyPipeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1f2937" />
                    <stop offset="50%" stopColor="#111827" />
                    <stop offset="100%" stopColor="#1f2937" />
                  </linearGradient>

                  {/* Water flow gradient - animated */}
                  <linearGradient id="waterFlow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0891b2">
                      <animate attributeName="stop-color" values="#0891b2;#22d3ee;#0891b2" dur="2s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="50%" stopColor="#22d3ee">
                      <animate attributeName="stop-color" values="#22d3ee;#67e8f9;#22d3ee" dur="2s" repeatCount="indefinite" />
                    </stop>
                    <stop offset="100%" stopColor="#0891b2">
                      <animate attributeName="stop-color" values="#0891b2;#22d3ee;#0891b2" dur="2s" repeatCount="indefinite" />
                    </stop>
                  </linearGradient>

                  {/* Glow filters */}
                  <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>

                  <filter id="glowGreen" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>

                  {/* Water particle */}
                  <radialGradient id="waterParticle">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity="1" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                  </radialGradient>

                  {/* Bubble gradient */}
                  <radialGradient id="bubble" cx="30%" cy="30%">
                    <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.2" />
                  </radialGradient>
                </defs>

                {/* Background */}
                <rect width="100%" height="100%" fill="#f1f5f9" />
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* DAM Structure */}
                <g transform="translate(20, 40)">
                  {/* Dam body */}
                  <path
                    d="M 10 20 L 110 20 L 130 420 L -10 420 Z"
                    fill="url(#pipeGradient)"
                    stroke="#4b5563"
                    strokeWidth="2"
                  />

                  {/* Water in dam */}
                  <clipPath id="damClip">
                    <path d="M 15 25 L 105 25 L 123 415 L -3 415 Z" />
                  </clipPath>

                  <g clipPath="url(#damClip)">
                    {/* Water body */}
                    <rect x="-5" y="60" width="135" height="360" fill="#0c4a6e" opacity="0.6" />

                    {/* Animated water surface */}
                    <path
                      d="M -5 60 Q 30 55, 60 60 T 130 60 L 130 420 L -5 420 Z"
                      fill="#0891b2"
                      opacity="0.4"
                    >
                      <animate
                        attributeName="d"
                        values="M -5 60 Q 30 55, 60 60 T 130 60 L 130 420 L -5 420 Z;
                                M -5 65 Q 30 70, 60 65 T 130 65 L 130 420 L -5 420 Z;
                                M -5 60 Q 30 55, 60 60 T 130 60 L 130 420 L -5 420 Z"
                        dur="3s"
                        repeatCount="indefinite"
                      />
                    </path>

                    {/* Water shimmer effect */}
                    <rect x="0" y="60" width="120" height="360" fill="url(#waterFlow)" opacity="0.1">
                      <animate attributeName="opacity" values="0.05;0.15;0.05" dur="2s" repeatCount="indefinite" />
                    </rect>
                  </g>

                  {/* Water level markers */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <g key={i}>
                      <line x1="110" y1={80 + i * 70} x2="125" y2={80 + i * 70} stroke="#4b5563" strokeWidth="1" />
                      <text x="130" y={84 + i * 70} fill="#6b7280" fontSize="9" fontFamily="monospace">
                        {100 - i * 20}%
                      </text>
                    </g>
                  ))}

                  {/* Dam label */}
                  <rect x="5" y="-25" width="100" height="24" fill="#0d1520" stroke="#1e3a5f" strokeWidth="1" rx="2" />
                  <text x="55" y="-8" textAnchor="middle" fill="#22d3ee" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    RESERVOIR
                  </text>
                </g>

                {/* CSTPS Building */}
                <g transform="translate(860, 60)">
                  {/* Main building */}
                  <rect x="0" y="0" width="110" height="380" fill="#1f2937" stroke="#4b5563" strokeWidth="2" rx="2" />

                  {/* Building sections with glow for active */}
                  {[0, 1, 2].map(i => (
                    <g key={i}>
                      <rect
                        x="10"
                        y={20 + i * 120}
                        width="90"
                        height="100"
                        fill="#111827"
                        stroke="#374151"
                        strokeWidth="1"
                        rx="2"
                      />
                      {/* Active indicator */}
                      <circle cx="90" cy={40 + i * 120} r="6" fill="#22c55e" filter="url(#glowGreen)">
                        <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                      {/* Unit label */}
                      <text x="50" y={75 + i * 120} textAnchor="middle" fill="#6b7280" fontSize="10" fontFamily="monospace">
                        UNIT {i + 1}
                      </text>
                    </g>
                  ))}

                  {/* Building label */}
                  <rect x="-5" y="-25" width="120" height="24" fill="#0d1520" stroke="#1e3a5f" strokeWidth="1" rx="2" />
                  <text x="55" y="-8" textAnchor="middle" fill="#22d3ee" fontSize="11" fontFamily="monospace" fontWeight="bold">
                    CSTPS PLANT
                  </text>
                </g>

                {/* Pipes */}
                {cstpsPipes.map((pipe, index) => {
                  const yPos = 95 + index * 65
                  const isHovered = hoveredPipe === pipe.id
                  const statusColor = getStatusColor(pipe.status)
                  const hasFlow = pipe.status !== 'offline' && pipe.parameters.flowRate > 0
                  const flowSpeed = Math.max(0.3, Math.min(2, pipe.parameters.flowRate / 50))

                  return (
                    <g
                      key={pipe.id}
                      onClick={() => handlePipeClick(pipe.id)}
                      onMouseEnter={() => setHoveredPipe(pipe.id)}
                      onMouseLeave={() => setHoveredPipe(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Pipe shadow */}
                      <line
                        x1="150"
                        y1={yPos + 3}
                        x2="860"
                        y2={yPos + 3}
                        stroke="#000"
                        strokeWidth={18}
                        strokeLinecap="round"
                        opacity="0.5"
                      />

                      {/* Main pipe body */}
                      <line
                        x1="150"
                        y1={yPos}
                        x2="860"
                        y2={yPos}
                        stroke={hasFlow ? 'url(#pipeGradient)' : 'url(#emptyPipeGradient)'}
                        strokeWidth={isHovered ? 18 : 16}
                        strokeLinecap="round"
                        className="transition-all duration-200"
                      />

                      {/* Inner pipe highlight */}
                      <line
                        x1="155"
                        y1={yPos - 3}
                        x2="855"
                        y2={yPos - 3}
                        stroke={hasFlow ? '#374151' : '#1f2937'}
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.5"
                      />

                      {/* Water flow visualization */}
                      {hasFlow ? (
                        <g>
                          {/* Main water stream */}
                          <line
                            x1="160"
                            y1={yPos}
                            x2="850"
                            y2={yPos}
                            stroke="url(#waterFlow)"
                            strokeWidth={isHovered ? 10 : 8}
                            strokeLinecap="round"
                            filter="url(#glowCyan)"
                            opacity="0.8"
                          />

                          {/* Animated flow segments */}
                          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                            <rect
                              key={i}
                              x={180 + i * 85}
                              y={yPos - 3}
                              width="40"
                              height="6"
                              fill="#22d3ee"
                              opacity="0.6"
                              rx="3"
                            >
                              <animate
                                attributeName="x"
                                from={160 + i * 85}
                                to={245 + i * 85}
                                dur={`${flowSpeed}s`}
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                values="0.3;0.7;0.3"
                                dur={`${flowSpeed}s`}
                                repeatCount="indefinite"
                              />
                            </rect>
                          ))}

                          {/* Flow particles */}
                          {[0, 1, 2, 3, 4, 5].map(i => (
                            <circle
                              key={`particle-${i}`}
                              r="3"
                              fill="url(#waterParticle)"
                              filter="url(#glowCyan)"
                            >
                              <animateMotion
                                dur={`${1.5 + i * 0.2}s`}
                                repeatCount="indefinite"
                                path={`M 160 ${yPos} L 850 ${yPos}`}
                                begin={`${i * 0.25}s`}
                              />
                              <animate
                                attributeName="opacity"
                                values="0;1;1;0"
                                dur={`${1.5 + i * 0.2}s`}
                                repeatCount="indefinite"
                                begin={`${i * 0.25}s`}
                              />
                            </circle>
                          ))}

                          {/* Bubbles */}
                          {[0, 1, 2].map(i => (
                            <circle
                              key={`bubble-${i}`}
                              r="2"
                              fill="url(#bubble)"
                            >
                              <animateMotion
                                dur={`${2 + i * 0.3}s`}
                                repeatCount="indefinite"
                                path={`M 200 ${yPos + 2} Q 400 ${yPos - 3} 500 ${yPos + 2} T 800 ${yPos - 2}`}
                                begin={`${i * 0.7}s`}
                              />
                              <animate
                                attributeName="r"
                                values="1;2.5;1"
                                dur={`${2 + i * 0.3}s`}
                                repeatCount="indefinite"
                                begin={`${i * 0.7}s`}
                              />
                            </circle>
                          ))}

                          {/* Flow direction arrows */}
                          {[0, 1, 2, 3].map(i => (
                            <polygon
                              key={`arrow-${i}`}
                              points="0,-5 10,0 0,5"
                              fill="#22d3ee"
                              opacity="0"
                            >
                              <animateMotion
                                dur="2s"
                                repeatCount="indefinite"
                                path={`M ${220 + i * 160} ${yPos} L ${340 + i * 160} ${yPos}`}
                                begin={`${i * 0.5}s`}
                              />
                              <animate
                                attributeName="opacity"
                                values="0;0.8;0"
                                dur="2s"
                                repeatCount="indefinite"
                                begin={`${i * 0.5}s`}
                              />
                            </polygon>
                          ))}
                        </g>
                      ) : (
                        /* No flow visualization */
                        <g>
                          {/* Empty pipe interior */}
                          <line
                            x1="160"
                            y1={yPos}
                            x2="850"
                            y2={yPos}
                            stroke="#1f2937"
                            strokeWidth={isHovered ? 10 : 8}
                            strokeLinecap="round"
                          />

                          {/* "NO FLOW" markers */}
                          <g opacity="0.6">
                            <line x1="300" y1={yPos - 8} x2="320" y2={yPos + 8} stroke="#ef4444" strokeWidth="2" />
                            <line x1="320" y1={yPos - 8} x2="300" y2={yPos + 8} stroke="#ef4444" strokeWidth="2" />
                          </g>
                          <g opacity="0.6">
                            <line x1="500" y1={yPos - 8} x2="520" y2={yPos + 8} stroke="#ef4444" strokeWidth="2" />
                            <line x1="520" y1={yPos - 8} x2="500" y2={yPos + 8} stroke="#ef4444" strokeWidth="2" />
                          </g>
                          <g opacity="0.6">
                            <line x1="700" y1={yPos - 8} x2="720" y2={yPos + 8} stroke="#ef4444" strokeWidth="2" />
                            <line x1="720" y1={yPos - 8} x2="700" y2={yPos + 8} stroke="#ef4444" strokeWidth="2" />
                          </g>

                          {/* Static "empty" text */}
                          <text x="505" y={yPos + 28} textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace">
                            NO FLOW
                          </text>
                        </g>
                      )}

                      {/* Inlet valve */}
                      <g transform={`translate(155, ${yPos})`}>
                        <polygon
                          points="-10,-12 10,-12 0,0"
                          fill={hasFlow ? '#374151' : '#1f2937'}
                          stroke="#4b5563"
                          strokeWidth="1"
                        />
                        <polygon
                          points="-10,12 10,12 0,0"
                          fill={hasFlow ? '#374151' : '#1f2937'}
                          stroke="#4b5563"
                          strokeWidth="1"
                        />
                        <circle cx="0" cy="0" r="5" fill={statusColor} filter={hasFlow ? 'url(#glowGreen)' : ''}>
                          {hasFlow && (
                            <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" />
                          )}
                        </circle>
                      </g>

                      {/* Flow meter */}
                      <g transform={`translate(505, ${yPos})`}>
                        {/* Meter housing */}
                        <rect
                          x="-40"
                          y="-28"
                          width="80"
                          height="56"
                          fill="#0d1520"
                          stroke={isHovered ? '#22d3ee' : '#1e3a5f'}
                          strokeWidth={isHovered ? 2 : 1}
                          rx="4"
                        />

                        {/* Status LED with glow */}
                        <circle cx="-28" cy="-16" r="5" fill={statusColor} filter="url(#glowGreen)">
                          {pipe.status === 'online' && (
                            <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
                          )}
                        </circle>

                        {/* Digital display */}
                        <rect x="-15" y="-22" width="50" height="20" fill="#000" stroke="#1e3a5f" strokeWidth="1" rx="2" />

                        {/* Flow value with animation */}
                        <text
                          x="10"
                          y="-8"
                          textAnchor="middle"
                          fill={hasFlow ? '#22d3ee' : '#6b7280'}
                          fontSize="12"
                          fontFamily="monospace"
                          fontWeight="bold"
                          filter={hasFlow ? 'url(#glowCyan)' : ''}
                        >
                          {pipe.parameters.flowRate.toFixed(1)}
                        </text>

                        {/* Unit */}
                        <text x="0" y="8" textAnchor="middle" fill="#4b5563" fontSize="8" fontFamily="monospace">
                          m³/h
                        </text>

                        {/* Meter ID */}
                        <text x="0" y="22" textAnchor="middle" fill="#6b7280" fontSize="8" fontFamily="monospace">
                          FT-{String(index + 1).padStart(2, '0')}
                        </text>
                      </g>

                      {/* Outlet valve */}
                      <g transform={`translate(855, ${yPos})`}>
                        <polygon
                          points="-10,-12 10,-12 0,0"
                          fill={hasFlow ? '#374151' : '#1f2937'}
                          stroke="#4b5563"
                          strokeWidth="1"
                        />
                        <polygon
                          points="-10,12 10,12 0,0"
                          fill={hasFlow ? '#374151' : '#1f2937'}
                          stroke="#4b5563"
                          strokeWidth="1"
                        />
                        <circle cx="0" cy="0" r="5" fill={statusColor} filter={hasFlow ? 'url(#glowGreen)' : ''}>
                          {hasFlow && (
                            <animate attributeName="opacity" values="1;0.6;1" dur="1s" repeatCount="indefinite" />
                          )}
                        </circle>
                      </g>

                      {/* Pipe label */}
                      <g transform={`translate(220, ${yPos - 22})`}>
                        <rect x="-25" y="-9" width="50" height="18" fill="#0d1520" stroke="#1e3a5f" strokeWidth="1" rx="2" />
                        <text x="0" y="4" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">
                          PIPE-{String(index + 1).padStart(2, '0')}
                        </text>
                      </g>

                      {/* Velocity indicator */}
                      <g transform={`translate(380, ${yPos - 22})`}>
                        <rect x="-30" y="-9" width="60" height="18" fill="#0d1520" stroke="#1e3a5f" strokeWidth="1" rx="2" />
                        <text x="0" y="4" textAnchor="middle" fill={hasFlow ? '#22d3ee' : '#4b5563'} fontSize="9" fontFamily="monospace">
                          {pipe.parameters.velocity.toFixed(2)} m/s
                        </text>
                      </g>

                      {/* Hover highlight */}
                      {isHovered && (
                        <rect
                          x="145"
                          y={yPos - 35}
                          width="720"
                          height="70"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="1"
                          strokeDasharray="5 5"
                          opacity="0.5"
                          rx="4"
                        />
                      )}
                    </g>
                  )
                })}

                {/* Legend */}
                <g transform="translate(20, 475)">
                  <rect x="0" y="0" width="960" height="35" fill="#0d1520" stroke="#1e3a5f" strokeWidth="1" rx="2" />

                  <text x="15" y="22" fill="#4b5563" fontSize="10" fontFamily="monospace" fontWeight="bold">LEGEND:</text>

                  <circle cx="100" cy="17" r="5" fill="#22c55e" filter="url(#glowGreen)" />
                  <text x="112" y="21" fill="#9ca3af" fontSize="9" fontFamily="monospace">ONLINE</text>

                  <circle cx="190" cy="17" r="5" fill="#eab308" />
                  <text x="202" y="21" fill="#9ca3af" fontSize="9" fontFamily="monospace">WARNING</text>

                  <circle cx="290" cy="17" r="5" fill="#ef4444" />
                  <text x="302" y="21" fill="#9ca3af" fontSize="9" fontFamily="monospace">OFFLINE</text>

                  <line x1="380" y1="10" x2="420" y2="10" stroke="#22d3ee" strokeWidth="4" filter="url(#glowCyan)" />
                  <text x="430" y="14" fill="#9ca3af" fontSize="9" fontFamily="monospace">FLOW ACTIVE</text>

                  <line x1="540" y1="10" x2="580" y2="10" stroke="#374151" strokeWidth="4" />
                  <text x="590" y="14" fill="#9ca3af" fontSize="9" fontFamily="monospace">NO FLOW</text>

                  <text x="700" y="21" fill="#4b5563" fontSize="9" fontFamily="monospace">FT = FLOW TRANSMITTER (NIVUS 750)</text>
                </g>
              </svg>
            </div>
          </div>

          {/* Right Panel - Sensor Details */}
          <div className="col-span-2 space-y-2">
            <div className="rounded-lg border border-cyan-900/50 bg-gradient-to-b from-[#0d1520] to-[#0a1018]">
              <div className="border-b border-cyan-900/50 bg-cyan-900/20 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-white">
                  SENSOR READINGS
                </span>
              </div>
              <div className="p-2 space-y-2 max-h-[520px] overflow-y-auto">
                {cstpsPipes.map((pipe) => {
                  const hasFlow = pipe.status !== 'offline' && pipe.parameters.flowRate > 0
                  return (
                    <Link
                      key={pipe.id}
                      href={`/cstps-pipeline/${pipe.id}`}
                      className={`block rounded-lg border p-2.5 transition-all ${
                        hoveredPipe === pipe.id
                          ? 'border-cyan-500 bg-cyan-900/30 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                          : 'border-cyan-900/30 bg-[#0a1018] hover:border-cyan-800/50 hover:bg-[#0d1520]'
                      }`}
                      onMouseEnter={() => setHoveredPipe(pipe.id)}
                      onMouseLeave={() => setHoveredPipe(null)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white font-bold font-mono">
                          FT-{String(pipe.pipeNumber).padStart(2, '0')}
                        </span>
                        <div className="flex items-center space-x-1">
                          {hasFlow && (
                            <div className="h-1.5 w-4 rounded-full bg-cyan-500 overflow-hidden">
                              <div className="h-full w-1/2 bg-cyan-300 animate-pulse"></div>
                            </div>
                          )}
                          <div
                            className="h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: getStatusColor(pipe.status),
                              boxShadow: pipe.status === 'online' ? `0 0 6px ${getStatusColor(pipe.status)}` : 'none'
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-black/30 rounded px-1.5 py-1">
                          <span className="text-white block">FLOW</span>
                          <div className={`font-mono font-bold ${hasFlow ? 'text-cyan-400' : 'text-white font-bold'}`}>
                            {pipe.parameters.flowRate.toFixed(1)}
                            <span className="text-white font-normal ml-0.5">m³/h</span>
                          </div>
                        </div>
                        <div className="bg-black/30 rounded px-1.5 py-1">
                          <span className="text-white block">VEL</span>
                          <div className={`font-mono font-bold ${hasFlow ? 'text-cyan-400' : 'text-white font-bold'}`}>
                            {pipe.parameters.velocity.toFixed(2)}
                            <span className="text-white font-normal ml-0.5">m/s</span>
                          </div>
                        </div>
                        <div className="bg-black/30 rounded px-1.5 py-1">
                          <span className="text-white block">LEVEL</span>
                          <div className="font-mono font-bold text-cyan-400">
                            {pipe.parameters.waterLevel}
                            <span className="text-white font-normal ml-0.5">mm</span>
                          </div>
                        </div>
                        <div className="bg-black/30 rounded px-1.5 py-1">
                          <span className="text-white block">TEMP</span>
                          <div className="font-mono font-bold text-cyan-400">
                            {pipe.parameters.temperature.toFixed(1)}
                            <span className="text-white font-normal ml-0.5">°C</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-4 rounded-lg border border-cyan-900/50 bg-gradient-to-r from-[#0d1520] via-[#0f1a2a] to-[#0d1520]">
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex items-center space-x-6 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold">PLC:</span>
                <span className="text-green-400 flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                  CONNECTED
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold">MODBUS RTU:</span>
                <span className="text-green-400">OK</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold">DB SYNC:</span>
                <span className="text-green-400">OK</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold">LAST SCAN:</span>
                <span className="text-cyan-400">{currentTime ? currentTime.toLocaleTimeString('en-GB') : '--:--:--'}</span>
              </div>
            </div>
            <div className="text-xs text-white font-bold font-mono">
              FluxIO SCADA v1.5 | CSTPS Water Supply System
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
