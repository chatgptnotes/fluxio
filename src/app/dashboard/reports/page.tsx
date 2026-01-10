'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { cstpsPipes } from '@/lib/cstps-data'

interface ReportHistory {
  id: string
  reportType: string
  dateRange: { start: string; end: string; label: string }
  generatedAt: string
  downloadUrl: string
  source: 'session' | 'stored'
  fileSize?: number
  summary?: {
    totalFlowVolume?: number
    activeDevices?: number
    alertsTriggered?: number
  }
}

interface StoredReport {
  id: string
  report_type: string
  report_date: string
  file_path: string
  file_size: number | null
  download_url: string | null
  generated_at: string
  summary: {
    totalFlowVolume?: number
    activeDevices?: number
    alertsTriggered?: number
  } | null
}

export default function ReportsPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'custom'>('daily')
  const [selectedPreset, setSelectedPreset] = useState('yesterday')
  const [selectedDevice, setSelectedDevice] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportHistory, setReportHistory] = useState<ReportHistory[]>([])
  const [storedReports, setStoredReports] = useState<ReportHistory[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch stored reports from server
  const fetchStoredReports = useCallback(async () => {
    try {
      setIsLoadingHistory(true)
      const response = await fetch('/api/reports/history?limit=10')
      const result = await response.json()

      if (result.success && result.data) {
        const stored: ReportHistory[] = result.data.map((report: StoredReport) => ({
          id: report.id,
          reportType: report.report_type,
          dateRange: {
            start: report.report_date,
            end: report.report_date,
            label: new Date(report.report_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            }),
          },
          generatedAt: report.generated_at,
          downloadUrl: report.download_url || '',
          source: 'stored' as const,
          fileSize: report.file_size || undefined,
          summary: report.summary || undefined,
        }))
        setStoredReports(stored)
      }
    } catch (err) {
      console.error('Failed to fetch report history:', err)
    } finally {
      setIsLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    // Set initial time on client only to avoid hydration mismatch
    setCurrentTime(new Date())
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)

    // Fetch stored reports
    fetchStoredReports()

    return () => clearInterval(timer)
  }, [fetchStoredReports])

  const presets = [
    { id: 'today', label: 'Today', type: 'daily' as const },
    { id: 'yesterday', label: 'Yesterday', type: 'daily' as const },
    { id: 'thisWeek', label: 'This Week', type: 'daily' as const },
    { id: 'lastWeek', label: 'Last Week', type: 'daily' as const },
    { id: 'thisMonth', label: 'This Month', type: 'monthly' as const },
    { id: 'lastMonth', label: 'Last Month', type: 'monthly' as const },
  ]

  // Auto-sync report type based on preset selection
  const handlePresetChange = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = presets.find(p => p.id === presetId)
    if (preset) {
      setReportType(preset.type)
    }
  }

  // Auto-sync preset based on report type selection
  const handleReportTypeChange = (type: 'daily' | 'monthly' | 'custom') => {
    setReportType(type)
    if (type === 'daily' && (selectedPreset === 'thisMonth' || selectedPreset === 'lastMonth')) {
      setSelectedPreset('yesterday')
    } else if (type === 'monthly' && (selectedPreset === 'today' || selectedPreset === 'yesterday' || selectedPreset === 'thisWeek' || selectedPreset === 'lastWeek')) {
      setSelectedPreset('lastMonth')
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const payload: Record<string, string> = {
        report_type: reportType,
        device_id: selectedDevice,
      }

      if (reportType === 'custom' && customStartDate && customEndDate) {
        payload.start_date = customStartDate
        payload.end_date = customEndDate
      } else {
        payload.preset = selectedPreset
      }

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        // Add to history
        setReportHistory((prev) => [
          {
            id: result.data.report_id,
            reportType: result.data.report_type,
            dateRange: result.data.date_range,
            generatedAt: result.data.generated_at,
            downloadUrl: result.data.download_url,
            source: 'session' as const,
          },
          ...prev.slice(0, 9), // Keep last 10 reports
        ])

        // Trigger download
        const link = document.createElement('a')
        link.href = result.data.download_url
        link.download = `FluxIO-${reportType}-Report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        setError(result.error || 'Failed to generate report')
      }
    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Report generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = (report: ReportHistory) => {
    const link = document.createElement('a')
    link.href = report.downloadUrl
    link.download = `FluxIO-${report.reportType}-Report-${report.dateRange.start.split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* SCADA Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-6">
            <Link href="/cstps-pipeline" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <span className="material-icons text-cyan-400">arrow_back</span>
              <span className="text-slate-400">Back to Pipeline</span>
            </Link>
            <div className="flex items-center space-x-2">
              <span className="material-icons text-cyan-400 text-2xl">description</span>
              <h1 className="text-xl font-bold tracking-wide">Report Generation</h1>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-slate-400">
              <span className="material-icons text-sm">schedule</span>
              <span className="font-mono text-sm">
                {currentTime ? `${currentTime.toLocaleDateString('en-GB', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })} ${currentTime.toLocaleTimeString('en-GB')}` : '-- --- --, ---- --:--:--'}
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

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Report Configuration */}
          <div className="col-span-3 space-y-4">
            {/* Report Type Selection */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                <span className="material-icons text-cyan-400 mr-2 text-sm">category</span>
                Report Type
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'daily', label: 'Daily Summary', icon: 'today' },
                  { id: 'monthly', label: 'Monthly Summary', icon: 'calendar_month' },
                  { id: 'custom', label: 'Custom Range', icon: 'date_range' },
                ].map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all ${
                      reportType === type.id
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-slate-700/50 border border-transparent hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportType"
                      value={type.id}
                      checked={reportType === type.id}
                      onChange={(e) => handleReportTypeChange(e.target.value as 'daily' | 'monthly' | 'custom')}
                      className="sr-only"
                    />
                    <span className={`material-icons ${reportType === type.id ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {type.icon}
                    </span>
                    <span className={reportType === type.id ? 'text-white' : 'text-slate-300'}>
                      {type.label}
                    </span>
                    {reportType === type.id && (
                      <span className="material-icons text-cyan-400 ml-auto text-sm">check_circle</span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Device Filter */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center">
                <span className="material-icons text-cyan-400 mr-2 text-sm">sensors</span>
                Device Filter
              </h3>
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="all">All Pipes (6 Devices)</option>
                {cstpsPipes.map((pipe) => (
                  <option key={pipe.id} value={pipe.id}>
                    Pipe {pipe.pipeNumber} - {pipe.deviceName.split(' - ')[1]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Center Panel - Date Range Configuration */}
          <div className="col-span-6 space-y-4">
            {/* Date Range Selector */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                <span className="material-icons text-cyan-400 mr-2 text-sm">event</span>
                Date Range
              </h3>

              {reportType !== 'custom' ? (
                <div className="grid grid-cols-2 gap-3">
                  {presets
                    .filter((preset) => preset.type === reportType)
                    .map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      className={`p-3 rounded-lg font-medium transition-all ${
                        selectedPreset === preset.id
                          ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500">
                    Select a custom date range for your report.
                  </p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center space-x-2">
                  <span className="material-icons text-red-400">error</span>
                  <span className="text-red-300">{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerateReport}
                disabled={isGenerating || (reportType === 'custom' && (!customStartDate || !customEndDate))}
                className={`w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center space-x-3 transition-all ${
                  isGenerating || (reportType === 'custom' && (!customStartDate || !customEndDate))
                    ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                }`}
              >
                {isGenerating ? (
                  <>
                    <span className="material-icons animate-spin">refresh</span>
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons">picture_as_pdf</span>
                    <span>Generate PDF Report</span>
                  </>
                )}
              </button>

              <p className="mt-4 text-sm text-slate-500 text-center">
                Report includes: Flow data, alerts, device health, and statistics
              </p>
            </div>

            {/* Report Preview Info */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                <span className="material-icons text-cyan-400 mr-2 text-sm">info</span>
                Report Contents
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: 'analytics', label: 'Executive Summary', desc: 'Key metrics overview' },
                  { icon: 'table_chart', label: 'Flow Data Table', desc: 'Per-pipe statistics' },
                  { icon: 'bar_chart', label: 'Hourly Distribution', desc: 'Flow trends chart' },
                  { icon: 'warning', label: 'Alerts Summary', desc: 'System notifications' },
                  { icon: 'battery_charging_full', label: 'Device Health', desc: 'Battery & signal status' },
                  { icon: 'timeline', label: 'Operating Hours', desc: 'Uptime tracking' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg"
                  >
                    <span className="material-icons text-cyan-400">{item.icon}</span>
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Report History */}
          <div className="col-span-3 space-y-4">
            {/* Session Reports (just generated) */}
            {reportHistory.length > 0 && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                  <span className="material-icons text-green-400 mr-2 text-sm">check_circle</span>
                  Just Generated
                </h3>
                <div className="space-y-3">
                  {reportHistory.slice(0, 3).map((report) => (
                    <div
                      key={report.id}
                      className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-green-400 uppercase">
                          {report.reportType} Report
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(report.generatedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">
                        {report.dateRange.label}
                      </p>
                      <button
                        onClick={() => handleDownload(report)}
                        className="w-full flex items-center justify-center space-x-2 py-2 bg-green-600 hover:bg-green-500 rounded transition-colors text-sm"
                      >
                        <span className="material-icons text-sm">download</span>
                        <span>Download PDF</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stored Reports (from database) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center">
                <span className="material-icons text-cyan-400 mr-2 text-sm">cloud_done</span>
                Stored Reports
                <span className="ml-2 text-xs text-slate-500">(Auto-generated daily)</span>
              </h3>

              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <span className="material-icons animate-spin text-cyan-400 text-3xl mb-2">refresh</span>
                  <p className="text-slate-500 text-sm">Loading report history...</p>
                </div>
              ) : storedReports.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-icons text-slate-600 text-4xl mb-2">cloud_off</span>
                  <p className="text-slate-500 text-sm">No stored reports yet</p>
                  <p className="text-xs text-slate-600 mt-1">Daily reports are auto-generated at midnight</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {storedReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-slate-700/50 border border-slate-600 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-cyan-400 uppercase flex items-center">
                          <span className="material-icons text-xs mr-1">schedule</span>
                          {report.reportType}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(report.generatedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-1">
                        {report.dateRange.label}
                      </p>
                      {report.summary && (
                        <div className="flex items-center space-x-3 text-xs text-slate-400 mb-2">
                          <span>{report.summary.totalFlowVolume?.toLocaleString()} m3</span>
                          <span>{report.summary.activeDevices} devices</span>
                          {report.summary.alertsTriggered && report.summary.alertsTriggered > 0 && (
                            <span className="text-yellow-400">{report.summary.alertsTriggered} alerts</span>
                          )}
                        </div>
                      )}
                      {report.fileSize && (
                        <p className="text-xs text-slate-500 mb-2">
                          {(report.fileSize / 1024).toFixed(1)} KB
                        </p>
                      )}
                      {report.downloadUrl ? (
                        <a
                          href={report.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-600 hover:bg-slate-500 rounded transition-colors text-sm"
                        >
                          <span className="material-icons text-sm">download</span>
                          <span>Download PDF</span>
                        </a>
                      ) : (
                        <div className="w-full flex items-center justify-center space-x-2 py-2 bg-slate-700 text-slate-500 rounded text-sm">
                          <span className="material-icons text-sm">cloud_off</span>
                          <span>Not available</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-700 bg-slate-800/90 backdrop-blur-sm px-6 py-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>FluxIO SCADA - Report Generation Module</span>
          <span>Version 1.4 | January 2026 | github.com/chatgptnotes/fluxio</span>
        </div>
      </footer>
    </div>
  )
}
