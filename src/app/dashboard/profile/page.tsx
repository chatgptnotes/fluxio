'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setError('')
    setSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      setUpdating(false)
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      setUpdating(false)
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update password')
        return
      }

      setSuccess('Password updated successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Not authenticated</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
            >
              <span className="material-icons">arrow_back</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account settings
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 flex items-start space-x-3 rounded-lg bg-red-50 p-4">
            <span className="material-icons text-red-600 text-xl">error</span>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start space-x-3 rounded-lg bg-green-50 p-4">
            <span className="material-icons text-green-600 text-xl">check_circle</span>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Profile Information */}
        <div className="mb-6 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Profile Information
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="material-icons text-blue-600 text-3xl">person</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{user.fullName}</p>
                <p className="text-sm text-gray-500">@{user.username}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Email</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{user.email}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Role</p>
                <p className="mt-1 text-sm font-medium text-gray-900 capitalize">
                  {user.isSuperadmin ? 'Superadmin' : user.role}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Company</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {user.companyId || 'All Companies'}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider">User ID</p>
                <p className="mt-1 text-xs font-mono text-gray-700 break-all">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">
            Change Password
          </h2>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 text-xl">lock</span>
                </div>
                <input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter current password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 text-xl">lock_reset</span>
                </div>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter new password"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm new password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 text-xl">lock</span>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updating}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {updating ? (
                <div className="flex items-center justify-center space-x-2">
                  <span className="material-icons text-sm animate-spin">refresh</span>
                  <span>Updating...</span>
                </div>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-gray-400">
            FlowNexus v1.5 | February 18, 2026 | fluxio
          </p>
        </div>
      </footer>
    </div>
  )
}
