'use client';

import { useState, useEffect } from 'react';

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
  pipelineId: string;
  permissions: PipelinePermissions;
}

interface PermissionMatrixProps {
  userId: string;
  pipelines: Pipeline[];
  initialAccess?: PipelineAccess[];
  onSave?: (access: PipelineAccess[]) => void;
  readOnly?: boolean;
}

const defaultPermissions: PipelinePermissions = {
  view: false,
  reports: false,
  alarmAcknowledge: false,
  edit: false,
};

const permissionLabels = {
  view: { label: 'View', icon: 'visibility', description: 'View pipeline data' },
  reports: { label: 'Reports', icon: 'description', description: 'Generate reports' },
  alarmAcknowledge: { label: 'Alarms', icon: 'notifications', description: 'Acknowledge alarms' },
  edit: { label: 'Edit', icon: 'edit', description: 'Edit settings' },
};

export default function PermissionMatrix({
  userId,
  pipelines,
  initialAccess = [],
  onSave,
  readOnly = false,
}: PermissionMatrixProps) {
  const [access, setAccess] = useState<Record<string, PipelinePermissions>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const accessMap: Record<string, PipelinePermissions> = {};
    for (const a of initialAccess) {
      accessMap[a.pipelineId] = a.permissions;
    }
    setAccess(accessMap);
  }, [initialAccess]);

  const togglePermission = (pipelineId: string, permission: keyof PipelinePermissions) => {
    if (readOnly) return;

    setAccess((prev) => {
      const current = prev[pipelineId] || { ...defaultPermissions };
      const newValue = !current[permission];

      // If enabling a higher permission, enable lower ones too
      const newPermissions = { ...current, [permission]: newValue };

      if (permission === 'edit' && newValue) {
        newPermissions.view = true;
        newPermissions.reports = true;
        newPermissions.alarmAcknowledge = true;
      } else if (permission === 'alarmAcknowledge' && newValue) {
        newPermissions.view = true;
        newPermissions.reports = true;
      } else if (permission === 'reports' && newValue) {
        newPermissions.view = true;
      }

      // If disabling a lower permission, disable higher ones too
      if (permission === 'view' && !newValue) {
        newPermissions.reports = false;
        newPermissions.alarmAcknowledge = false;
        newPermissions.edit = false;
      } else if (permission === 'reports' && !newValue) {
        newPermissions.alarmAcknowledge = false;
        newPermissions.edit = false;
      } else if (permission === 'alarmAcknowledge' && !newValue) {
        newPermissions.edit = false;
      }

      return { ...prev, [pipelineId]: newPermissions };
    });
  };

  const setAllForPipeline = (pipelineId: string, level: 'none' | 'view' | 'reports' | 'alarms' | 'full') => {
    if (readOnly) return;

    const perms: PipelinePermissions = {
      view: level !== 'none',
      reports: level === 'reports' || level === 'alarms' || level === 'full',
      alarmAcknowledge: level === 'alarms' || level === 'full',
      edit: level === 'full',
    };

    setAccess((prev) => ({ ...prev, [pipelineId]: perms }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const pipelinesWithAccess = Object.entries(access)
        .filter(([, perms]) => perms.view)
        .map(([pipelineId, permissions]) => ({
          pipelineId,
          permissions,
        }));

      const response = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipelines: pipelinesWithAccess }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update permissions');
        return;
      }

      setSuccess('Permissions saved successfully');

      if (onSave) {
        onSave(pipelinesWithAccess);
      }
    } catch (err) {
      console.error('Error saving permissions:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-icons text-red-500">error</span>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-icons text-green-500">check_circle</span>
          {success}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 border-b font-medium text-gray-700">Pipeline</th>
              {Object.entries(permissionLabels).map(([key, { label, icon, description }]) => (
                <th key={key} className="px-4 py-3 border-b text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="material-icons text-gray-500">{icon}</span>
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                    <span className="text-xs text-gray-400">{description}</span>
                  </div>
                </th>
              ))}
              {!readOnly && <th className="px-4 py-3 border-b text-center font-medium text-gray-700">Quick Set</th>}
            </tr>
          </thead>
          <tbody>
            {pipelines.map((pipeline) => {
              const perms = access[pipeline.id] || defaultPermissions;
              return (
                <tr key={pipeline.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border-b">
                    <div>
                      <div className="font-medium text-gray-900">{pipeline.name}</div>
                      {pipeline.location && (
                        <div className="text-xs text-gray-500">{pipeline.location}</div>
                      )}
                    </div>
                  </td>
                  {(Object.keys(permissionLabels) as Array<keyof PipelinePermissions>).map((key) => (
                    <td key={key} className="px-4 py-3 border-b text-center">
                      <button
                        type="button"
                        onClick={() => togglePermission(pipeline.id, key)}
                        disabled={readOnly}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          perms[key]
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        } ${readOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="material-icons text-sm">
                          {perms[key] ? 'check' : 'close'}
                        </span>
                      </button>
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="px-4 py-3 border-b">
                      <select
                        value={
                          perms.edit
                            ? 'full'
                            : perms.alarmAcknowledge
                            ? 'alarms'
                            : perms.reports
                            ? 'reports'
                            : perms.view
                            ? 'view'
                            : 'none'
                        }
                        onChange={(e) => setAllForPipeline(pipeline.id, e.target.value as 'none' | 'view' | 'reports' | 'alarms' | 'full')}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="none">No Access</option>
                        <option value="view">View Only</option>
                        <option value="reports">+ Reports</option>
                        <option value="alarms">+ Alarms</option>
                        <option value="full">Full Access</option>
                      </select>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="material-icons animate-spin">refresh</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-icons">save</span>
                Save Permissions
              </>
            )}
          </button>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Permission Levels:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="material-icons text-gray-400 text-sm">visibility</span>
            <span><strong>View:</strong> See dashboard and data</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-icons text-gray-400 text-sm">description</span>
            <span><strong>Reports:</strong> Generate and download reports</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-icons text-gray-400 text-sm">notifications</span>
            <span><strong>Alarms:</strong> Acknowledge and dismiss alarms</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-icons text-gray-400 text-sm">edit</span>
            <span><strong>Edit:</strong> Modify pipeline settings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
