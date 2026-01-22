'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { cstpsPipes } from '@/lib/cstps-data'

// Alarm severity types
type AlarmSeverity = 'critical' | 'warning' | 'info'
type AlarmStatus = 'active' | 'acknowledged' | 'cleared'

interface Alarm {
  id: string
  timestamp: Date
  deviceId: string
  pipeNumber: number
  alarmType: string
  description: string
  severity: AlarmSeverity
  status: AlarmStatus
  value?: number
  threshold?: number
  acknowledgedAt?: Date
  acknowledgedBy?: string
  clearedAt?: Date
}

// Generate sample alarm history data
const generateAlarmHistory = (): Alarm[] => {
  const alarmTypes = [
    { type: 'COMM_FAIL', desc: 'Communication Failure', severity: 'critical' as AlarmSeverity },
    { type: 'LOW_BATTERY', desc: 'Low Battery Warning', severity: 'warning' as AlarmSeverity },
    { type: 'HIGH_FLOW', desc: 'High Flow Rate Detected', severity: 'warning' as AlarmSeverity },
    { type: 'ZERO_FLOW', desc: 'Pipeline Flow Zero', severity: 'warning' as AlarmSeverity },
    { type: 'SENSOR_FAULT', desc: 'Sensor Malfunction', severity: 'critical' as AlarmSeverity },
    { type: 'TEMP_HIGH', desc: 'High Temperature', severity: 'warning' as AlarmSeverity },
    { type: 'LEVEL_HIGH', desc: 'High Water Level', severity: 'info' as AlarmSeverity },
    { type: 'LEVEL_LOW', desc: 'Low Water Level', severity: 'info' as AlarmSeverity },
    { type: 'SIGNAL_WEAK', desc: 'Weak Signal Strength', severity: 'info' as AlarmSeverity },
  ]

  const alarms: Alarm[] = []
  const now = new Date()

  // First, add active alarms for pipes with zero flow (real-time detection)
  cstpsPipes.forEach((pipe) => {
    if (pipe.parameters.flowRate === 0) {
      alarms.push({
        id: `ALM-ZERO-${pipe.pipeNumber}`,
        timestamp: new Date(), // Current time - active now
        deviceId: `Nivus-750-${pipe.pipeNumber}`,
        pipeNumber: pipe.pipeNumber,
        alarmType: 'ZERO_FLOW',
        description: 'Pipeline Flow Zero',
        severity: 'warning',
        status: 'active',
        value: 0,
        threshold: 0,
      })
    }
  })

  // Generate 50 historical alarms (excluding ZERO_FLOW for variety)
  const historicalAlarmTypes = alarmTypes.filter(a => a.type !== 'ZERO_FLOW')
  for (let i = 0; i < 50; i++) {
    const alarmDef = historicalAlarmTypes[Math.floor(Math.random() * historicalAlarmTypes.length)]
    const pipeNumber = Math.floor(Math.random() * 6) + 1
    const hoursAgo = Math.floor(Math.random() * 168) + 1 // 1 hour to 7 days ago
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

    // Determine status based on age
    let status: AlarmStatus = 'active'
    let acknowledgedAt: Date | undefined
    let clearedAt: Date | undefined

    if (hoursAgo > 24) {
      status = 'cleared'
      acknowledgedAt = new Date(timestamp.getTime() + Math.random() * 30 * 60 * 1000)
      clearedAt = new Date(acknowledgedAt.getTime() + Math.random() * 2 * 60 * 60 * 1000)
    } else if (hoursAgo > 2) {
      status = 'acknowledged'
      acknowledgedAt = new Date(timestamp.getTime() + Math.random() * 30 * 60 * 1000)
    }

    alarms.push({
      id: `ALM-${String(1000 + i).padStart(5, '0')}`,
      timestamp,
      deviceId: `Nivus-750-${pipeNumber}`,
      pipeNumber,
      alarmType: alarmDef.type,
      description: alarmDef.desc,
      severity: alarmDef.severity,
      status,
      value: alarmDef.type.includes('FLOW') ? Math.random() * 100 : undefined,
      threshold: alarmDef.type.includes('FLOW') ? 80 : undefined,
      acknowledgedAt,
      acknowledgedBy: acknowledgedAt ? 'Operator' : undefined,
      clearedAt,
    })
  }

  // Sort by timestamp, newest first
  return alarms.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export default function AlarmsPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [filterSeverity, setFilterSeverity] = useState<AlarmSeverity | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<AlarmStatus | 'all'>('all')
  const [filterDevice, setFilterDevice] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null)
  const [sortField, setSortField] = useState<'timestamp' | 'severity' | 'device'>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    setCurrentTime(new Date())
    setAlarms(generateAlarmHistory())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Filter and sort alarms
  const filteredAlarms = alarms
    .filter(alarm => {
      if (filterSeverity !== 'all' && alarm.severity !== filterSeverity) return false
      if (filterStatus !== 'all' && alarm.status !== filterStatus) return false
      if (filterDevice !== 'all' && alarm.deviceId !== filterDevice) return false
      if (searchQuery && !alarm.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !alarm.alarmType.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !alarm.id.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      let comparison = 0
      if (sortField === 'timestamp') {
        comparison = a.timestamp.getTime() - b.timestamp.getTime()
      } else if (sortField === 'severity') {
        const severityOrder = { critical: 3, warning: 2, info: 1 }
        comparison = severityOrder[a.severity] - severityOrder[b.severity]
      } else if (sortField === 'device') {
        comparison = a.deviceId.localeCompare(b.deviceId)
      }
      return sortDirection === 'desc' ? -comparison : comparison
    })

  // Stats
  const activeCount = alarms.filter(a => a.status === 'active').length
  const acknowledgedCount = alarms.filter(a => a.status === 'acknowledged').length
  const criticalCount = alarms.filter(a => a.severity === 'critical' && a.status === 'active').length
  const warningCount = alarms.filter(a => a.severity === 'warning' && a.status === 'active').length

  const handleAcknowledge = useCallback((alarmId: string) => {
    setAlarms(prev => prev.map(alarm =>
      alarm.id === alarmId
        ? { ...alarm, status: 'acknowledged' as AlarmStatus, acknowledgedAt: new Date(), acknowledgedBy: 'Operator' }
        : alarm
    ))
  }, [])

  const handleAcknowledgeAll = useCallback(() => {
    setAlarms(prev => prev.map(alarm =>
      alarm.status === 'active'
        ? { ...alarm, status: 'acknowledged' as AlarmStatus, acknowledgedAt: new Date(), acknowledgedBy: 'Operator' }
        : alarm
    ))
  }, [])

  const getSeverityColor = (severity: AlarmSeverity) => {
    switch (severity) {
      case 'critical': return { bg: '#FFEBEE', border: '#F44336', text: '#C62828', icon: '#F44336', glow: 'rgba(244, 67, 54, 0.4)' }
      case 'warning': return { bg: '#FFF8E1', border: '#FFC107', text: '#F57F17', icon: '#FFC107', glow: 'rgba(255, 193, 7, 0.4)' }
      case 'info': return { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0', icon: '#2196F3', glow: 'rgba(33, 150, 243, 0.4)' }
    }
  }

  const getStatusColor = (status: AlarmStatus) => {
    switch (status) {
      case 'active': return { bg: '#FFEBEE', text: '#C62828', dot: '#F44336' }
      case 'acknowledged': return { bg: '#FFF8E1', text: '#F57F17', dot: '#FFC107' }
      case 'cleared': return { bg: '#E8F5E9', text: '#2E7D32', dot: '#4CAF50' }
    }
  }

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata'
    })
  }

  const getTimeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-[#0a0f1a] text-white">
      {/* Enhanced SCADA Header */}
      <header className="border-b border-white/10 bg-gradient-to-r from-[#0D1B2A] via-[#1B263B] to-[#0D1B2A] shadow-xl">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <Link
              href="/cstps-pipeline"
              className="flex items-center space-x-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm text-white/90 transition-all hover:bg-white/10 border border-white/10 hover:border-white/20 backdrop-blur-sm"
            >
              <span className="material-icons text-lg">arrow_back</span>
              <span className="font-medium">Back to SCADA</span>
            </Link>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
                <span className="relative material-icons text-4xl text-[#F44336] drop-shadow-[0_0_15px_rgba(244,67,54,0.5)]">notifications_active</span>
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-br from-[#F44336] to-[#D32F2F] text-xs flex items-center justify-center font-bold shadow-lg border-2 border-[#0D1B2A] animate-pulse">
                    {activeCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-wide bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  ALARM MANAGEMENT
                </h1>
                <span className="text-xs text-white/50">CSTPS Water Supply SCADA System</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3 bg-white/5 rounded-lg px-4 py-2 border border-white/10">
              <span className="material-icons text-white/50 text-lg">schedule</span>
              <span className="font-mono text-sm text-white/80">
                {currentTime ? formatDateTime(currentTime) : '-- --- ----, --:--:--'}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-green-500/10 rounded-lg px-4 py-2 border border-green-500/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
              </span>
              <span className="text-green-400 text-sm font-semibold tracking-wide">ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Alarm Summary */}
          <div className="col-span-12 lg:col-span-2 space-y-4">
            {/* Active Alarms Card */}
            <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden shadow-xl">
              <div className="bg-gradient-to-r from-red-500/20 to-red-600/10 px-4 py-3 border-b border-red-500/20">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-red-400 text-lg">warning</span>
                  <span className="text-xs font-bold tracking-wider text-red-300 uppercase">
                    Active Alarms
                  </span>
                </div>
              </div>
              <div className="p-6 text-center">
                <div className={`text-6xl font-bold font-mono ${activeCount > 0 ? 'text-red-400' : 'text-green-400'}`}
                     style={{ textShadow: activeCount > 0 ? '0 0 30px rgba(248,113,113,0.5)' : '0 0 30px rgba(74,222,128,0.5)' }}>
                  {activeCount}
                </div>
                <div className="text-xs text-white/50 mt-2 uppercase tracking-wider">Requiring Attention</div>
                {activeCount > 0 && (
                  <div className="mt-4 h-1 w-full bg-red-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-400 animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Severity Breakdown Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden shadow-xl">
              <div className="bg-white/5 px-4 py-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-white/60 text-lg">analytics</span>
                  <span className="text-xs font-bold tracking-wider text-white/70 uppercase">
                    By Severity
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 hover:border-red-500/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <span className="material-icons text-red-400 text-lg">error</span>
                    </div>
                    <span className="text-sm text-white/80 font-medium">Critical</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-red-400">{criticalCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <span className="material-icons text-amber-400 text-lg">warning</span>
                    </div>
                    <span className="text-sm text-white/80 font-medium">Warning</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-amber-400">{warningCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <span className="material-icons text-blue-400 text-lg">info</span>
                    </div>
                    <span className="text-sm text-white/80 font-medium">Info</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-blue-400">
                    {alarms.filter(a => a.severity === 'info' && a.status === 'active').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Summary Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden shadow-xl">
              <div className="bg-white/5 px-4 py-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-white/60 text-lg">assessment</span>
                  <span className="text-xs font-bold tracking-wider text-white/70 uppercase">
                    By Status
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                    <span className="text-sm text-white/70">Active</span>
                  </div>
                  <span className="font-mono font-bold text-red-400">{activeCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div>
                    <span className="text-sm text-white/70">Acknowledged</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">{acknowledgedCount}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-sm text-white/70">Cleared</span>
                  </div>
                  <span className="font-mono font-bold text-green-400">
                    {alarms.filter(a => a.status === 'cleared').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden shadow-xl">
              <div className="bg-white/5 px-4 py-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-white/60 text-lg">bolt</span>
                  <span className="text-xs font-bold tracking-wider text-white/70 uppercase">
                    Quick Actions
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <button
                  onClick={handleAcknowledgeAll}
                  disabled={activeCount === 0}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25 disabled:shadow-none"
                >
                  <span className="material-icons text-lg">done_all</span>
                  <span>Acknowledge All</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white/5 text-white font-medium text-sm hover:bg-white/10 transition-all border border-white/10 hover:border-white/20">
                  <span className="material-icons text-lg">refresh</span>
                  <span>Refresh Data</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-white/5 text-white font-medium text-sm hover:bg-white/10 transition-all border border-white/10 hover:border-white/20">
                  <span className="material-icons text-lg">file_download</span>
                  <span>Export Log</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center - Alarm List */}
          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden shadow-xl">
              {/* Filter Bar */}
              <div className="bg-white/5 px-5 py-4 border-b border-white/10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                      <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-lg">search</span>
                      <input
                        type="text"
                        placeholder="Search alarms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 w-52 transition-all"
                      />
                    </div>

                    {/* Severity Filter */}
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value as AlarmSeverity | 'all')}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as AlarmStatus | 'all')}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="acknowledged">Acknowledged</option>
                      <option value="cleared">Cleared</option>
                    </select>

                    {/* Device Filter */}
                    <select
                      value={filterDevice}
                      onChange={(e) => setFilterDevice(e.target.value)}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <option value="all">All Devices</option>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={`Nivus-750-${n}`}>Nivus-750-{n}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm text-white/50 bg-white/5 px-3 py-1.5 rounded-lg">
                    <span className="text-white font-medium">{filteredAlarms.length}</span> of {alarms.length} alarms
                  </div>
                </div>
              </div>

              {/* Alarm Table Header */}
              <div className="grid grid-cols-14 gap-2 px-5 py-3 bg-[#0D1B2A]/80 text-xs font-bold text-white/50 uppercase tracking-wider border-b border-white/5">
                <div
                  className="col-span-2 flex items-center space-x-1 cursor-pointer hover:text-white/80 transition-colors"
                  onClick={() => { setSortField('timestamp'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Time</span>
                  {sortField === 'timestamp' && (
                    <span className="material-icons text-cyan-400 text-sm">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div className="col-span-1">ID</div>
                <div
                  className="col-span-2 flex items-center space-x-1 cursor-pointer hover:text-white/80 transition-colors"
                  onClick={() => { setSortField('device'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Device</span>
                  {sortField === 'device' && (
                    <span className="material-icons text-cyan-400 text-sm">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div
                  className="col-span-2 flex items-center space-x-1 cursor-pointer hover:text-white/80 transition-colors"
                  onClick={() => { setSortField('severity'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Severity</span>
                  {sortField === 'severity' && (
                    <span className="material-icons text-cyan-400 text-sm">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* Alarm List */}
              <div className="max-h-[calc(100vh-340px)] overflow-y-auto">
                {filteredAlarms.map((alarm) => {
                  const sevColor = getSeverityColor(alarm.severity)
                  const statColor = getStatusColor(alarm.status)
                  const isSelected = selectedAlarm?.id === alarm.id

                  return (
                    <div
                      key={alarm.id}
                      onClick={() => setSelectedAlarm(alarm)}
                      className={`grid grid-cols-14 gap-2 px-5 py-4 border-b border-white/5 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400'
                          : 'hover:bg-white/5 border-l-2 border-l-transparent'
                      } ${alarm.status === 'active' && alarm.severity === 'critical' ? 'bg-red-500/5' : ''}`}
                      style={{
                        animation: alarm.status === 'active' && alarm.severity === 'critical' ? 'pulse 2s infinite' : 'none'
                      }}
                    >
                      <div className="col-span-2">
                        <div className="font-mono text-xs text-white/70">{formatTime(alarm.timestamp)}</div>
                        <div className="text-[10px] text-white/40">{getTimeSince(alarm.timestamp)}</div>
                      </div>
                      <div className="col-span-1 font-mono text-xs text-cyan-400/80">
                        {alarm.id.replace('ALM-', '')}
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm font-semibold text-white/90">{alarm.deviceId}</div>
                        <div className="text-[10px] text-white/40">Pipe {alarm.pipeNumber}</div>
                      </div>
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: `${sevColor.bg}15`,
                            color: sevColor.text,
                            border: `1px solid ${sevColor.border}40`
                          }}
                        >
                          <span className="material-icons text-xs" style={{ color: sevColor.icon }}>
                            {alarm.severity === 'critical' ? 'error' : alarm.severity === 'warning' ? 'warning' : 'info'}
                          </span>
                          <span>{alarm.severity}</span>
                        </span>
                      </div>
                      <div className="col-span-3">
                        <div className="text-sm text-white/90 font-medium">{alarm.alarmType.replace('_', ' ')}</div>
                        <div className="text-[10px] text-white/50 mt-0.5">{alarm.description}</div>
                      </div>
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: `${statColor.bg}15`,
                            color: statColor.text,
                            border: `1px solid ${statColor.dot}30`
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: statColor.dot,
                              boxShadow: alarm.status === 'active' ? `0 0 6px ${statColor.dot}` : 'none'
                            }}
                          ></span>
                          <span>{alarm.status}</span>
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end space-x-2">
                        {alarm.status === 'active' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcknowledge(alarm.id) }}
                            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-sm"
                          >
                            <span className="material-icons text-xs">check</span>
                            <span>ACK</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedAlarm(alarm) }}
                          className="flex items-center p-2 rounded-lg bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-all border border-white/10"
                        >
                          <span className="material-icons text-sm">visibility</span>
                        </button>
                      </div>
                    </div>
                  )
                })}

                {filteredAlarms.length === 0 && (
                  <div className="text-center py-16 text-white/30">
                    <span className="material-icons text-6xl mb-4 opacity-50">inbox</span>
                    <p className="text-lg">No alarms match your filters</p>
                    <p className="text-sm mt-2 text-white/20">Try adjusting your search criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Alarm Details */}
          <div className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] overflow-hidden shadow-xl sticky top-6">
              <div className="bg-white/5 px-5 py-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-white/60 text-lg">info</span>
                  <span className="text-sm font-bold tracking-wider text-white/80 uppercase">
                    Alarm Details
                  </span>
                </div>
              </div>
              {selectedAlarm ? (
                <div className="p-5 space-y-5">
                  {/* Alarm Header */}
                  <div className="text-center pb-5 border-b border-white/10">
                    <div
                      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                      style={{
                        backgroundColor: `${getSeverityColor(selectedAlarm.severity).bg}20`,
                        boxShadow: `0 0 30px ${getSeverityColor(selectedAlarm.severity).glow}`
                      }}
                    >
                      <span
                        className="material-icons text-4xl"
                        style={{ color: getSeverityColor(selectedAlarm.severity).icon }}
                      >
                        {selectedAlarm.severity === 'critical' ? 'error' : selectedAlarm.severity === 'warning' ? 'warning' : 'info'}
                      </span>
                    </div>
                    <div className="text-xl font-bold text-white">{selectedAlarm.alarmType.replace('_', ' ')}</div>
                    <div className="text-sm text-white/50 mt-1">{selectedAlarm.description}</div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-sm text-white/50">Alarm ID</span>
                      <span className="font-mono text-sm text-cyan-400">{selectedAlarm.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-sm text-white/50">Device</span>
                      <span className="text-sm font-bold text-white">{selectedAlarm.deviceId}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-sm text-white/50">Pipe</span>
                      <span className="text-sm text-white">Pipe {selectedAlarm.pipeNumber}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-sm text-white/50">Severity</span>
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase"
                        style={{
                          backgroundColor: `${getSeverityColor(selectedAlarm.severity).bg}20`,
                          color: getSeverityColor(selectedAlarm.severity).text
                        }}
                      >
                        {selectedAlarm.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                      <span className="text-sm text-white/50">Status</span>
                      <span
                        className="px-3 py-1 rounded-lg text-xs font-bold uppercase"
                        style={{
                          backgroundColor: `${getStatusColor(selectedAlarm.status).bg}20`,
                          color: getStatusColor(selectedAlarm.status).text
                        }}
                      >
                        {selectedAlarm.status}
                      </span>
                    </div>
                    {selectedAlarm.value !== undefined && (
                      <>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-sm text-white/50">Value</span>
                          <span className="font-mono text-sm text-white">{selectedAlarm.value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 rounded-xl bg-white/5">
                          <span className="text-sm text-white/50">Threshold</span>
                          <span className="font-mono text-sm text-white">{selectedAlarm.threshold}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="pt-5 border-t border-white/10">
                    <div className="text-xs font-bold text-white/50 uppercase tracking-wider mb-4">Event Timeline</div>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-white/20 to-transparent"></div>
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium">Alarm Triggered</div>
                          <div className="text-xs text-white/40 font-mono mt-1">{formatDateTime(selectedAlarm.timestamp)}</div>
                        </div>
                      </div>
                      {selectedAlarm.acknowledgedAt && (
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-white/20 to-transparent"></div>
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">Acknowledged</div>
                            <div className="text-xs text-white/40">by {selectedAlarm.acknowledgedBy}</div>
                            <div className="text-xs text-white/40 font-mono mt-1">{formatDateTime(selectedAlarm.acknowledgedAt)}</div>
                          </div>
                        </div>
                      )}
                      {selectedAlarm.clearedAt && (
                        <div className="flex items-start space-x-4">
                          <div>
                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                          </div>
                          <div>
                            <div className="text-sm text-white font-medium">Alarm Cleared</div>
                            <div className="text-xs text-white/40 font-mono mt-1">{formatDateTime(selectedAlarm.clearedAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-5 border-t border-white/10 space-y-3">
                    {selectedAlarm.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledge(selectedAlarm.id)}
                        className="w-full flex items-center justify-center space-x-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/25"
                      >
                        <span className="material-icons">check_circle</span>
                        <span>Acknowledge Alarm</span>
                      </button>
                    )}

                    <Link
                      href={`/cstps-pipeline/pipe-${selectedAlarm.pipeNumber}`}
                      className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-all border border-white/10 hover:border-white/20"
                    >
                      <span className="material-icons text-lg">open_in_new</span>
                      <span>View Device</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-white/30">
                  <span className="material-icons text-6xl mb-4 opacity-50">touch_app</span>
                  <p className="text-lg">Select an alarm</p>
                  <p className="text-sm mt-2 text-white/20">Click on any alarm to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-gradient-to-r from-[#0D1B2A] via-[#1B263B] to-[#0D1B2A] px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8 font-mono text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-white/40">ALARM SERVER:</span>
              <span className="text-green-400 flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1.5 shadow-[0_0_6px_rgba(74,222,128,0.6)]"></span>
                CONNECTED
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/40">LAST UPDATE:</span>
              <span className="text-cyan-400">{currentTime ? formatTime(currentTime) : '--:--:--'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/40">ACTIVE ALARMS:</span>
              <span className={`font-bold ${activeCount > 0 ? 'text-red-400' : 'text-green-400'}`}>{activeCount}</span>
            </div>
          </div>
          <div className="text-xs text-white/30">
            FluxIO SCADA v3.0 | CSTPS Water Supply | January 22, 2026
          </div>
        </div>
      </footer>

      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  )
}
