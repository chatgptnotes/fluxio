'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  requireSuperadmin?: boolean;
  requireAdmin?: boolean;
  fallbackUrl?: string;
}

export default function AuthGuard({
  children,
  requireSuperadmin = false,
  requireAdmin = false,
  fallbackUrl = '/login',
}: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(fallbackUrl);
      return;
    }

    if (requireSuperadmin && !user?.isSuperadmin) {
      router.push('/unauthorized');
      return;
    }

    if (requireAdmin && user?.role !== 'admin' && !user?.isSuperadmin) {
      router.push('/unauthorized');
      return;
    }
  }, [isLoading, isAuthenticated, user, requireSuperadmin, requireAdmin, router, fallbackUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireSuperadmin && !user?.isSuperadmin) {
    return null;
  }

  if (requireAdmin && user?.role !== 'admin' && !user?.isSuperadmin) {
    return null;
  }

  return <>{children}</>;
}
