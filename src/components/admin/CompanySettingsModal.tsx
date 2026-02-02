'use client'

import { useState, useEffect } from 'react'

interface CompanySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  companyName: string
  onSave?: () => void
}

interface CompanySettings {
  dailyReportEnabled: boolean
  reportRecipients: 'operators' | 'admins' | 'all'
}

export default function CompanySettingsModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  onSave,
}: CompanySettingsModalProps) {
  const [settings, setSettings] = useState<CompanySettings>({
    dailyReportEnabled: false,
    reportRecipients: 'operators',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch current settings when modal opens
  useEffect(() => {
    if (isOpen && companyId) {
      fetchSettings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, companyId])

  const fetchSettings = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/settings`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch settings')
        return
      }

      setSettings({
        dailyReportEnabled: data.settings?.dailyReportEnabled || false,
        reportRecipients: data.settings?.reportRecipients || 'operators',
      })
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError('Network error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/companies/${companyId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save settings')
        return
      }

      setSuccess('Settings saved successfully')
      onSave?.()

      // Close modal after brief delay
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Network error')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform bg-white rounded-xl shadow-xl transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Company Settings</h2>
              <p className="text-sm text-gray-500">{companyName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="material-icons text-gray-500">close</span>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <span className="material-icons text-blue-600 text-3xl animate-spin">refresh</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                    <span className="material-icons text-red-500 text-sm">error</span>
                    {error}
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg">
                    <span className="material-icons text-green-500 text-sm">check_circle</span>
                    {success}
                  </div>
                )}

                {/* Daily Email Reports Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className="material-icons text-blue-600 text-lg">email</span>
                    Email Reports
                  </h3>

                  {/* Toggle for Daily Reports */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Daily Email Reports</p>
                      <p className="text-sm text-gray-500">
                        Send automated PDF reports at midnight IST
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={settings.dailyReportEnabled}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          dailyReportEnabled: !prev.dailyReportEnabled,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        settings.dailyReportEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          settings.dailyReportEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Recipient Selection */}
                  {settings.dailyReportEnabled && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Send reports to
                      </label>
                      <select
                        value={settings.reportRecipients}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            reportRecipients: e.target.value as 'operators' | 'admins' | 'all',
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="operators">Operators Only</option>
                        <option value="admins">Admins Only</option>
                        <option value="all">All Users (Operators & Admins)</option>
                      </select>
                      <p className="text-xs text-gray-500">
                        Note: At least one operator with an email address is required to send reports.
                      </p>
                    </div>
                  )}
                </div>

                {/* Info Box */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex gap-3">
                    <span className="material-icons text-blue-600 text-lg flex-shrink-0">info</span>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">About Daily Reports</p>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        <li>Reports are generated at 00:00 IST daily</li>
                        <li>Includes flow data, alerts, and device health</li>
                        <li>PDF attachment with detailed charts and statistics</li>
                        <li>Requires at least one operator with a valid email</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <span className="material-icons text-sm animate-spin">refresh</span>
                  Saving...
                </>
              ) : (
                <>
                  <span className="material-icons text-sm">save</span>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
