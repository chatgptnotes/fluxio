'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';
import RemoteTerminal from '@/components/remote/RemoteTerminal';

const AVAILABLE_DEVICES = ['TRB246_001'];

export default function RemoteShellPage() {
  const { user, isSuperadmin } = usePermissions();
  const [deviceId, setDeviceId] = useState(AVAILABLE_DEVICES[0]);

  // Only admin/superadmin
  const isAdmin = user?.role === 'admin' || isSuperadmin;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-icons text-4xl text-gray-400">lock</span>
          <p className="text-gray-500 mt-2">Please log in to access this page.</p>
          <Link href="/login" className="text-blue-600 hover:underline mt-2 inline-block">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <span className="material-icons text-4xl text-red-400">block</span>
          <p className="text-gray-500 mt-2">Admin access required for Remote Shell.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Admin
          </Link>
          <span className="text-gray-300">/</span>
          <div className="flex items-center gap-2">
            <span className="material-icons text-gray-700">terminal</span>
            <h1 className="text-xl font-bold text-gray-900">Remote Shell</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="material-icons text-sm">info</span>
          Commands execute on the TRB246 gateway via polling (5s interval)
        </div>
      </div>

      {/* Terminal */}
      <div className="flex-1 min-h-0" style={{ height: 'calc(100vh - 12rem)' }}>
        <RemoteTerminal
          deviceId={deviceId}
          onDeviceChange={setDeviceId}
          availableDevices={AVAILABLE_DEVICES}
        />
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 text-right">
        v1.3 | 2026-02-17 | github.com/chatgptnotes/fluxio
      </p>
    </div>
  );
}
