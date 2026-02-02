'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface EmailLog {
  id: string;
  company_id: string;
  company_name: string;
  report_date: string;
  recipients: string[];
  status: 'pending' | 'sent' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export default function EmailLogsPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/email-logs');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch email logs');
        return;
      }

      setLogs(data.logs || []);
    } catch (err) {
      console.error('Error fetching email logs:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.status === filter;
  });

  const stats = {
    total: logs.length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
    pending: logs.filter(l => l.status === 'pending').length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <span className="material-icons text-xs">check_circle</span>
            Sent
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <span className="material-icons text-xs">error</span>
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <span className="material-icons text-xs">schedule</span>
            Pending
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Report Logs</h1>
          <p className="text-gray-500 mt-1">View history of automated email reports</p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <span className={`material-icons text-sm ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Emails</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Sent</p>
          <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'sent', 'failed', 'pending'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-icons text-red-500">error</span>
          {error}
        </div>
      )}

      {/* Email Logs Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
            <p className="mt-4 text-gray-600">Loading email logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-icons text-gray-400 text-4xl">mail_outline</span>
            <p className="mt-4 text-gray-600">No email logs found</p>
            <p className="text-sm text-gray-500 mt-2">
              Email logs will appear here after daily reports are sent
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Report Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Recipients</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Sent At</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Error</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <span className="material-icons text-purple-600">business</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{log.company_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatDate(log.report_date)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      {log.recipients.length > 0 ? (
                        <div className="space-y-1">
                          {log.recipients.slice(0, 2).map((email, idx) => (
                            <div key={idx} className="text-sm text-gray-600 flex items-center gap-1">
                              <span className="material-icons text-xs text-gray-400">email</span>
                              {email}
                            </div>
                          ))}
                          {log.recipients.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{log.recipients.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No recipients</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(log.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(log.sent_at)}
                  </td>
                  <td className="px-4 py-3">
                    {log.error_message ? (
                      <span className="text-sm text-red-600 truncate max-w-xs block" title={log.error_message}>
                        {log.error_message}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex gap-3">
          <span className="material-icons text-blue-600 text-lg flex-shrink-0">info</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">About Email Reports</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Daily reports are sent at 00:00 IST to companies with email reports enabled</li>
              <li>Only companies with at least one operator email address receive reports</li>
              <li>Reports include PDF attachment with flow data, alerts, and device health</li>
              <li>Configure email settings in <Link href="/admin/companies" className="underline">Companies</Link> page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
