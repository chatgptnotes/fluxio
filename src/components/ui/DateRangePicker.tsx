'use client'

import { useState } from 'react'

interface DateRangePickerProps {
  onApply: (startDate: string, endDate: string) => void
  className?: string
}

export function DateRangePicker({ onApply, className = '' }: DateRangePickerProps) {
  const now = new Date()
  const defaultStart = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const [startDate, setStartDate] = useState(
    defaultStart.toISOString().slice(0, 16)
  )
  const [endDate, setEndDate] = useState(
    now.toISOString().slice(0, 16)
  )

  const handleApply = () => {
    onApply(new Date(startDate).toISOString(), new Date(endDate).toISOString())
  }

  return (
    <div className={`flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm border border-gray-200 ${className}`}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">Start Date</label>
        <input
          type="datetime-local"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500">End Date</label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      <button
        onClick={handleApply}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
      >
        <span className="material-icons" style={{ fontSize: '16px' }}>filter_alt</span>
        Apply
      </button>
    </div>
  )
}
