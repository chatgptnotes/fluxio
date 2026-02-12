import { createClient } from '@/lib/supabase/server';

export interface PipelinePermissions {
  view: boolean;
  reports: boolean;
  alarmAcknowledge: boolean;
  edit: boolean;
}

export interface UserPermissions {
  all?: boolean;
  canCreateUsers?: boolean;
  canManagePermissions?: boolean;
  canAccessAllPipelines?: boolean;
  canAccessReadings?: boolean;
  pipelines?: Record<string, PipelinePermissions>;
}

export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'operator' | 'viewer';
  is_superadmin: boolean;
  company_id: string | null;
  permissions: UserPermissions;
  is_active: boolean;
}

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'operator' | 'viewer';
  isSuperadmin: boolean;
  companyId: string | null;
  permissions: UserPermissions;
}

/**
 * Check if a user has a specific global permission
 */
export function hasGlobalPermission(
  user: SessionUser | null,
  permission: keyof UserPermissions
): boolean {
  if (!user) return false;
  if (user.isSuperadmin) return true;
  if (user.permissions?.all) return true;
  return !!user.permissions?.[permission];
}

/**
 * Check if a user can access a specific pipeline
 */
export function canAccessPipeline(
  user: SessionUser | null,
  pipelineId: string
): boolean {
  if (!user) return false;
  if (user.isSuperadmin) return true;
  if (user.permissions?.all) return true;
  if (user.permissions?.canAccessAllPipelines) return true;
  return !!user.permissions?.pipelines?.[pipelineId]?.view;
}

/**
 * Check if a user has a specific permission for a pipeline
 */
export function hasPipelinePermission(
  user: SessionUser | null,
  pipelineId: string,
  permission: keyof PipelinePermissions
): boolean {
  if (!user) return false;
  if (user.isSuperadmin) return true;
  if (user.permissions?.all) return true;
  return !!user.permissions?.pipelines?.[pipelineId]?.[permission];
}

/**
 * Check if a user can create other users
 */
export function canCreateUsers(user: SessionUser | null): boolean {
  return hasGlobalPermission(user, 'canCreateUsers');
}

/**
 * Check if a user can manage permissions
 */
export function canManagePermissions(user: SessionUser | null): boolean {
  return hasGlobalPermission(user, 'canManagePermissions');
}

/**
 * Check if a user can access CSTPS readings page
 */
export function canAccessReadings(user: SessionUser | null): boolean {
  return hasGlobalPermission(user, 'canAccessReadings');
}

/**
 * Check if a user can generate reports for a pipeline
 */
export function canGenerateReports(
  user: SessionUser | null,
  pipelineId: string
): boolean {
  return hasPipelinePermission(user, pipelineId, 'reports');
}

/**
 * Check if a user can acknowledge alarms for a pipeline
 */
export function canAcknowledgeAlarms(
  user: SessionUser | null,
  pipelineId: string
): boolean {
  return hasPipelinePermission(user, pipelineId, 'alarmAcknowledge');
}

/**
 * Check if a user can edit pipeline settings
 */
export function canEditPipeline(
  user: SessionUser | null,
  pipelineId: string
): boolean {
  return hasPipelinePermission(user, pipelineId, 'edit');
}

/**
 * Get user's pipeline permissions from database
 */
export async function getUserPipelinePermissions(
  userId: string
): Promise<Record<string, PipelinePermissions>> {
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('user_pipeline_access')
    .select('pipeline_id, permissions')
    .eq('user_id', userId);

  if (error || !data) {
    console.error('Error fetching user pipeline permissions:', error);
    return {};
  }

  const permissions: Record<string, PipelinePermissions> = {};
  for (const row of data) {
    permissions[row.pipeline_id] = row.permissions as PipelinePermissions;
  }

  return permissions;
}

/**
 * Get all accessible pipelines for a user
 */
export async function getAccessiblePipelines(
  user: SessionUser
): Promise<string[]> {
  if (user.isSuperadmin || user.permissions?.all || user.permissions?.canAccessAllPipelines) {
    const supabase = createClient();
    const { data } = await supabase.from('devices').select('device_id');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data?.map((d: any) => d.device_id) || [];
  }

  return Object.keys(user.permissions?.pipelines || {});
}

/**
 * Build a complete SessionUser with pipeline permissions
 */
export async function buildSessionUser(dbUser: User): Promise<SessionUser> {
  const pipelinePermissions = dbUser.is_superadmin
    ? {}
    : await getUserPipelinePermissions(dbUser.id);

  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    fullName: dbUser.full_name,
    role: dbUser.role,
    isSuperadmin: dbUser.is_superadmin,
    companyId: dbUser.company_id,
    permissions: {
      ...dbUser.permissions,
      pipelines: pipelinePermissions,
    },
  };
}

/**
 * Permission levels for UI display
 */
export const PERMISSION_LEVELS = [
  {
    id: 'view',
    name: 'View Only',
    description: 'Can view pipeline data and dashboards',
    permissions: { view: true, reports: false, alarmAcknowledge: false, edit: false },
  },
  {
    id: 'reports',
    name: 'Report Generation',
    description: 'Can view and generate reports',
    permissions: { view: true, reports: true, alarmAcknowledge: false, edit: false },
  },
  {
    id: 'alarms',
    name: 'Alarm Management',
    description: 'Can view, generate reports, and acknowledge alarms',
    permissions: { view: true, reports: true, alarmAcknowledge: true, edit: false },
  },
  {
    id: 'full',
    name: 'Full Access',
    description: 'Full access to all pipeline features',
    permissions: { view: true, reports: true, alarmAcknowledge: true, edit: true },
  },
];
