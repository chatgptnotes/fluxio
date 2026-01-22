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
        timestamp: new Date(),
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

  // Generate 50 historical alarms
  const historicalAlarmTypes = alarmTypes.filter(a => a.type !== 'ZERO_FLOW')
  for (let i = 0; i < 50; i++) {
    const alarmDef = historicalAlarmTypes[Math.floor(Math.random() * historicalAlarmTypes.length)]
    const pipeNumber = Math.floor(Math.random() * 6) + 1
    const hoursAgo = Math.floor(Math.random() * 168) + 1
    const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000)

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
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="border-b-2 border-[#0288D1] bg-gradient-to-r from-[#1565C0] via-[#1976D2] to-[#1565C0] shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Link
              href="/cstps-pipeline"
              className="flex items-center space-x-2 rounded bg-white/20 px-4 py-2 text-sm text-white transition-all hover:bg-white/30 border border-white/30"
            >
              <span className="material-icons text-sm">arrow_back</span>
              <span className="font-medium">Back to SCADA</span>
            </Link>
            <div className="h-6 w-px bg-white/30"></div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <span className="material-icons text-3xl text-white">notifications_active</span>
                {activeCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-[#F44336] text-xs flex items-center justify-center font-bold text-white animate-pulse shadow-lg">
                    {activeCount}
                  </span>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wide text-white">ALARM MANAGEMENT</h1>
                <span className="text-xs text-white/70">CSTPS Water Supply SCADA System</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/20 rounded px-3 py-1.5 border border-white/30">
              <span className="material-icons text-white/80 text-sm">schedule</span>
              <span className="font-mono text-sm text-white">
                {currentTime ? formatDateTime(currentTime) : '-- --- ----, --:--:--'}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-green-500/20 rounded px-3 py-1.5 border border-green-400/50">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-green-300 text-sm font-semibold">ONLINE</span>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Left Panel - Alarm Summary */}
          <div className="col-span-12 lg:col-span-2 space-y-4">
            {/* Active Alarms Card */}
            <div className="rounded-lg border border-red-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-red-50 px-3 py-2 border-b border-red-200">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-red-500 text-lg">warning</span>
                  <span className="text-xs font-bold tracking-wider text-red-700 uppercase">
                    Active Alarms
                  </span>
                </div>
              </div>
              <div className="p-4 text-center">
                <div className={`text-5xl font-bold font-mono ${activeCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {activeCount}
                </div>
                <div className="text-xs text-gray-500 mt-2 uppercase tracking-wider">Requiring Attention</div>
                {activeCount > 0 && (
                  <div className="mt-3 h-1.5 w-full bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 animate-pulse rounded-full" style={{ width: '100%' }}></div>
                  </div>
                )}
              </div>
            </div>

            {/* Severity Breakdown Card */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-gray-500 text-lg">analytics</span>
                  <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                    By Severity
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50 border border-red-100 hover:border-red-200 transition-colors">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center">
                      <span className="material-icons text-red-500 text-base">error</span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Critical</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-red-500">{criticalCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50 border border-amber-100 hover:border-amber-200 transition-colors">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                      <span className="material-icons text-amber-500 text-base">warning</span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Warning</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-amber-500">{warningCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50 border border-blue-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="material-icons text-blue-500 text-base">info</span>
                    </div>
                    <span className="text-sm text-gray-700 font-medium">Info</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-blue-500">
                    {alarms.filter(a => a.severity === 'info' && a.status === 'active').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Summary Card */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-gray-500 text-lg">assessment</span>
                  <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                    By Status
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/50 border border-red-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Active</span>
                  </div>
                  <span className="font-mono font-bold text-red-500">{activeCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <span className="text-sm text-gray-600">Acknowledged</span>
                  </div>
                  <span className="font-mono font-bold text-amber-500">{acknowledgedCount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-green-50/50 border border-green-100">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Cleared</span>
                  </div>
                  <span className="font-mono font-bold text-green-500">
                    {alarms.filter(a => a.status === 'cleared').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-gray-500 text-lg">bolt</span>
                  <span className="text-xs font-bold tracking-wider text-gray-600 uppercase">
                    Quick Actions
                  </span>
                </div>
              </div>
              <div className="p-3 space-y-2">
                <button
                  onClick={handleAcknowledgeAll}
                  disabled={activeCount === 0}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <span className="material-icons text-base">done_all</span>
                  <span>Acknowledge All</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-all border border-gray-200">
                  <span className="material-icons text-base">refresh</span>
                  <span>Refresh Data</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition-all border border-gray-200">
                  <span className="material-icons text-base">file_download</span>
                  <span>Export Log</span>
                </button>
              </div>
            </div>
          </div>

          {/* Center - Alarm List */}
          <div className="col-span-12 lg:col-span-7">
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
              {/* Filter Bar */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative">
                      <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                      <input
                        type="text"
                        placeholder="Search alarms..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-48 transition-all"
                      />
                    </div>

                    {/* Severity Filter */}
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value as AlarmSeverity | 'all')}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-all"
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
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-all"
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
                      className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer hover:bg-gray-50 transition-all"
                    >
                      <option value="all">All Devices</option>
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={`Nivus-750-${n}`}>Nivus-750-{n}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <span className="text-gray-700 font-medium">{filteredAlarms.length}</span> of {alarms.length} alarms
                  </div>
                </div>
              </div>

              {/* Alarm Table Header */}
              <div className="grid grid-cols-14 gap-2 px-4 py-2.5 bg-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <div
                  className="col-span-2 flex items-center space-x-1 cursor-pointer hover:text-gray-700 transition-colors"
                  onClick={() => { setSortField('timestamp'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Time</span>
                  {sortField === 'timestamp' && (
                    <span className="material-icons text-blue-500 text-sm">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div className="col-span-1">ID</div>
                <div
                  className="col-span-2 flex items-center space-x-1 cursor-pointer hover:text-gray-700 transition-colors"
                  onClick={() => { setSortField('device'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Device</span>
                  {sortField === 'device' && (
                    <span className="material-icons text-blue-500 text-sm">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div
                  className="col-span-2 flex items-center space-x-1 cursor-pointer hover:text-gray-700 transition-colors"
                  onClick={() => { setSortField('severity'); setSortDirection(d => d === 'asc' ? 'desc' : 'asc') }}
                >
                  <span>Severity</span>
                  {sortField === 'severity' && (
                    <span className="material-icons text-blue-500 text-sm">{sortDirection === 'desc' ? 'arrow_drop_down' : 'arrow_drop_up'}</span>
                  )}
                </div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
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
                      className={`grid grid-cols-14 gap-2 px-4 py-3 border-b border-gray-100 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-l-2 border-l-blue-500'
                          : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                      } ${alarm.status === 'active' && alarm.severity === 'critical' ? 'bg-red-50/50' : ''}`}
                    >
                      <div className="col-span-2">
                        <div className="font-mono text-xs text-gray-700">{formatTime(alarm.timestamp)}</div>
                        <div className="text-[10px] text-gray-400">{getTimeSince(alarm.timestamp)}</div>
                      </div>
                      <div className="col-span-1 font-mono text-xs text-blue-600">
                        {alarm.id.replace('ALM-', '')}
                      </div>
                      <div className="col-span-2">
                        <div className="text-sm font-semibold text-gray-800">{alarm.deviceId}</div>
                        <div className="text-[10px] text-gray-400">Pipe {alarm.pipeNumber}</div>
                      </div>
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: sevColor.bg,
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
                        <div className="text-sm text-gray-800 font-medium">{alarm.alarmType.replace('_', ' ')}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{alarm.description}</div>
                      </div>
                      <div className="col-span-2">
                        <span
                          className="inline-flex items-center space-x-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase"
                          style={{
                            backgroundColor: statColor.bg,
                            color: statColor.text,
                            border: `1px solid ${statColor.dot}30`
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: statColor.dot }}
                          ></span>
                          <span>{alarm.status}</span>
                        </span>
                      </div>
                      <div className="col-span-2 flex items-center justify-end space-x-2">
                        {alarm.status === 'active' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleAcknowledge(alarm.id) }}
                            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-md bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 transition-all shadow-sm"
                          >
                            <span className="material-icons text-xs">check</span>
                            <span>ACK</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedAlarm(alarm) }}
                          className="flex items-center p-1.5 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all border border-gray-200"
                        >
                          <span className="material-icons text-sm">visibility</span>
                        </button>
                      </div>
                    </div>
                  )
                })}

                {filteredAlarms.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <span className="material-icons text-5xl mb-3 opacity-50">inbox</span>
                    <p className="text-lg text-gray-500">No alarms match your filters</p>
                    <p className="text-sm mt-1 text-gray-400">Try adjusting your search criteria</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Alarm Details */}
          <div className="col-span-12 lg:col-span-3">
            <div className="rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm sticky top-4">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="material-icons text-gray-500 text-lg">info</span>
                  <span className="text-sm font-bold tracking-wider text-gray-600 uppercase">
                    Alarm Details
                  </span>
                </div>
              </div>
              {selectedAlarm ? (
                <div className="p-4 space-y-4">
                  {/* Alarm Header */}
                  <div className="text-center pb-4 border-b border-gray-100">
                    <div
                      className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-3"
                      style={{ backgroundColor: getSeverityColor(selectedAlarm.severity).bg }}
                    >
                      <span
                        className="material-icons text-3xl"
                        style={{ color: getSeverityColor(selectedAlarm.severity).icon }}
                      >
                        {selectedAlarm.severity === 'critical' ? 'error' : selectedAlarm.severity === 'warning' ? 'warning' : 'info'}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">{selectedAlarm.alarmType.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-500 mt-1">{selectedAlarm.description}</div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-500">Alarm ID</span>
                      <span className="font-mono text-sm text-blue-600">{selectedAlarm.id}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-500">Device</span>
                      <span className="text-sm font-bold text-gray-800">{selectedAlarm.deviceId}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-500">Pipe</span>
                      <span className="text-sm text-gray-700">Pipe {selectedAlarm.pipeNumber}</span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-500">Severity</span>
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-bold uppercase"
                        style={{
                          backgroundColor: getSeverityColor(selectedAlarm.severity).bg,
                          color: getSeverityColor(selectedAlarm.severity).text
                        }}
                      >
                        {selectedAlarm.severity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50">
                      <span className="text-sm text-gray-500">Status</span>
                      <span
                        className="px-2.5 py-1 rounded-md text-xs font-bold uppercase"
                        style={{
                          backgroundColor: getStatusColor(selectedAlarm.status).bg,
                          color: getStatusColor(selectedAlarm.status).text
                        }}
                      >
                        {selectedAlarm.status}
                      </span>
                    </div>
                    {selectedAlarm.value !== undefined && (
                      <>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50">
                          <span className="text-sm text-gray-500">Value</span>
                          <span className="font-mono text-sm text-gray-700">{selectedAlarm.value.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-gray-50">
                          <span className="text-sm text-gray-500">Threshold</span>
                          <span className="font-mono text-sm text-gray-700">{selectedAlarm.threshold}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Timeline */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Event Timeline</div>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1"></div>
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-200"></div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-700 font-medium">Alarm Triggered</div>
                          <div className="text-xs text-gray-400 font-mono">{formatDateTime(selectedAlarm.timestamp)}</div>
                        </div>
                      </div>
                      {selectedAlarm.acknowledgedAt && (
                        <div className="flex items-start space-x-3">
                          <div className="relative">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1"></div>
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-200"></div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 font-medium">Acknowledged</div>
                            <div className="text-xs text-gray-400">by {selectedAlarm.acknowledgedBy}</div>
                            <div className="text-xs text-gray-400 font-mono">{formatDateTime(selectedAlarm.acknowledgedAt)}</div>
                          </div>
                        </div>
                      )}
                      {selectedAlarm.clearedAt && (
                        <div className="flex items-start space-x-3">
                          <div>
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1"></div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-700 font-medium">Alarm Cleared</div>
                            <div className="text-xs text-gray-400 font-mono">{formatDateTime(selectedAlarm.clearedAt)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-gray-100 space-y-2">
                    {selectedAlarm.status === 'active' && (
                      <button
                        onClick={() => handleAcknowledge(selectedAlarm.id)}
                        className="w-full flex items-center justify-center space-x-2 py-3 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all shadow-sm"
                      >
                        <span className="material-icons">check_circle</span>
                        <span>Acknowledge Alarm</span>
                      </button>
                    )}

                    <Link
                      href={`/cstps-pipeline/pipe-${selectedAlarm.pipeNumber}`}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-all border border-gray-200"
                    >
                      <span className="material-icons text-base">open_in_new</span>
                      <span>View Device</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <span className="material-icons text-5xl mb-3 opacity-50">touch_app</span>
                  <p className="text-lg text-gray-500">Select an alarm</p>
                  <p className="text-sm mt-1 text-gray-400">Click on any alarm to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Status Bar */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-4 py-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 font-mono text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">ALARM SERVER:</span>
              <span className="text-green-600 flex items-center">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                CONNECTED
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">LAST UPDATE:</span>
              <span className="text-blue-600">{currentTime ? formatTime(currentTime) : '--:--:--'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">ACTIVE ALARMS:</span>
              <span className={`font-bold ${activeCount > 0 ? 'text-red-500' : 'text-green-500'}`}>{activeCount}</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            FluxIO SCADA v3.1 | CSTPS Water Supply | January 22, 2026
          </div>
        </div>
      </footer>
    </div>
  )
}
