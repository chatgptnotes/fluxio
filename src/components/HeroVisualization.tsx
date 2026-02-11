'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  CheckCircle2,
  Cloud,
  Cpu,
  Droplets,
  Gauge,
  Radio,
  Router,
  Signal,
  Thermometer,
  Waves,
  Wifi,
} from 'lucide-react'

export default function HeroVisualization() {
  const [flowRate, setFlowRate] = useState(12.47)
  const [volume, setVolume] = useState(45823)

  useEffect(() => {
    const interval = setInterval(() => {
      setFlowRate((prev) => {
        const drift = (Math.random() - 0.5) * 0.6
        const next = prev + drift
        return Math.max(10.5, Math.min(14.5, parseFloat(next.toFixed(2))))
      })
      setVolume((prev) => prev + Math.floor(Math.random() * 3) + 1)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const flowPercent = ((flowRate - 10) / 5) * 100

  const pipelineNodes = [
    { label: 'NIVUS 750', icon: Waves, sublabel: 'Sensor' },
    { label: 'TRB245', icon: Router, sublabel: 'Gateway' },
    { label: 'CLOUD', icon: Cloud, sublabel: 'Platform' },
    { label: 'DASHBOARD', icon: Gauge, sublabel: 'Analytics' },
  ]

  return (
    <div className="relative">
      <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Scan line overlay */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
          <div className="animate-scan-line absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        </div>

        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-cyan-300" />
            <span className="font-semibold text-white">FlowNexus Live</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
            </span>
            <span className="text-xs font-medium tracking-wider text-green-300">
              CONNECTED
            </span>
          </div>
        </div>

        {/* Data Pipeline Flow */}
        <div className="mb-5 rounded-lg bg-white/5 p-4">
          <div className="mb-3 flex items-center space-x-1.5">
            <Signal className="h-3.5 w-3.5 text-white/50" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              Data Pipeline
            </span>
          </div>

          <div className="flex items-center justify-between">
            {pipelineNodes.map((node, i) => (
              <div key={node.label} className="flex items-center">
                {/* Node */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 transition-colors sm:h-11 sm:w-11">
                    <node.icon className="h-4 w-4 text-cyan-300 sm:h-5 sm:w-5" />
                  </div>
                  <span className="mt-1.5 text-[10px] font-bold tracking-wide text-white/90 sm:text-[11px]">
                    {node.label}
                  </span>
                  <span className="text-[9px] text-white/40">{node.sublabel}</span>
                </div>

                {/* Connector line with traveling particle */}
                {i < pipelineNodes.length - 1 && (
                  <div className="relative mx-1.5 h-px flex-1 sm:mx-2.5">
                    {/* Dashed base line */}
                    <div className="absolute inset-0 border-t border-dashed border-white/20" />
                    {/* Traveling particle */}
                    <div
                      className="animate-travel-right absolute top-1/2 -translate-y-1/2"
                      style={{ animationDelay: `${i * 0.4}s` }}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Flow Rate Display */}
        <div className="mb-4 rounded-lg bg-white/10 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Droplets className="h-3.5 w-3.5 text-cyan-300" />
              <span className="text-xs text-white/60">Flow Rate - NIVUS_01</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wifi className="h-3 w-3 text-green-400" />
              <span className="text-[10px] text-green-300">LIVE</span>
            </div>
          </div>
          <div className="mb-2 text-3xl font-bold tabular-nums text-white transition-all duration-500">
            {flowRate.toFixed(2)}{' '}
            <span className="text-lg font-normal text-white/60">m³/h</span>
          </div>
          {/* Progress bar with shimmer */}
          <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-1000"
              style={{ width: `${Math.min(100, Math.max(0, flowPercent))}%` }}
            />
            <div className="animate-shimmer-slide absolute inset-0 rounded-full" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-1 flex items-center space-x-1">
              <Cpu className="h-3 w-3 text-white/50" />
              <span className="text-[10px] text-white/50">Volume</span>
            </div>
            <div className="text-sm font-bold tabular-nums text-white transition-all duration-500">
              {volume.toLocaleString()}{' '}
              <span className="text-[10px] font-normal text-white/50">m³</span>
            </div>
          </div>
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-1 flex items-center space-x-1">
              <Radio className="h-3 w-3 text-white/50" />
              <span className="text-[10px] text-white/50">Devices</span>
            </div>
            <div className="text-sm font-bold text-white">
              6/6{' '}
              <span className="text-[10px] font-normal text-green-300">OK</span>
            </div>
          </div>
          <div className="rounded-lg bg-white/10 p-3 backdrop-blur-sm">
            <div className="mb-1 flex items-center space-x-1">
              <Thermometer className="h-3 w-3 text-white/50" />
              <span className="text-[10px] text-white/50">Temp</span>
            </div>
            <div className="text-sm font-bold text-white">
              24.3{' '}
              <span className="text-[10px] font-normal text-white/50">°C</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center space-x-2 rounded-lg bg-green-500/15 p-2.5 backdrop-blur-sm">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span className="text-xs font-medium text-green-300">
            All 6 pipelines operational
          </span>
        </div>
      </div>
    </div>
  )
}
