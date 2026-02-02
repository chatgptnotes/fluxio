'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import PermissionMatrix from '@/components/admin/PermissionMatrix';

interface Pipeline {
  id: string;
  name: string;
  location?: string;
}

interface PipelinePermissions {
  view: boolean;
  reports: boolean;
  alarmAcknowledge: boolean;
  edit: boolean;
}

interface PipelineAccess {
  pipeline_id: string;
  permissions: PipelinePermissions;
}

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_superadmin: boolean;
  is_active: boolean;
  pipelineAccess: PipelineAccess[];
}

export default function UserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, pipelinesRes] = await Promise.all([
          fetch(`/api/admin/users/${resolvedParams.id}`),
          fetch('/api/admin/pipelines'),
        ]);

        const userData = await userRes.json();
        const pipelinesData = await pipelinesRes.json();

        if (!userRes.ok) {
          setError(userData.error || 'Failed to fetch user');
          return;
        }

        setUser(userData.user);
        setPipelines(pipelinesData.pipelines || []);
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
        <p className="mt-4 text-gray-600">Loading permissions...</p>
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
          <span className="text-gray-900">Permissions</span>
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

  // Transform pipeline access for the matrix
  const initialAccess = user.pipelineAccess.map((pa) => ({
    pipelineId: pa.pipeline_id,
    permissions: pa.permissions,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-blue-600">Admin</Link>
        <span className="material-icons text-xs">chevron_right</span>
        <Link href="/admin/users" className="hover:text-blue-600">Users</Link>
        <span className="material-icons text-xs">chevron_right</span>
        <Link href={`/admin/users/${resolvedParams.id}`} className="hover:text-blue-600">
          {user.full_name}
        </Link>
        <span className="material-icons text-xs">chevron_right</span>
        <span className="text-gray-900">Permissions</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <span className="material-icons text-green-600 text-xl">security</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Permissions</h1>
            <p className="text-gray-500 mt-1">
              Configure access for <strong>{user.full_name}</strong> (@{user.username})
            </p>
          </div>
        </div>
        <Link
          href={`/admin/users/${resolvedParams.id}`}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="material-icons text-sm">arrow_back</span>
          Back to User
        </Link>
      </div>

      {/* User Info Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="material-icons text-blue-600">person</span>
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{user.full_name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            user.role === 'admin'
              ? 'bg-red-100 text-red-700'
              : user.role === 'operator'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {user.role}
          </span>
          {user.is_superadmin && (
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
              Superadmin
            </span>
          )}
        </div>
      </div>

      {/* Superadmin Notice */}
      {user.is_superadmin && (
        <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-4 rounded-lg flex items-start gap-3">
          <span className="material-icons">shield</span>
          <div>
            <p className="font-medium">Superadmin Account</p>
            <p className="text-sm mt-1">
              This user has superadmin privileges and automatically has full access to all pipelines
              and features. Individual permissions cannot be modified.
            </p>
          </div>
        </div>
      )}

      {/* Permission Matrix */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Access Matrix</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="material-icons text-xs">info</span>
            {pipelines.length} pipelines available
          </div>
        </div>

        <PermissionMatrix
          userId={resolvedParams.id}
          pipelines={pipelines}
          initialAccess={initialAccess}
          readOnly={user.is_superadmin}
        />
      </div>
    </div>
  );
}
