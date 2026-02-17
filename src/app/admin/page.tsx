'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/usePermissions';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  totalPipelines: number;
}

export default function AdminDashboard() {
  const { user, isSuperadmin } = usePermissions();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalCompanies: 0,
    totalPipelines: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, companiesRes, pipelinesRes] = await Promise.all([
          fetch('/api/admin/users?includeInactive=true'),
          fetch('/api/admin/companies'),
          fetch('/api/admin/pipelines'),
        ]);

        const users = usersRes.ok ? await usersRes.json() : { users: [] };
        const companies = companiesRes.ok ? await companiesRes.json() : { companies: [] };
        const pipelines = pipelinesRes.ok ? await pipelinesRes.json() : { pipelines: [] };

        setStats({
          totalUsers: users.users?.length || 0,
          activeUsers: users.users?.filter((u: { is_active: boolean }) => u.is_active).length || 0,
          totalCompanies: companies.companies?.length || 0,
          totalPipelines: pipelines.pipelines?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: 'people',
      color: 'blue',
      href: '/admin/users',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: 'person_check',
      color: 'green',
      href: '/admin/users',
    },
    {
      title: 'Companies',
      value: stats.totalCompanies,
      icon: 'business',
      color: 'purple',
      href: '/admin/companies',
    },
    {
      title: 'Pipelines',
      value: stats.totalPipelines,
      icon: 'water',
      color: 'cyan',
      href: '/admin/pipelines',
    },
  ];

  const quickActions = [
    {
      title: 'Create User',
      description: 'Add a new user to the system',
      icon: 'person_add',
      href: '/admin/users/new',
      color: 'blue',
    },
    {
      title: 'Manage Permissions',
      description: 'Configure user access to pipelines',
      icon: 'security',
      href: '/admin/users',
      color: 'green',
    },
    {
      title: 'View Audit Logs',
      description: 'Review system activity',
      icon: 'history',
      href: '/admin/audit',
      color: 'orange',
    },
    {
      title: 'Add Company',
      description: 'Register a new company',
      icon: 'add_business',
      href: '/admin/companies/new',
      color: 'purple',
    },
    {
      title: 'Remote Shell',
      description: 'Execute commands on TRB246 gateway',
      icon: 'terminal',
      href: '/admin/remote',
      color: 'cyan',
    },
  ];

  const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-200' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', border: 'border-cyan-200' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-200' },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.fullName}
            {isSuperadmin && (
              <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                Superadmin
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="material-icons text-sm">person_add</span>
          Add User
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const colors = colorClasses[stat.color];
          return (
            <Link
              key={stat.title}
              href={stat.href}
              className={`${colors.bg} border ${colors.border} rounded-xl p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {isLoading ? (
                      <span className="material-icons animate-spin text-2xl">refresh</span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center`}>
                  <span className={`material-icons text-2xl ${colors.icon}`}>{stat.icon}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const colors = colorClasses[action.color];
            return (
              <Link
                key={action.title}
                href={action.href}
                className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <span className={`material-icons ${colors.icon}`}>{action.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <span className="material-icons text-green-600">check_circle</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">System Status</p>
              <p className="font-medium text-green-600">Operational</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="material-icons text-blue-600">dns</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Database</p>
              <p className="font-medium text-gray-900">Supabase (PostgreSQL)</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <span className="material-icons text-purple-600">code</span>
            </div>
            <div>
              <p className="text-sm text-gray-500">Version</p>
              <p className="font-medium text-gray-900">1.3</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
