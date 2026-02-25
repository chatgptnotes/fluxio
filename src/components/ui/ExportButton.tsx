'use client'

import { useState } from 'react'

interface FlowDataRow {
  device_id: string
  flow_rate: number | null
  totalizer: number | null
  temperature: number | null
  battery_level: number | null
  signal_strength: number | null
  created_at: string
}

interface ExportButtonProps {
  data: FlowDataRow[]
  filename?: string
  className?: string
}

export function ExportButton({
  data,
  filename = 'flow_data_export',
  className = '',
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = () => {
    if (!data || data.length === 0) return
    setExporting(true)

    try {
      const headers = [
        'device_id',
        'flow_rate',
        'totalizer',
        'temperature',
        'battery_level',
        'signal_strength',
        'created_at',
      ]

      const rows = data.map((row) =>
        [
          row.device_id,
          row.flow_rate ?? '',
          row.totalizer ?? '',
          row.temperature ?? '',
          row.battery_level ?? '',
          row.signal_strength ?? '',
          row.created_at,
        ].join(',')
      )

      const csv = [headers.join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting || !data || data.length === 0}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span className="material-icons" style={{ fontSize: '16px' }}>
        {exporting ? 'hourglass_empty' : 'download'}
      </span>
      {exporting ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}
