// src/app/admin/users/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Search, Plus, Shield, Mail, Phone, Calendar,
  MoreHorizontal, Edit, Ban, CheckCircle, XCircle,
} from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import toast from 'react-hot-toast';
import { useUsers } from '@/hooks/useUsers';
import { formatDate } from '@/utils/formatting';

export default function AdminUsersPage() {
  const { data: users, isLoading } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user: any) => {
      const matchSearch = !searchTerm || 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = !roleFilter || user.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, roleFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
        credentials: 'include',
      });
      toast.success('Status yeniləndi');
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-600" />
              İstifadəçilər
            </h1>
            <p className="text-sm text-gray-500 mt-1">{users?.length || 0} istifadəçi</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Yeni İstifadəçi
          </Button>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              label="Axtarış"
              name="search"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Ad, email..."
              icon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm focus:border-emerald-500 sm:w-48"
            >
              <option value="">Bütün rollar</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Menecer</option>
              <option value="CUSTOMER">Müştəri</option>
              <option value="COURIER">Kuryer</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">İstifadəçi</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Sifarişlər</th>
                  <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Tarix</th>
                  <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                        user.role === 'COURIER' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role === 'ADMIN' ? 'Admin' :
                         user.role === 'MANAGER' ? 'Menecer' :
                         user.role === 'COURIER' ? 'Kuryer' : 'Müştəri'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleToggleStatus(user.id, user.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {user.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.isActive ? 'Aktiv' : 'Deaktiv'}
                      </button>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700">{user.totalOrders || 0}</td>
                    <td className="py-4 px-6 text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
                        <Ban className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>İstifadəçi tapılmadı</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}