'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { formatTimeIST, formatDateIST } from '@/lib/timezone';

interface RemoteCommand {
  id: string;
  device_id: string;
  command: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  exit_code: number | null;
  output: string | null;
  error_message: string | null;
  submitted_by: string | null;
  timeout_secs: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

interface RemoteTerminalProps {
  deviceId: string;
  onDeviceChange?: (deviceId: string) => void;
  availableDevices?: string[];
}

const STATUS_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  pending: { icon: 'schedule', color: 'text-yellow-400', label: 'Pending' },
  running: { icon: 'sync', color: 'text-blue-400', label: 'Running' },
  completed: { icon: 'check_circle', color: 'text-green-400', label: 'Completed' },
  failed: { icon: 'error', color: 'text-red-400', label: 'Failed' },
  timeout: { icon: 'timer_off', color: 'text-orange-400', label: 'Timeout' },
  cancelled: { icon: 'cancel', color: 'text-gray-400', label: 'Cancelled' },
};

export default function RemoteTerminal({
  deviceId,
  onDeviceChange,
  availableDevices = ['TRB246_001'],
}: RemoteTerminalProps) {
  const [commands, setCommands] = useState<RemoteCommand[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPolling, setIsPolling] = useState(true);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Fetch command history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/remote/history?device_id=${deviceId}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setCommands(data.commands || []);
      }
    } catch (err) {
      console.error('Failed to fetch command history:', err);
    }
  }, [deviceId]);

  // Poll for updates
  useEffect(() => {
    fetchHistory();

    if (!isPolling) return;

    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [fetchHistory, isPolling]);

  // Auto-scroll to bottom when new commands arrive
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [commands]);

  // Submit a command
  const submitCommand = async () => {
    const cmd = inputValue.trim();
    if (!cmd || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/remote/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          command: cmd,
          timeout_secs: 30,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to submit command');
        return;
      }

      setInputValue('');
      setCommandHistory(prev => [cmd, ...prev.slice(0, 49)]);
      setHistoryIndex(-1);
      // Immediately fetch to show the new command
      await fetchHistory();
    } catch (err) {
      setError('Network error, please try again');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInputValue('');
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatTime = (dateStr: string) => formatTimeIST(new Date(dateStr));

  const formatDate = (dateStr: string) => formatDateIST(new Date(dateStr));

  // Render commands in chronological order (oldest first)
  const sortedCommands = [...commands].reverse();

  return (
    <div className="flex flex-col h-full bg-gray-950 rounded-xl border border-gray-800 overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-gray-400 text-sm font-mono">
            remote@{deviceId}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Device selector */}
          {availableDevices.length > 1 && (
            <select
              value={deviceId}
              onChange={(e) => onDeviceChange?.(e.target.value)}
              className="bg-gray-800 text-gray-300 text-sm rounded px-2 py-1 border border-gray-700 focus:outline-none focus:border-green-500"
            >
              {availableDevices.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          )}
          {/* Polling toggle */}
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
              isPolling ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-500'
            }`}
            title={isPolling ? 'Auto-refresh ON (3s)' : 'Auto-refresh OFF'}
          >
            <span className={`material-icons text-sm ${isPolling ? 'animate-spin' : ''}`}>
              {isPolling ? 'sync' : 'sync_disabled'}
            </span>
            {isPolling ? 'Live' : 'Paused'}
          </button>
          {/* Refresh button */}
          <button
            onClick={fetchHistory}
            className="text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <span className="material-icons text-sm">refresh</span>
          </button>
        </div>
      </div>

      {/* Terminal output area */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-3 min-h-0"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Welcome message */}
        {commands.length === 0 && (
          <div className="text-gray-500">
            <p>FluxIO Remote Shell - Connected to {deviceId}</p>
            <p>Type a command below and press Enter to execute on the remote device.</p>
            <p className="text-gray-600 mt-2">
              Commands are queued and executed when the device polls (every 5s).
            </p>
          </div>
        )}

        {/* Command entries */}
        {sortedCommands.map((cmd) => {
          const statusCfg = STATUS_CONFIG[cmd.status] || STATUS_CONFIG.pending;
          const isExpanded = expandedIds.has(cmd.id);

          return (
            <div key={cmd.id} className="group">
              {/* Command line */}
              <div
                className="flex items-start gap-2 cursor-pointer hover:bg-gray-900/50 rounded px-1 -mx-1"
                onClick={() => toggleExpand(cmd.id)}
              >
                <span className={`material-icons text-sm mt-0.5 ${statusCfg.color}`}>
                  {statusCfg.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">
                      {formatDate(cmd.created_at)} {formatTime(cmd.created_at)}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      cmd.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                      cmd.status === 'failed' ? 'bg-red-900/30 text-red-400' :
                      cmd.status === 'running' ? 'bg-blue-900/30 text-blue-400' :
                      cmd.status === 'timeout' ? 'bg-orange-900/30 text-orange-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {statusCfg.label}
                      {cmd.exit_code !== null && cmd.exit_code !== 0 && (
                        <span className="ml-1">({cmd.exit_code})</span>
                      )}
                    </span>
                    {cmd.submitted_by && (
                      <span className="text-gray-600 text-xs">by {cmd.submitted_by}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-green-400">$</span>
                    <span className="text-gray-200">{cmd.command}</span>
                  </div>
                </div>
                <span className="material-icons text-gray-600 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                  {isExpanded ? 'expand_less' : 'expand_more'}
                </span>
              </div>

              {/* Output (expandable) */}
              {isExpanded && (cmd.output || cmd.error_message) && (
                <div className="ml-6 mt-1 pl-3 border-l-2 border-gray-800">
                  {cmd.output && (
                    <pre className="text-gray-300 text-xs whitespace-pre-wrap break-all leading-relaxed">
                      {cmd.output}
                    </pre>
                  )}
                  {cmd.error_message && (
                    <p className="text-red-400 text-xs mt-1">
                      <span className="material-icons text-xs align-middle mr-1">warning</span>
                      {cmd.error_message}
                    </p>
                  )}
                  {cmd.started_at && cmd.completed_at && (
                    <p className="text-gray-600 text-xs mt-1">
                      Duration: {((new Date(cmd.completed_at).getTime() - new Date(cmd.started_at).getTime()) / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              )}

              {/* Auto-expand running commands */}
              {cmd.status === 'running' && !isExpanded && (
                <div className="ml-6 mt-1 text-blue-400 text-xs animate-pulse">
                  <span className="material-icons text-xs align-middle mr-1">hourglass_empty</span>
                  Waiting for output...
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-2 bg-red-900/30 border-t border-red-800 flex items-center justify-between">
          <span className="text-red-400 text-sm flex items-center gap-2">
            <span className="material-icons text-sm">error</span>
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
            <span className="material-icons text-sm">close</span>
          </button>
        </div>
      )}

      {/* Command input bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 border-t border-gray-800">
        <span className="text-green-400 font-mono text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          disabled={isSubmitting}
          autoFocus
          className="flex-1 bg-transparent text-gray-200 font-mono text-sm placeholder-gray-600 focus:outline-none disabled:opacity-50"
        />
        <button
          onClick={submitCommand}
          disabled={isSubmitting || !inputValue.trim()}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors"
        >
          {isSubmitting ? (
            <span className="material-icons text-sm animate-spin">sync</span>
          ) : (
            <span className="material-icons text-sm">send</span>
          )}
          Run
        </button>
      </div>
    </div>
  );
}
