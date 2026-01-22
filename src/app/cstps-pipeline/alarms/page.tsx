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
      case 'critical': return { bg: '#FFEBEE', border: '#F44336', text: '#C62828', icon: '#F44336' }
      case 'warning': return { bg: '#FFF8E1', border: '#FFC107', text: '#F57F17', icon: '#FFC107' }
      case 'info': return { bg: '#E3F2FD', border: '#2196F3', text: '#1565C0', icon: '#2196F3' }
    }
  }

  const getStatusColor = (status: AlarmStatus) => {
    switch (status) {
      case 'active': return { bg: '#FFEBEE', text: '#C62828' }
      case 'acknowledged': return { bg: '#FFF8E1', text: '#F57F17' }
      case 'cleared': return { bg: '#E8F5E9', text: '#2E7D32' }
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

  return (
    <div className="min-h-screen bg-[#1a1a2e] text-white">
      {/* SCADA Header */}
      <header className="border-b-2 border-[#F44336] bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#1a1a2e]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Link
              href="/cstps-pipeline"
              className="flex items-center space-x-2 rounded bg-white/10 px-4 py-2 text-sm text-white transition-all hover:bg-white/20 border border-white/20"
            >
              <span className="material-icons text-sm">arrow_back</span>
              <span className="font-medium">Back to SCADA</span>
            </Link>
            <div className="h-6 w-px bg-white/30"></div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <span className="material-icons text-3xl text-[#F44336]">notifications_active</span>
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#F44336] text-xs flex items-center justify-center font-bold animate-pulse">
                    {activeCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide">ALARM MANAGEMENT</h1>
                <span className="text-xs text-white/60">CSTPS Water Supply SCADA</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-white/80">
              <span className="material-icons text-sm">schedule</span>
              <span className="font-mono text-sm">
                {currentTime ? formatDateTime(currentTime) : '-- --- ----, --:--:--'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-green-400 text-sm font-medium">SYSTEM ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - Alarm Summary */}
          <div className="col-span-2 space-y-4">
            {/* Active Alarms Summary */}
            <div className="rounded-lg border border-[#F44336]/50 bg-[#16213e]">
              <div className="border-b border-[#F44336]/30 bg-[#F44336]/10 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-[#F44336]">
                  ACTIVE ALARMS
                </span>
              </div>
              <div className="p-4 text-center">
                <div className={`text-5xl font-bold font-mono ${activeCount > 0 ? 'text-[#F44336] animate-pulse' : 'text-green-400'}`}>
                  {activeCount}
                </div>
                <div className="text-xs text-white/60 mt-1">Requiring Attention</div>
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="rounded-lg border border-white/10 bg-[#16213e]">
              <div className="border-b border-white/10 bg-white/5 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-white/80">
                  BY SEVERITY
                </span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#FFEBEE]/10">
                  <div className="flex items-center space-x-2">
                    <span className="material-icons text-[#F44336] text-sm">error</span>
                    <span className="text-xs text-white/80">Critical</span>
                  </div>
                  <span className="font-mono font-bold text-[#F44336]">{criticalCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#FFF8E1]/10">
                  <div className="flex items-center space-x-2">
                    <span className="material-icons text-[#FFC107] text-sm">warning</span>
                    <span className="text-xs text-white/80">Warning</span>
                  </div>
                  <span className="font-mono font-bold text-[#FFC107]">{warningCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#E3F2FD]/10">
                  <div className="flex items-center space-x-2">
                    <span className="material-icons text-[#2196F3] text-sm">info</span>
                    <span className="text-xs text-white/80">Info</span>
                  </div>
                  <span className="font-mono font-bold text-[#2196F3]">
                    {alarms.filter(a => a.severity === 'info' && a.status === 'active').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Summary */}
            <div className="rounded-lg border border-white/10 bg-[#16213e]">
              <div className="border-b border-white/10 bg-white/5 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-white/80">
                  BY STATUS
                </span>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-[#F44336]/10">
                  <span className="text-xs text-white/80">Active</span>
                  <span className="font-mono font-bold text-[#F44336]">{activeCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[#FFC107]/10">
                  <span className="text-xs text-white/80">Acknowledged</span>
                  <span className="font-mono font-bold text-[#FFC107]">{acknowledgedCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-green-500/10">
                  <span className="text-xs text-white/80">Cleared</span>
                  <span className="font-mono font-bold text-green-400">
                    {alarms.filter(a => a.status === 'cleared').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-white/10 bg-[#16213e]">
              <div className="border-b border-white/10 bg-white/5 px-3 py-2">
                <span className="text-xs font-bold tracking-wider text-white/80">
                  QUICK ACTIONS
                </span>
              </div>
              <div className="p-3 space-y-2">
                <button
                  onClick={handleAcknowledgeAll}
                  disabled={activeCount === 0}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded bg-[#FFC107] text-[#1a1a2e] font-bold text-xs hover:bg-[#FFD54F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="material-icons text-sm">done_all</span>
                  <span>Acknowledge All</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded bg-white/10 text-white font-medium text-xs hover:bg-white/20 transition-colors">
                  <span className="material-icons text-sm">refresh</span>
                  <span>Refresh</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded bg-white/10 text-white font-medium text-xs hover:bg-white/20 transition-colors">
                  <span className="material-icons text-sm">file_download</span>
                  <span>Export Log</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center - Alarm List */}
          <div className="col-span-7">
            <div className="rounded-lg border border-white/10 bg-[#16213e]">
              {/* Filter Bar */}
              <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Search */}
                    <div className="relative">
                      <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">search</span>
                      <input
                        type="text"
                        placeholder="Search alarms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00BCD4] w-48"
                      />
                    </div>

                    {/* Severity Filter */}
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value as AlarmSeverity | 'all')}
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:border-[#00BCD4]"
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
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:border-[#00BCD4]"
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
                      className="px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white focus:outline-none focus:border-[#00BCD4]"
                    >
                      <option value="all">All Devices</option>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={`Nivus-750-${n}`}>Nivus-750-{n}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-white/60">
                    Showing {filteredAlarms.length} of {alarms.length} alarms
                  </div>
                </div>
              </div>

              {/* Alarm Table Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#0D1B2A] text-xs font-bold text-white/60 uppercase tracking-wider">
                <div
                  className="col-span-2 flex items-center space-x-1 cursor-pointer hover:text-white"
                  onClick={() => { setSortField('timestamp'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Timestamp</span>
                  {sortField === 'timestamp' && (
                    <span className="material-icons text-xs">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div className="col-span-1">Alarm ID</div>
                <div
                  className="col-span-2 flex items-center space-x-1 cursor-pointer hover:text-white"
                  onClick={() => { setSortField('device'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Device</span>
                  {sortField === 'device' && (
                    <span className="material-icons text-xs">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div
                  className="col-span-1 flex items-center space-x-1 cursor-pointer hover:text-white"
                  onClick={() => { setSortField('severity'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Severity</span>
                  {sortField === 'severity' && (
                    <span className="material-icons text-xs">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div className="col-span-3">Description</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Alarm List */}
              <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
                {filteredAlarms.map((alarm) => {
                  const sevColor = getSeverityColor(alarm.severity)
                  const statColor = getStatusColor(alarm.status)
                  const isSelected = selectedAlarm?.id === alarm.id

                  return (
                    <div
                      key={alarm.id}
                      onClick={() => setSelectedAlarm(alarm)}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#00BCD4]/20' : 'hover:bg-white/5'
                      } ${alarm.status === 'active' && alarm.severity === 'critical' ? 'animate-pulse' : ''}`}
                    >
                      <div className="col-span-2 font-mono text-xs text-white/80">
                        {formatDateTime(alarm.timestamp)}
                      </div>
                      <div className="col-span-1 font-mono text-xs text-[#00BCD4]">
                        {alarm.id}
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs font-bold text-white">{alarm.deviceId}</div>
                        <div className="text-[10px] text-white/50">Pipe {alarm.pipeNumber}</div>
                      </div>
                      <div className="col-span-1">
                        <span
                          className="inline-flex items-center space-x-1 px-2 py-1 rounded text-[10px] font-bold uppercase"
                          style={{ backgroundColor: sevColor.bg, color: sevColor.text }}
                        >
                          <span className="material-icons text-xs" style={{ color: sevColor.icon }}>
                            {alarm.severity === 'critical' ? 'error' : alarm.severity === 'warning' ? 'warning' : 'info'}
                          </span>
                          <span>{alarm.severity}</span>
                        </span>
                      </div>
                      <div className="col-span-3">
                        <div className="text-xs text-white font-medium">{alarm.alarmType}</div>
                        <div className="text-[10px] text-white/60">{alarm.description}</div>
                        {alarm.value !== undefined && (
                          <div className="text-[10px] text-white/40 font-mono">
                            Value: {alarm.value.toFixed(1)} (Threshold: {alarm.threshold})
                          </div>
                        )}
                      </div>
                      <div className="col-span-1">
                        <span
                          className="inline-block px-2 py-1 rounded text-[10px] font-bold uppercase"
                          style={{ backgroundColor: statColor.bg, color: statColor.text }}
                        >
                          {alarm.status}
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center space-x-2">
                        {alarm.status === 'active' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcknowledge(alarm.id) }}
                            className="flex items-center space-x-1 px-2 py-1 rounded bg-[#FFC107] text-[#1a1a2e] text-[10px] font-bold hover:bg-[#FFD54F] transition-colors"
                          >
                            <span className="material-icons text-xs">check</span>
                            <span>ACK</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedAlarm(alarm) }}
                          className="flex items-center space-x-1 px-2 py-1 rounded bg-white/10 text-white text-[10px] hover:bg-white/20 transition-colors"
                        >
                          <span className="material-icons text-xs">visibility</span>
                        </button>
                      </div>
                    </div>
                  )
                })}

                {filteredAlarms.length === 0 && (
                  <div className="text-center py-12 text-white/40">
                    <span className="material-icons text-4xl mb-2">inbox</span>
                    <p>No alarms match your filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Alarm Details */}
          <div className="col-span-3">
            <div className="rounded-lg border border-white/10 bg-[#16213e] sticky top-4">
              <div className="border-b border-white/10 bg-white/5 px-4 py-3">
                <span className="text-xs font-bold tracking-wider text-white/80">
                  ALARM DETAILS
                </span>
              </div>
              {selectedAlarm ? (
                <div className="p-4 space-y-4">
                  {/* Alarm Header */}
                  <div className="text-center pb-4 border-b border-white/10">
                    <span
                      className="material-icons text-5xl mb-2"
                      style={{ color: getSeverityColor(selectedAlarm.severity).icon }}
                    >
                      {selectedAlarm.severity === 'critical' ? 'error' : selectedAlarm.severity === 'warning' ? 'warning' : 'info'}
                    </span>
                    <div className="text-lg font-bold text-white">{selectedAlarm.alarmType}</div>
                    <div className="text-sm text-white/60">{selectedAlarm.description}</div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/60">Alarm ID</span>
                      <span className="font-mono text-[#00BCD4]">{selectedAlarm.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Device</span>
                      <span className="font-bold text-white">{selectedAlarm.deviceId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Pipe</span>
                      <span className="text-white">Pipe {selectedAlarm.pipeNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Severity</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                        style={{ backgroundColor: getSeverityColor(selectedAlarm.severity).bg, color: getSeverityColor(selectedAlarm.severity).text }}
                      >
                        {selectedAlarm.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Status</span>
                      <span
                        className="px-2 py-0.5 rounded text-xs font-bold uppercase"
                        style={{ backgroundColor: getStatusColor(selectedAlarm.status).bg, color: getStatusColor(selectedAlarm.status).text }}
                      >
                        {selectedAlarm.status}
                      </span>
                    </div>
                    {selectedAlarm.value !== undefined && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-white/60">Value</span>
                          <span className="font-mono text-white">{selectedAlarm.value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Threshold</span>
                          <span className="font-mono text-white">{selectedAlarm.threshold}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3">Timeline</div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 rounded-full bg-[#F44336] mt-1.5"></div>
                        <div>
                          <div className="text-xs text-white">Alarm Triggered</div>
                          <div className="text-[10px] text-white/50 font-mono">{formatDateTime(selectedAlarm.timestamp)}</div>
                        </div>
                      </div>
                      {selectedAlarm.acknowledgedAt && (
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-[#FFC107] mt-1.5"></div>
                          <div>
                            <div className="text-xs text-white">Acknowledged by {selectedAlarm.acknowledgedBy}</div>
                            <div className="text-[10px] text-white/50 font-mono">{formatDateTime(selectedAlarm.acknowledgedAt)}</div>
                          </div>
                        </div>
                      )}
                      {selectedAlarm.clearedAt && (
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5"></div>
                          <div>
                            <div className="text-xs text-white">Alarm Cleared</div>
                            <div className="text-[10px] text-white/50 font-mono">{formatDateTime(selectedAlarm.clearedAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedAlarm.status === 'active' && (
                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={() => handleAcknowledge(selectedAlarm.id)}
                        className="w-full flex items-center justify-center space-x-2 py-3 rounded bg-[#FFC107] text-[#1a1a2e] font-bold hover:bg-[#FFD54F] transition-colors"
                      >
                        <span className="material-icons">check_circle</span>
                        <span>Acknowledge Alarm</span>
                      </button>
                    </div>
                  )}

                  {/* Link to Device */}
                  <div className="pt-4 border-t border-white/10">
                    <Link
                      href={`/cstps-pipeline/pipe-${selectedAlarm.pipeNumber}`}
                      className="w-full flex items-center justify-center space-x-2 py-2 rounded bg-white/10 text-white font-medium hover:bg-white/20 transition-colors text-sm"
                    >
                      <span className="material-icons text-sm">open_in_new</span>
                      <span>View Device Details</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-white/40">
                  <span className="material-icons text-4xl mb-2">touch_app</span>
                  <p>Select an alarm to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#0D1B2A] px-4 py-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6 font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-white/50">ALARM SERVER:</span>
              <span className="text-green-400 flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 mr-1 animate-pulse"></span>
                CONNECTED
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/50">LAST UPDATE:</span>
              <span className="text-[#00BCD4]">{currentTime ? formatTime(currentTime) : '--:--:--'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-white/50">ACTIVE:</span>
              <span className={activeCount > 0 ? 'text-[#F44336]' : 'text-green-400'}>{activeCount}</span>
            </div>
          </div>
          <div className="text-white/40">
            FluxIO SCADA Alarm Management v1.0 | CSTPS Water Supply
          </div>
        </div>
      </footer>
    </div>
  )
}
