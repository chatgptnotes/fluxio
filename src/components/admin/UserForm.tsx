'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  code: string;
}

interface UserFormProps {
  user?: {
    id: string;
    username: string;
    email: string;
    full_name: string;
    role: string;
    company_id: string | null;
    is_active: boolean;
  };
  companies: Company[];
  onSuccess?: () => void;
}

export default function UserForm({ user, companies, onSuccess }: UserFormProps) {
  const router = useRouter();
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    fullName: user?.full_name || '',
    role: user?.role || 'viewer',
    companyId: user?.company_id || '',
    isActive: user?.is_active ?? true,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match for new users
    if (!isEditing && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate required fields
    if (!isEditing && !formData.password) {
      setError('Password is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        companyId: formData.companyId || null,
      };

      if (!isEditing) {
        payload.username = formData.username;
        payload.password = formData.password;
      } else {
        if (formData.password) {
          payload.password = formData.password;
        }
        payload.isActive = formData.isActive;
      }

      const url = isEditing ? `/api/admin/users/${user.id}` : '/api/admin/users';
      const method = isEditing ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save user');
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/admin/users');
      }
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-icons text-red-500">error</span>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Username - only for new users */}
        {!isEditing && (
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              pattern="^[a-zA-Z0-9_]+$"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter username"
            />
            <p className="text-xs text-gray-500 mt-1">Letters, numbers, and underscores only</p>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="user@example.com"
          />
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="John Doe"
          />
        </div>

        {/* Role */}
        <div className="md:col-span-2">
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                value: 'viewer',
                label: 'Viewer',
                icon: 'visibility',
                description: 'Can view dashboards and data. Read-only access.',
                color: 'gray',
              },
              {
                value: 'operator',
                label: 'Operator',
                icon: 'engineering',
                description: 'Can view data, acknowledge alarms, and generate reports.',
                color: 'blue',
              },
              {
                value: 'admin',
                label: 'Admin',
                icon: 'admin_panel_settings',
                description: 'Full access to all features including user management.',
                color: 'red',
              },
            ].map((role) => (
              <label
                key={role.value}
                className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                  formData.role === role.value
                    ? `border-${role.color}-500 bg-${role.color}-50 ring-2 ring-${role.color}-500`
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={formData.role === role.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={`material-icons text-lg ${
                      formData.role === role.value ? `text-${role.color}-600` : 'text-gray-400'
                    }`}>
                      {role.icon}
                    </span>
                    <span className={`font-medium ${
                      formData.role === role.value ? 'text-gray-900' : 'text-gray-700'
                    }`}>
                      {role.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{role.description}</p>
                </div>
                {formData.role === role.value && (
                  <span className={`material-icons absolute top-2 right-2 text-${role.color}-600`}>
                    check_circle
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <select
            id="companyId"
            name="companyId"
            value={formData.companyId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No Company</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name} ({company.code})
              </option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            {isEditing ? 'New Password (leave blank to keep current)' : 'Password'}
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required={!isEditing}
            minLength={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required={!isEditing && !!formData.password}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm password"
          />
        </div>

        {/* Active Status - only for editing */}
        {isEditing && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              User is active
            </label>
          </div>
        )}
      </div>

      {/* Password Requirements */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
        <ul className="text-xs text-gray-600 space-y-1">
          <li className="flex items-center gap-1">
            <span className="material-icons text-xs">check_circle</span>
            At least 8 characters
          </li>
          <li className="flex items-center gap-1">
            <span className="material-icons text-xs">check_circle</span>
            One uppercase letter
          </li>
          <li className="flex items-center gap-1">
            <span className="material-icons text-xs">check_circle</span>
            One lowercase letter
          </li>
          <li className="flex items-center gap-1">
            <span className="material-icons text-xs">check_circle</span>
            One number
          </li>
          <li className="flex items-center gap-1">
            <span className="material-icons text-xs">check_circle</span>
            One special character (!@#$%^&* etc.)
          </li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="material-icons animate-spin">refresh</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-icons">save</span>
              {isEditing ? 'Update User' : 'Create User'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
