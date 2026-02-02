'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cstpsPipes, NivusSensor } from '@/lib/cstps-data';

interface PipelineWithLiveData extends NivusSensor {
  liveFlowRate?: number;
  liveTotalizer?: number;
}

export default function AdminPipelinesPage() {
  const [pipelines, setPipelines] = useState<PipelineWithLiveData[]>(cstpsPipes);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'online' | 'offline' | 'warning'>('all');

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  async function fetchLiveData() {
    setIsLoading(true);
    try {
      // Fetch live data from API
      const response = await fetch('/api/flow-data?latest=true');
      if (response.ok) {
        const data = await response.json();

        // Merge live data with static pipe data
        const updatedPipelines = cstpsPipes.map(pipe => {
          const liveData = data.data?.find((d: { device_id: string }) =>
            d.device_id === pipe.deviceId || d.device_id === `pipe-${pipe.pipeNumber}`
          );

          return {
            ...pipe,
            liveFlowRate: liveData?.flow_rate ?? pipe.parameters.flowRate,
            liveTotalizer: liveData?.totalizer ?? pipe.parameters.totalizer,
            status: liveData ? (liveData.flow_rate > 0 ? 'online' : 'warning') : pipe.status,
          } as PipelineWithLiveData;
        });

        setPipelines(updatedPipelines);
      }
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const filteredPipelines = pipelines.filter(pipe => {
    if (filter === 'all') return true;
    return pipe.status === filter;
  });

  const stats = {
    total: pipelines.length,
    online: pipelines.filter(p => p.status === 'online').length,
    warning: pipelines.filter(p => p.status === 'warning').length,
    offline: pipelines.filter(p => p.status === 'offline').length,
    totalFlow: pipelines.reduce((sum, p) => sum + (p.liveFlowRate || p.parameters.flowRate), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Online
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            Warning
          </span>
        );
      case 'offline':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            Offline
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipelines</h1>
          <p className="text-gray-500 mt-1">Monitor and manage all flow monitoring pipelines</p>
        </div>
        <button
          onClick={fetchLiveData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <span className={`material-icons text-sm ${isLoading ? 'animate-spin' : ''}`}>refresh</span>
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Pipelines</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Online</p>
          <p className="text-2xl font-bold text-green-600">{stats.online}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Warning</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Offline</p>
          <p className="text-2xl font-bold text-red-600">{stats.offline}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">Total Flow Rate</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalFlow.toFixed(1)} <span className="text-sm font-normal">m3/h</span></p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'online', 'warning', 'offline'] as const).map((status) => (
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
            {status !== 'all' && (
              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                {status === 'online' ? stats.online : status === 'warning' ? stats.warning : stats.offline}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pipelines Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading && pipelines.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
            <p className="mt-4 text-gray-600">Loading pipelines...</p>
          </div>
        ) : filteredPipelines.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-icons text-gray-400 text-4xl">plumbing</span>
            <p className="mt-4 text-gray-600">No pipelines found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Pipeline</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Device ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Flow Rate</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Velocity</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Water Level</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Totalizer</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPipelines.map((pipe) => (
                <tr key={pipe.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <span className="material-icons text-blue-600">water</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Pipe {pipe.pipeNumber}</p>
                        <p className="text-sm text-gray-500">{pipe.location}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">{pipe.deviceId}</code>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(pipe.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${(pipe.liveFlowRate || pipe.parameters.flowRate) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {(pipe.liveFlowRate || pipe.parameters.flowRate).toFixed(2)} m3/h
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {pipe.parameters.velocity.toFixed(2)} m/s
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {pipe.parameters.waterLevel.toFixed(0)} mm
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-gray-900">
                      {(pipe.liveTotalizer || pipe.parameters.totalizer).toLocaleString()} m3
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/cstps-pipeline/${pipe.pipeNumber}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        <span className="material-icons text-sm">visibility</span>
                        View
                      </Link>
                      <Link
                        href={`/transmitter/${pipe.deviceId}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        <span className="material-icons text-sm">settings</span>
                        Config
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Status Legend</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>Online - Active data transmission</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
            <span>Warning - No flow detected or low battery</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span>Offline - No communication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
