'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Droplet,
  UserPlus,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  Shield,
} from 'lucide-react'

export default function SignupPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const isDev = process.env.NODE_ENV === 'development'

  const fillDevCredentials = () => {
    setFormData({
      fullName: 'Test User',
      username: 'testuser',
      email: 'test@flownexus.dev',
      password: 'test123456',
      confirmPassword: 'test123456',
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username || undefined,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      setSuccess(true)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Success state - show verification pending message
  if (success) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-4 py-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2),transparent_50%)]"></div>
        </div>

        <div className="relative w-full max-w-md animate-scale-in">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link href="/" className="group inline-flex items-center space-x-2 transition-transform hover:scale-105">
              <Droplet className="h-10 w-10 text-white animate-float" />
              <span className="text-3xl font-bold text-white">FlowNexus</span>
            </Link>
          </div>

          {/* Success Card */}
          <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
                <Clock className="h-10 w-10 text-amber-600" />
              </div>

              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Account Created
              </h2>

              <div className="mb-6 rounded-lg bg-amber-50 p-4 text-left">
                <div className="flex items-start space-x-3">
                  <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-800">
                      Verification Required
                    </p>
                    <p className="mt-1 text-sm text-amber-700">
                      Your account has been created but requires superadmin verification before you can log in.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Account created successfully</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>Waiting for superadmin approval</span>
                </div>
              </div>

              <p className="mt-6 text-sm text-gray-500">
                You will be notified once your account is verified. Please contact your administrator if you need immediate access.
              </p>

              <div className="mt-8 space-y-3">
                <Link
                  href="/login"
                  className="btn-primary flex w-full items-center justify-center"
                >
                  Go to Login
                </Link>
                <Link
                  href="/"
                  className="btn-secondary flex w-full justify-center"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white/60">
              FlowNexus v1.7 | February 19, 2026 | flownexus
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.2),transparent_50%)]"></div>
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="group inline-flex items-center space-x-2 transition-transform hover:scale-105">
            <Droplet className="h-10 w-10 text-white animate-float" />
            <span className="text-3xl font-bold text-white">FlowNexus</span>
          </Link>
          <p className="mt-2 text-sm text-white/80">
            Create your account to get started
          </p>
        </div>

        {/* Signup Card */}
        <div className="rounded-3xl border border-white/20 bg-white/95 p-8 shadow-2xl backdrop-blur-md">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Create an account
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Start monitoring your flow transmitters today
            </p>
          </div>

          {/* Info Banner */}
          <div className="mb-6 rounded-lg bg-blue-50 p-4">
            <div className="flex items-start space-x-3">
              <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <p className="text-sm text-blue-800">
                New accounts require superadmin verification before login access is granted.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start space-x-3 rounded-lg bg-red-50 p-4">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="label">
                Full name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="label">
                Username <span className="text-gray-400">(optional)</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-400">@</span>
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="johndoe"
                  pattern="[a-zA-Z0-9_]+"
                  title="Username can only contain letters, numbers, and underscores"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Will be generated from email if not provided
              </p>
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="********"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                Confirm password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10"
                  placeholder="********"
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                I agree to the{' '}
                <Link
                  href="/terms"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            {isDev && (
              <button
                type="button"
                onClick={fillDevCredentials}
                className="w-full rounded-lg border-2 border-dashed border-yellow-400 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 transition-colors hover:bg-yellow-100"
              >
                Fill Dev Credentials (Test User)
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex w-full items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  <span>Create account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="btn-secondary flex w-full justify-center"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-white/90 hover:text-white"
          >
            Back to home
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/60">
            FlowNexus v1.7 | February 19, 2026 | flownexus
          </p>
        </div>
      </div>
    </div>
  )
}
