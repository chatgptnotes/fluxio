'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDateTimeIST } from '@/lib/timezone';

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_superadmin: boolean;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  companies?: {
    name: string;
    code: string;
  } | null;
}

interface UserListProps {
  users: User[];
  onRefresh?: () => void;
}

export default function UserList({ users, onRefresh }: UserListProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleActivate = async (user: User) => {
    if (!confirm(`Are you sure you want to activate ${user.full_name}? They will be able to log in.`)) {
      return;
    }

    setActionId(user.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to activate user');
        return;
      }

      setSuccess(`${user.full_name} has been activated successfully.`);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error activating user:', err);
      setError('Network error');
    } finally {
      setActionId(null);
    }
  };

  const handleDeactivate = async (user: User) => {
    if (!confirm(`Are you sure you want to deactivate ${user.full_name}? They will not be able to log in.`)) {
      return;
    }

    setActionId(user.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to deactivate user');
        return;
      }

      setSuccess(`${user.full_name} has been deactivated.`);
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deactivating user:', err);
      setError('Network error');
    } finally {
      setActionId(null);
    }
  };

  const getRoleBadge = (role: string, isSuperadmin: boolean) => {
    if (isSuperadmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <span className="material-icons text-xs">shield</span>
          Superadmin
        </span>
      );
    }

    const roleColors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      operator: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800',
    };

    const roleIcons: Record<string, string> = {
      admin: 'admin_panel_settings',
      operator: 'engineering',
      viewer: 'visibility',
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleColors[role] || roleColors.viewer}`}>
        <span className="material-icons text-xs">{roleIcons[role] || 'person'}</span>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (user: User) => {
    if (user.is_active) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="material-icons text-xs">check_circle</span>
          Active
        </span>
      );
    }

    // Check if user has never logged in (pending verification)
    if (!user.last_login) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <span className="material-icons text-xs">schedule</span>
          Pending
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <span className="material-icons text-xs">cancel</span>
        Inactive
      </span>
    );
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    return formatDateTimeIST(new Date(date));
  };

  // Separate pending users from others
  const pendingUsers = users.filter(u => !u.is_active && !u.last_login);
  const _otherUsers = users.filter(u => u.is_active || u.last_login);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-icons text-red-500">error</span>
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <span className="material-icons text-red-500 text-sm">close</span>
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-icons text-green-500">check_circle</span>
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto">
            <span className="material-icons text-green-500 text-sm">close</span>
          </button>
        </div>
      )}

      {/* Pending Verification Section */}
      {pendingUsers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-icons text-amber-600">pending_actions</span>
            <h3 className="font-semibold text-amber-900">Pending Verification ({pendingUsers.length})</h3>
          </div>
          <div className="space-y-3">
            {pendingUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="material-icons text-amber-600">person</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                    <div className="text-sm text-gray-500">@{user.username} - {user.email}</div>
                    <div className="text-xs text-gray-400">
                      Registered: {formatDate(user.created_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getRoleBadge(user.role, user.is_superadmin)}
                  <button
                    onClick={() => handleActivate(user)}
                    disabled={actionId === user.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                  >
                    {actionId === user.id ? (
                      <>
                        <span className="material-icons text-sm animate-spin">refresh</span>
                        Activating...
                      </>
                    ) : (
                      <>
                        <span className="material-icons text-sm">check</span>
                        Approve
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeactivate(user)}
                    disabled={actionId === user.id}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                  >
                    <span className="material-icons text-sm">close</span>
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 font-medium text-gray-700">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Company</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Last Login</th>
              <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <span className="material-icons text-4xl mb-2">people_outline</span>
                  <p>No users found</p>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.is_superadmin ? 'bg-purple-100' :
                        user.is_active ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <span className={`material-icons ${
                          user.is_superadmin ? 'text-purple-600' :
                          user.is_active ? 'text-blue-600' : 'text-gray-400'
                        }`}>person</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                        <div className="text-xs text-gray-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {getRoleBadge(user.role, user.is_superadmin)}
                  </td>
                  <td className="px-4 py-3">
                    {user.companies ? (
                      <span className="text-sm text-gray-700">
                        {user.companies.name}
                        <span className="text-gray-400 ml-1">({user.companies.code})</span>
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">No company</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(user)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDate(user.last_login)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit user"
                      >
                        <span className="material-icons text-sm">edit</span>
                      </Link>
                      <Link
                        href={`/admin/users/${user.id}/permissions`}
                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Manage permissions"
                      >
                        <span className="material-icons text-sm">security</span>
                      </Link>
                      {!user.is_superadmin && (
                        <>
                          {user.is_active ? (
                            <button
                              onClick={() => handleDeactivate(user)}
                              disabled={actionId === user.id}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Deactivate user"
                            >
                              <span className="material-icons text-sm">
                                {actionId === user.id ? 'refresh' : 'person_off'}
                              </span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(user)}
                              disabled={actionId === user.id}
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Activate user"
                            >
                              <span className="material-icons text-sm">
                                {actionId === user.id ? 'refresh' : 'person_add'}
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
