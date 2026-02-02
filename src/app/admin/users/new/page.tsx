'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import UserForm from '@/components/admin/UserForm';

interface Company {
  id: string;
  name: string;
  code: string;
}

export default function NewUserPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/admin/companies');
        const data = await response.json();
        if (response.ok) {
          setCompanies(data.companies || []);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin" className="hover:text-blue-600">
          Admin
        </Link>
        <span className="material-icons text-xs">chevron_right</span>
        <Link href="/admin/users" className="hover:text-blue-600">
          Users
        </Link>
        <span className="material-icons text-xs">chevron_right</span>
        <span className="text-gray-900">New User</span>
      </nav>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
        <p className="text-gray-500 mt-1">Add a new user to the system</p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <span className="material-icons text-blue-600 text-4xl animate-spin">refresh</span>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <UserForm companies={companies} />
        )}
      </div>
    </div>
  );
}
