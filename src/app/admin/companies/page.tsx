'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import CompanySettingsModal from '@/components/admin/CompanySettingsModal';

interface Company {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settingsModal, setSettingsModal] = useState<{ isOpen: boolean; companyId: string; companyName: string }>({
    isOpen: false,
    companyId: '',
    companyName: '',
  });

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/companies');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to fetch companies');
        return;
      }

      setCompanies(data.companies || []);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create company');
        return;
      }

      setShowForm(false);
      setFormData({ name: '', code: '', description: '' });
      fetchCompanies();
    } catch (err) {
      console.error('Error creating company:', err);
      setError('Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 mt-1">Manage company accounts</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="material-icons text-sm">{showForm ? 'close' : 'add_business'}</span>
          {showForm ? 'Cancel' : 'Add Company'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <span className="material-icons text-red-500">error</span>
          {error}
        </div>
      )}

      {/* Add Company Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Company</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  pattern="^[A-Z0-9_]+$"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                  placeholder="ACME"
                />
                <p className="text-xs text-gray-500 mt-1">Uppercase letters, numbers, and underscores only</p>
              </div>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the company..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-icons animate-spin text-sm">refresh</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <span className="material-icons text-sm">add</span>
                    Create Company
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Companies List */}
      <div className="bg-white rounded-xl shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center">
            <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
            <p className="mt-4 text-gray-600">Loading companies...</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center">
            <span className="material-icons text-gray-400 text-4xl">business</span>
            <p className="mt-4 text-gray-600">No companies found</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-blue-600 hover:underline flex items-center gap-1 mx-auto"
            >
              <span className="material-icons text-sm">add</span>
              Add your first company
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-700">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Code</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Created</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <span className="material-icons text-purple-600">business</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{company.name}</p>
                        {company.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{company.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">{company.code}</code>
                  </td>
                  <td className="px-4 py-3">
                    {company.is_active ? (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <span className="material-icons text-xs">check_circle</span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-600">
                        <span className="material-icons text-xs">cancel</span>
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSettingsModal({ isOpen: true, companyId: company.id, companyName: company.name })}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                        title="Company Settings"
                      >
                        <span className="material-icons text-sm">settings</span>
                        Settings
                      </button>
                      <Link
                        href={`/company/${company.code.toLowerCase()}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm hover:bg-primary-200 transition-colors"
                      >
                        <span className="material-icons text-sm">dashboard</span>
                        Dashboard
                      </Link>
                      <Link
                        href={`/admin/users?companyId=${company.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                      >
                        <span className="material-icons text-sm">people</span>
                        Users
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Company Settings Modal */}
      <CompanySettingsModal
        isOpen={settingsModal.isOpen}
        onClose={() => setSettingsModal({ isOpen: false, companyId: '', companyName: '' })}
        companyId={settingsModal.companyId}
        companyName={settingsModal.companyName}
      />
    </div>
  );
}
