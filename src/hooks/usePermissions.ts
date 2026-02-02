'use client';

import { useMemo } from 'react';
import { useAuth } from './useAuth';
import type { SessionUser, PipelinePermissions } from '@/lib/auth/permissions';

export function usePermissions() {
  const { user, isAuthenticated } = useAuth();

  const permissions = useMemo(() => {
    const hasGlobalPermission = (permission: string): boolean => {
      if (!user) return false;
      if (user.isSuperadmin) return true;
      if (user.permissions?.all) return true;
      return !!(user.permissions as Record<string, unknown>)?.[permission];
    };

    const canAccessPipeline = (pipelineId: string): boolean => {
      if (!user) return false;
      if (user.isSuperadmin) return true;
      if (user.permissions?.all) return true;
      if (user.permissions?.canAccessAllPipelines) return true;
      return !!(user.permissions?.pipelines as Record<string, PipelinePermissions>)?.[pipelineId]?.view;
    };

    const hasPipelinePermission = (pipelineId: string, permission: keyof PipelinePermissions): boolean => {
      if (!user) return false;
      if (user.isSuperadmin) return true;
      if (user.permissions?.all) return true;
      const pipelinePerms = (user.permissions?.pipelines as Record<string, PipelinePermissions>)?.[pipelineId];
      return !!pipelinePerms?.[permission];
    };

    const canCreateUsers = (): boolean => {
      return hasGlobalPermission('canCreateUsers');
    };

    const canManagePermissions = (): boolean => {
      return hasGlobalPermission('canManagePermissions');
    };

    const canGenerateReports = (pipelineId: string): boolean => {
      return hasPipelinePermission(pipelineId, 'reports');
    };

    const canAcknowledgeAlarms = (pipelineId: string): boolean => {
      return hasPipelinePermission(pipelineId, 'alarmAcknowledge');
    };

    const canEditPipeline = (pipelineId: string): boolean => {
      return hasPipelinePermission(pipelineId, 'edit');
    };

    const getAccessiblePipelines = (): string[] => {
      if (!user) return [];
      if (user.isSuperadmin || user.permissions?.all || user.permissions?.canAccessAllPipelines) {
        return ['*']; // Indicates all pipelines
      }
      return Object.keys((user.permissions?.pipelines as Record<string, PipelinePermissions>) || {});
    };

    return {
      user,
      isAuthenticated,
      isSuperadmin: user?.isSuperadmin ?? false,
      hasGlobalPermission,
      canAccessPipeline,
      hasPipelinePermission,
      canCreateUsers,
      canManagePermissions,
      canGenerateReports,
      canAcknowledgeAlarms,
      canEditPipeline,
      getAccessiblePipelines,
    };
  }, [user, isAuthenticated]);

  return permissions;
}

export function useRequirePermission(
  permission: string | { pipeline: string; permission: keyof PipelinePermissions }
) {
  const { user, isAuthenticated, hasGlobalPermission, hasPipelinePermission } = usePermissions();

  const hasPermission = useMemo(() => {
    if (!isAuthenticated) return false;

    if (typeof permission === 'string') {
      return hasGlobalPermission(permission);
    }

    return hasPipelinePermission(permission.pipeline, permission.permission);
  }, [isAuthenticated, permission, hasGlobalPermission, hasPipelinePermission]);

  return {
    hasPermission,
    isAuthenticated,
    user,
  };
}

export function useRequireAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return {
    user,
    isAuthenticated,
    isLoading,
    requiresLogin: !isLoading && !isAuthenticated,
  };
}
