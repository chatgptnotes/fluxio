'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function LoginContent() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isPendingVerification, setIsPendingVerification] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  const sessionExpired = searchParams.get('expired') === 'true'
  const isDev = process.env.NODE_ENV === 'development'

  const fillDevCredentials = () => {
    setUsername('buzzlightyear_42')
    setPassword('Lightyear@123')
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setIsPendingVerification(false)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if it's a pending verification error
        if (data.code === 'PENDING_VERIFICATION') {
          setIsPendingVerification(true)
          setError(data.error)
        } else {
          setError(data.error || 'Login failed')
        }
        return
      }

      // Determine redirect based on user role
      // Operators and viewers with a company go to pipeline view
      // Superadmins and admins go to the main dashboard
      let destination = redirectTo
      if (redirectTo === '/dashboard' && data.user) {
        const { role, isSuperadmin } = data.user
        if (!isSuperadmin && role !== 'admin') {
          destination = '/cstps-pipeline'
        }
      }

      router.push(destination)
      router.refresh()
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2),transparent_50%)]"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="group inline-flex items-center space-x-2 transition-transform hover:scale-105">
            <span className="material-icons text-white text-4xl">water_drop</span>
            <span className="text-3xl font-bold text-white">FlowNexus</span>
          </Link>
          <p className="mt-2 text-sm text-white/80">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
            <p className="mt-1 text-sm text-gray-600">
              Enter your credentials to continue
            </p>
          </div>

          {/* Session Expired Warning */}
          {sessionExpired && (
            <div className="mb-6 rounded-lg bg-orange-50 p-4 border border-orange-200">
              <div className="flex items-start space-x-3">
                <span className="material-icons text-orange-600 flex-shrink-0">timer_off</span>
                <div>
                  <p className="font-medium text-orange-800">Session Expired</p>
                  <p className="mt-1 text-sm text-orange-700">
                    Your session has expired due to inactivity. Please log in again to continue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Verification Warning */}
          {isPendingVerification && (
            <div className="mb-6 rounded-lg bg-amber-50 p-4 border border-amber-200">
              <div className="flex items-start space-x-3">
                <span className="material-icons text-amber-600 flex-shrink-0">schedule</span>
                <div>
                  <p className="font-medium text-amber-800">Account Pending Verification</p>
                  <p className="mt-1 text-sm text-amber-700">
                    Your account has been created but is awaiting superadmin approval. You will be able to log in once your account is verified.
                  </p>
                  <p className="mt-2 text-sm text-amber-600">
                    Please contact your administrator for faster verification.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Regular Error */}
          {error && !isPendingVerification && (
            <div className="mb-6 flex items-start space-x-3 rounded-lg bg-red-50 p-4">
              <span className="material-icons text-red-600 flex-shrink-0">error</span>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username or Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 text-xl">person</span>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your username or email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="material-icons text-gray-400 text-xl">lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-icons text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </div>

            {isDev && (
              <button
                type="button"
                onClick={fillDevCredentials}
                className="w-full rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-100 flex items-center justify-center gap-2"
              >
                <span className="material-icons text-sm">auto_fix_high</span>
                Fill Superadmin Credentials (Dev Only)
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
            >
              {loading ? (
                <>
                  <span className="material-icons animate-spin">refresh</span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span className="material-icons">login</span>
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">
                  Don&apos;t have an account?
                </span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href="/signup"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                <span className="material-icons text-xl">person_add</span>
                Create an account
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-white/90 hover:text-white flex items-center justify-center gap-1"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back to home
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/60">
            FlowNexus v1.6 | February 1, 2026 | flownexus
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <span className="material-icons text-white text-4xl animate-spin">refresh</span>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
