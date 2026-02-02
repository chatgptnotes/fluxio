'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import UserForm from '@/components/admin/UserForm';

interface Company {
  id: string;
  name: string;
  code: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  company_id: string | null;
  is_active: boolean;
  is_superadmin: boolean;
  last_login: string | null;
  created_at: string;
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, companiesRes] = await Promise.all([
          fetch(`/api/admin/users/${resolvedParams.id}`),
          fetch('/api/admin/companies'),
        ]);

        const userData = await userRes.json();
        const companiesData = await companiesRes.json();

        if (!userRes.ok) {
          setError(userData.error || 'Failed to fetch user');
          return;
        }

        setUser(userData.user);
        setCompanies(companiesData.companies || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
        <p className="mt-4 text-gray-600">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/admin" className="hover:text-blue-600">Admin</Link>
          <span className="material-icons text-xs">chevron_right</span>
          <Link href="/admin/users" className="hover:text-blue-600">Users</Link>
          <span className="material-icons text-xs">chevron_right</span>
          <span className="text-gray-900">Edit User</span>
        </nav>

        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-8 rounded-lg text-center">
          <span className="material-icons text-red-500 text-4xl">error</span>
          <p className="mt-4">{error}</p>
          <Link href="/admin/users" className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:underline">
            <span className="material-icons text-sm">arrow_back</span>
            Back to users
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-blue-600">Admin</Link>
        <span className="material-icons text-xs">chevron_right</span>
        <Link href="/admin/users" className="hover:text-blue-600">Users</Link>
        <span className="material-icons text-xs">chevron_right</span>
        <span className="text-gray-900">{user.full_name}</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="material-icons text-blue-600 text-3xl">person</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500">@{user.username}</span>
              {user.is_superadmin && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Superadmin
                </span>
              )}
              {!user.is_active && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                  Inactive
                </span>
              )}
            </div>
          </div>
        </div>
        <Link
          href={`/admin/users/${resolvedParams.id}/permissions`}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="material-icons text-sm">security</span>
          Manage Permissions
        </Link>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Email</p>
          <p className="font-medium text-gray-900">{user.email}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Role</p>
          <p className="font-medium text-gray-900 capitalize">{user.role}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Last Login</p>
          <p className="font-medium text-gray-900">
            {user.last_login
              ? new Date(user.last_login).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Never'}
          </p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Created</p>
          <p className="font-medium text-gray-900">
            {new Date(user.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User Details</h2>
        {user.is_superadmin ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <span className="material-icons">warning</span>
            Superadmin account cannot be edited through this interface.
          </div>
        ) : (
          <UserForm user={user} companies={companies} />
        )}
      </div>
    </div>
  );
}
