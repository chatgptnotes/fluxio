'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateTimeIST } from '@/lib/timezone';

interface CronLogRow {
  id: number;
  job_name: string;
  status: 'success' | 'failure';
  started_at: string;
  finished_at: string;
  duration_ms: number;
  details: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
}

interface JobSummary {
  job_name: string;
  health: 'healthy' | 'warning' | 'critical';
  last_run: string | null;
  last_status: string | null;
  hours_since_last_run: number | null;
  success_count: number;
  failure_count: number;
  total_count: number;
  success_rate: number;
  avg_duration_ms: number;
}

interface CronHealthData {
  summary: {
    overall_health: 'healthy' | 'warning' | 'critical';
    total_executions: number;
    success_rate: number;
    avg_duration_ms: number;
  };
  jobs: JobSummary[];
  logs: CronLogRow[];
  days: number;
}

function formatDurationMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 100) / 10;
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m ${secs}s`;
}

function getHealthColor(health: string): string {
  switch (health) {
    case 'healthy':
      return 'text-green-600';
    case 'warning':
      return 'text-yellow-600';
    case 'critical':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

function getHealthBg(health: string): string {
  switch (health) {
    case 'healthy':
      return 'bg-green-100 text-green-700';
    case 'warning':
      return 'bg-yellow-100 text-yellow-700';
    case 'critical':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getHealthIcon(health: string): string {
  switch (health) {
    case 'healthy':
      return 'check_circle';
    case 'warning':
      return 'warning';
    case 'critical':
      return 'error';
    default:
      return 'help';
  }
}

function getHealthBorder(health: string): string {
  switch (health) {
    case 'healthy':
      return 'border-green-500';
    case 'warning':
      return 'border-yellow-500';
    case 'critical':
      return 'border-red-500';
    default:
      return 'border-gray-500';
  }
}

export default function CronHealthPage() {
  const [data, setData] = useState<CronHealthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/cron-health?days=${days}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to fetch');
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cron Health</h1>
          <p className="text-gray-500 mt-1">
            Execution history and health monitoring for scheduled jobs
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <span className={`material-icons text-sm ${isLoading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      {/* Day Range Toggle */}
      <div className="flex gap-2">
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              days === d
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <span className="material-icons text-red-500">error</span>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${getHealthBorder(data.summary.overall_health)}`}>
            <p className="text-sm text-gray-500">Overall Health</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`material-icons ${getHealthColor(data.summary.overall_health)}`}>
                {getHealthIcon(data.summary.overall_health)}
              </span>
              <p className={`text-2xl font-bold capitalize ${getHealthColor(data.summary.overall_health)}`}>
                {data.summary.overall_health}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Executions</p>
            <p className="text-2xl font-bold text-gray-900">{data.summary.total_executions}</p>
            <p className="text-xs text-gray-400 mt-1">Last {days} days</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-2xl font-bold text-purple-600">{data.summary.success_rate}%</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-indigo-500">
            <p className="text-sm text-gray-500">Avg Duration</p>
            <p className="text-2xl font-bold text-indigo-600">
              {formatDurationMs(data.summary.avg_duration_ms)}
            </p>
          </div>
        </div>
      )}

      {/* Per-Job Health Cards */}
      {data && data.jobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.jobs.map((job) => (
            <div
              key={job.job_name}
              className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${getHealthBorder(job.health)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{job.job_name}</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthBg(job.health)}`}
                >
                  <span className="material-icons text-sm">{getHealthIcon(job.health)}</span>
                  {job.health}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Run</span>
                  <span className="text-gray-700">
                    {job.last_run ? formatDateTimeIST(new Date(job.last_run)) : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Hours Ago</span>
                  <span className="text-gray-700">
                    {job.hours_since_last_run !== null ? `${job.hours_since_last_run}h` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Success / Failure</span>
                  <span>
                    <span className="text-green-600 font-medium">{job.success_count}</span>
                    {' / '}
                    <span className="text-red-600 font-medium">{job.failure_count}</span>
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Duration</span>
                  <span className="text-gray-700">{formatDurationMs(job.avg_duration_ms)}</span>
                </div>
                {/* Success rate bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        job.success_rate >= 90
                          ? 'bg-green-500'
                          : job.success_rate >= 50
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${job.success_rate}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{job.success_rate}% success</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Execution History Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-semibold text-gray-900">Execution History</h2>
        </div>
        {isLoading && (!data || data.logs.length === 0) ? (
          <div className="p-8 text-center">
            <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
            <p className="mt-4 text-gray-600">Loading cron execution logs...</p>
          </div>
        ) : !data || data.logs.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-icons text-gray-400 text-4xl">schedule</span>
            <p className="mt-4 text-gray-600">No cron executions recorded yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Executions will appear here after the next scheduled cron run
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Job</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Started (IST)</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Duration</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Error</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="material-icons text-gray-400 text-sm">schedule</span>
                        <span className="font-medium text-gray-900">{log.job_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <span className="material-icons text-sm">check_circle</span>
                          Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <span className="material-icons text-sm">error</span>
                          Failure
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTimeIST(new Date(log.started_at))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-700">
                      {formatDurationMs(log.duration_ms)}
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 max-w-xs truncate">
                      {log.error_message || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="material-icons text-blue-500 mt-0.5">info</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Watchdog Monitoring</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>
                The <strong>watchdog</strong> cron runs every 6 hours and checks that all scheduled
                jobs have executed recently.
              </li>
              <li>
                If a job has not run in the last <strong>25 hours</strong>, the watchdog raises a
                critical system alert.
              </li>
              <li>
                If the last execution of a job <strong>failed</strong>, the status is marked as
                warning.
              </li>
              <li>
                Alerts are deduplicated so you will not receive repeated alerts for the same issue
                within 24 hours.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
