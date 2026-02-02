'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import UserList from '@/components/admin/UserList';

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/users?includeInactive=${showInactive}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch users');
        return;
      }

      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, [showInactive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.full_name.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage user accounts and permissions</p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="material-icons text-sm">person_add</span>
          Add User
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, username, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Show Inactive Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showInactive"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showInactive" className="text-sm text-gray-700">
              Show inactive users
            </label>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className={`material-icons text-sm ${isLoading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-icons text-red-500">error</span>
          {error}
        </div>
      )}

      {/* Users List */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm">
          <UserList users={filteredUsers} onRefresh={fetchUsers} />
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex items-center gap-4">
          <span>
            Showing {filteredUsers.length} of {users.length} users
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <span className="material-icons text-xs">close</span>
              Clear search
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
