'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/pipelines', label: 'Pipelines', icon: 'water' },
  { href: '/admin/users', label: 'Users', icon: 'people' },
  { href: '/admin/companies', label: 'Companies', icon: 'business' },
  { href: '/admin/email-logs', label: 'Email Logs', icon: 'mail' },
  { href: '/admin/audit', label: 'Audit Logs', icon: 'history' },
  { href: '/admin/infographics', label: 'Infographics', icon: 'auto_awesome' },
];

function AdminNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-blue-600">
                <span className="material-icons">water_drop</span>
                <span className="font-bold text-xl">FlowNexus</span>
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600 font-medium">Admin Panel</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="material-icons text-purple-600">shield</span>
                <span>{user?.fullName}</span>
                {user?.isSuperadmin && (
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                    Superadmin
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
              >
                <span className="material-icons text-sm">logout</span>
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-64px)] border-r">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="material-icons text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Links */}
          <div className="p-4 border-t">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Quick Links</p>
            <div className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1"
              >
                <span className="material-icons text-sm">speed</span>
                Main Dashboard
              </Link>
              <Link
                href="/cstps-pipeline/1"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1"
              >
                <span className="material-icons text-sm">analytics</span>
                CSTPS Pipelines
              </Link>
              <Link
                href="/cstps-pipeline/readings"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1"
              >
                <span className="material-icons text-sm">sensors</span>
                CSTPS Readings
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Content will be rendered here */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-gray-100">
        {/* Top Header */}
        <AdminHeader />

        <div className="flex">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
              {children}
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t py-4 px-6">
          <p className="text-center text-xs text-gray-400">
            FlowNexus v1.4 | February 2, 2026 | flownexus
          </p>
        </footer>
      </div>
    </AuthGuard>
  );
}

function AdminHeader() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-blue-600">
              <span className="material-icons">water_drop</span>
              <span className="font-bold text-xl">FlowNexus</span>
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600 font-medium">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="material-icons text-purple-600">shield</span>
              <span>{user?.fullName}</span>
              {user?.isSuperadmin && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                  Superadmin
                </span>
              )}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors"
            >
              <span className="material-icons text-sm">logout</span>
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-64px)] border-r">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="material-icons text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Quick Links */}
      <div className="p-4 border-t">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Quick Links</p>
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1"
          >
            <span className="material-icons text-sm">speed</span>
            Main Dashboard
          </Link>
          <Link
            href="/cstps-pipeline/1"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1"
          >
            <span className="material-icons text-sm">analytics</span>
            CSTPS Pipelines
          </Link>
          <Link
            href="/cstps-pipeline/readings"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 py-1"
          >
            <span className="material-icons text-sm">sensors</span>
            CSTPS Readings
          </Link>
        </div>
      </div>
    </aside>
  );
}
