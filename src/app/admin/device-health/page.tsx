'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDateTimeIST } from '@/lib/timezone';

interface PollingSession {
  start: string;
  end: string;
  durationMinutes: number;
  dataPoints: number;
  gapBeforeMinutes: number | null;
}

interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  pipeNumber: number;
  location: string;
  firstSeen: string | null;
  lastSeen: string | null;
  totalDataPoints: number;
  sessions: PollingSession[];
  sessionCount: number;
  uptimeMinutes: number;
  downtimeMinutes: number;
  uptimePercentage: number;
  currentStatus: 'online' | 'offline';
  currentDurationMinutes: number;
}

interface HealthSummary {
  totalDevices: number;
  onlineCount: number;
  offlineCount: number;
  averageUptimePercentage: number;
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function getGapColor(gapMinutes: number | null): string {
  if (gapMinutes === null) return '';
  if (gapMinutes > 30) return 'text-red-600 font-semibold';
  if (gapMinutes > 5) return 'text-orange-500 font-medium';
  return 'text-gray-500';
}

export default function DeviceHealthPage() {
  const [devices, setDevices] = useState<DeviceHealth[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [days, setDays] = useState(7);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/device-health?days=${days}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to fetch');
      }
      const data = await res.json();
      setDevices(data.devices);
      setSummary(data.summary);
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

  const filteredDevices = devices.filter((d) => {
    if (filter === 'all') return true;
    return d.currentStatus === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Health</h1>
          <p className="text-gray-500 mt-1">
            Uptime/downtime history and polling session analysis
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
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500">Total Devices</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalDevices}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Currently Online</p>
            <p className="text-2xl font-bold text-green-600">{summary.onlineCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-500">Currently Offline</p>
            <p className="text-2xl font-bold text-red-600">{summary.offlineCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
            <p className="text-sm text-gray-500">Avg Uptime</p>
            <p className="text-2xl font-bold text-purple-600">{summary.averageUptimePercentage}%</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'online', 'offline'] as const).map((status) => (
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
            {status !== 'all' && summary && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {status === 'online' ? summary.onlineCount : summary.offlineCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Device Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading && devices.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
            <p className="mt-4 text-gray-600">Loading device health data...</p>
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-icons text-gray-400 text-4xl">monitor_heart</span>
            <p className="mt-4 text-gray-600">No devices found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Device</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Last Seen (IST)</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Uptime %</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Current Duration</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Sessions</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Data Points</th>
                <th className="text-center px-4 py-3 font-medium text-gray-700"></th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                const isExpanded = expandedDevice === device.deviceId;
                return (
                  <DeviceRow
                    key={device.deviceId}
                    device={device}
                    isExpanded={isExpanded}
                    onToggle={() =>
                      setExpandedDevice(isExpanded ? null : device.deviceId)
                    }
                  />
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="material-icons text-blue-500 mt-0.5">info</span>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Session Detection Logic</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>
                A <strong>polling session</strong> groups consecutive data points that arrive
                within 5 minutes of each other.
              </li>
              <li>
                A gap of more than 5 minutes between data points starts a new session.
              </li>
              <li>
                A device is considered <strong>online</strong> if its last data point was received
                within the past 5 minutes.
              </li>
              <li>
                <span className="text-orange-600 font-medium">Orange</span> gaps = 5 to 30
                minutes. <span className="text-red-600 font-medium">Red</span> gaps = over 30
                minutes.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceRow({
  device,
  isExpanded,
  onToggle,
}: {
  device: DeviceHealth;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const uptimeColor =
    device.uptimePercentage >= 90
      ? 'text-green-600'
      : device.uptimePercentage >= 50
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <>
      <tr
        className="border-b hover:bg-gray-50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-icons text-blue-600">water</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {device.pipeNumber > 0 ? `Pipe ${device.pipeNumber}` : device.deviceName}
              </p>
              <p className="text-sm text-gray-500">{device.deviceId}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          {device.currentStatus === 'online' ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Offline
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {device.lastSeen ? formatDateTimeIST(new Date(device.lastSeen)) : 'Never'}
        </td>
        <td className="px-4 py-3 text-right">
          <span className={`font-bold ${uptimeColor}`}>{device.uptimePercentage}%</span>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div
              className={`h-1.5 rounded-full ${
                device.uptimePercentage >= 90
                  ? 'bg-green-500'
                  : device.uptimePercentage >= 50
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${device.uptimePercentage}%` }}
            ></div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <span
            className={
              device.currentStatus === 'online' ? 'text-green-600' : 'text-red-600'
            }
          >
            {device.currentStatus === 'online' ? 'Online for ' : 'Offline for '}
            {formatDuration(device.currentDurationMinutes)}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-sm text-gray-700">
          {device.sessionCount}
        </td>
        <td className="px-4 py-3 text-right text-sm text-gray-700">
          {device.totalDataPoints.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="material-icons text-gray-400 text-sm">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </td>
      </tr>

      {/* Expanded Session Timeline */}
      {isExpanded && (
        <tr>
          <td colSpan={8} className="bg-gray-50 px-4 py-4">
            {device.sessions.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-2">
                No polling sessions recorded in this time window.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left px-3 py-2 font-medium text-gray-600">#</th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">
                        Start (IST)
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-gray-600">
                        End (IST)
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        Duration
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        Data Points
                      </th>
                      <th className="text-right px-3 py-2 font-medium text-gray-600">
                        Gap Before
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {device.sessions.map((session, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 hover:bg-white"
                      >
                        <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatDateTimeIST(new Date(session.start))}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {formatDateTimeIST(new Date(session.end))}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {formatDuration(session.durationMinutes)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {session.dataPoints}
                        </td>
                        <td
                          className={`px-3 py-2 text-right ${getGapColor(session.gapBeforeMinutes)}`}
                        >
                          {session.gapBeforeMinutes !== null
                            ? formatDuration(session.gapBeforeMinutes)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
