'use client';

import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-icons text-red-600 text-4xl">lock</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">
            You do not have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="material-icons text-sm">dashboard</span>
              Go to Dashboard
            </Link>
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="material-icons text-sm">login</span>
              Sign in with different account
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          FluxIO v1.3 | February 1, 2026 | fluxio
        </p>
      </div>
    </div>
  );
}
