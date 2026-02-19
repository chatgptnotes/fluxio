'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: number;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
  users?: {
    username: string;
    full_name: string;
  } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For now, display a placeholder since we need to create the API
    // In production, this would fetch from /api/admin/audit
    setIsLoading(false);
    setLogs([]);
  }, []);

  const getActionIcon = (action: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      login: { icon: 'login', color: 'text-green-600' },
      logout: { icon: 'logout', color: 'text-gray-600' },
      create_user: { icon: 'person_add', color: 'text-blue-600' },
      update_user: { icon: 'edit', color: 'text-orange-600' },
      delete_user: { icon: 'person_off', color: 'text-red-600' },
      update_user_permissions: { icon: 'security', color: 'text-purple-600' },
      add_pipeline_permission: { icon: 'add_circle', color: 'text-green-600' },
      remove_pipeline_permission: { icon: 'remove_circle', color: 'text-red-600' },
      create_company: { icon: 'add_business', color: 'text-blue-600' },
    };

    return icons[action] || { icon: 'info', color: 'text-gray-600' };
  };

  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Review system activity and user actions</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="material-icons text-sm">refresh</span>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create_user">Create User</option>
            <option value="update_user">Update User</option>
            <option value="delete_user">Delete User</option>
            <option value="update_user_permissions">Update Permissions</option>
          </select>
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">All Resources</option>
            <option value="user">User</option>
            <option value="session">Session</option>
            <option value="company">Company</option>
            <option value="pipeline">Pipeline</option>
          </select>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-xl shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
            <p className="mt-4 text-gray-600">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-icons text-gray-400 text-4xl">history</span>
            <p className="mt-4 text-gray-600">No audit logs found</p>
            <p className="text-sm text-gray-500 mt-2">
              Actions performed in the system will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {logs.map((log) => {
              const { icon, color } = getActionIcon(log.action);
              return (
                <div key={log.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-icons ${color}`}>{icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{formatAction(log.action)}</p>
                        {log.resource_type && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {log.resource_type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {log.users ? (
                          <>
                            by <strong>{log.users.full_name}</strong> (@{log.users.username})
                          </>
                        ) : (
                          'System'
                        )}
                      </p>
                      {Object.keys(log.details || {}).length > 0 && (
                        <div className="mt-2 text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>
                        {new Date(log.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="text-xs">
                        {new Date(log.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {log.ip_address && (
                        <p className="text-xs text-gray-400 mt-1">{log.ip_address}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700 flex items-start gap-3">
        <span className="material-icons text-blue-500">info</span>
        <div>
          <p className="font-medium">About Audit Logs</p>
          <p className="mt-1">
            Audit logs track important system events like user logins, permission changes, and administrative actions.
            Logs are retained for 90 days by default.
          </p>
        </div>
      </div>
    </div>
  );
}
