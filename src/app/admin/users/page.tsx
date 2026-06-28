// src/app/admin/users/page.tsx
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Plus,
  Shield,
  ShieldAlert,
  Calendar,
  Download,
  RefreshCw,
  UserPlus,
  X,
  CheckCircle,
} from 'lucide-react';

import { User, FilterState, UserFormData, UserRole, UserStatus } from '@/types/user';
import { Button } from '@/components/admin/users/Button';
import { Input } from '@/components/admin/users/Input';
import { Select } from '@/components/admin/users/Select';
import { UserForm } from '@/components/admin/users/UserForm';
import { UserCard } from '@/components/admin/users/UserCard';
import { ToastProvider, useToast } from '@/components/admin/users/useToast';


function AdminUsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    role: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);
  
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    blocked: 0,
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search: debouncedSearchTerm,
        role: filters.role,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: '1',
        limit: '50',
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      setUsers(data.users || []);
      setStatistics(data.statistics || { total: 0, active: 0, blocked: 0 });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, filters.role, filters.status, filters.sortBy, filters.sortOrder]);
  
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Filtered users
  const filteredUsers = useMemo(() => {
    return users;
  }, [users]);
  
  // Handle user selection
  const handleSelectUser = useCallback((id: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  }, []);
  
  const handleSelectAll = useCallback(() => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
      setShowBulkActions(true);
    }
  }, [selectedUsers.size, filteredUsers]);
  
  // User actions
  const handleEdit = useCallback((user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  }, []);
  
  const handleBlock = useCallback(async (user: User) => {
    try {
      await fetch(`/api/admin/users/${user.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: true, blockedReason: 'Admin tərəfindən bloklanıb' }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  }, [fetchUsers]);
  
  const handleUnblock = useCallback(async (user: User) => {
    try {
      await fetch(`/api/admin/users/${user.id}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isBlocked: false }),
      });
      fetchUsers();
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  }, [fetchUsers]);
  
  const handleDelete = useCallback(async (user: User) => {
    if (!confirm('Bu istifadəçini silmək istədiyinizə əminsiniz?')) return;
    
    try {
      await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      addToast('success', 'İstifadəçi uğurla silindi');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      addToast('error', 'İstifadəçini silmək mümkün olmadı');
    }
  }, [fetchUsers, addToast]);
  
  // Bulk actions
  const handleBulkBlock = useCallback(async () => {
    try {
      await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block',
          userIds: Array.from(selectedUsers),
          data: { reason: 'Toplu bloklama' },
        }),
      });
      addToast('success', `${selectedUsers.size} istifadəçi bloklandı`);
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk blocking users:', error);
      addToast('error', 'Toplu bloklama mümkün olmadı');
    }
  }, [selectedUsers, fetchUsers, addToast]);
  
  const handleBulkUnblock = useCallback(async () => {
    try {
      await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'unblock',
          userIds: Array.from(selectedUsers),
        }),
      });
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk unblocking users:', error);
    }
  }, [selectedUsers, fetchUsers]);
  
  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`${selectedUsers.size} istifadəçini silmək istədiyinizə əminsiniz?`)) return;
    
    try {
      await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userIds: Array.from(selectedUsers),
        }),
      });
      addToast('success', `${selectedUsers.size} istifadəçi silindi`);
      setSelectedUsers(new Set());
      setShowBulkActions(false);
      fetchUsers();
    } catch (error) {
      console.error('Error bulk deleting users:', error);
      addToast('error', 'Toplu silmə mümkün olmadı');
    }
  }, [selectedUsers, fetchUsers, addToast]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              <Users className="h-4 w-4" />
              Admin · İstifadəçilər
            </div>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-slate-900 md:text-3xl">
              <Shield className="h-7 w-7 text-emerald-600" />
              İstifadəçi İdarəetməsi
            </h1>
          </div>
          
          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-inner">
              Cəmi: <span className="font-bold">{statistics.total}</span> ·
              Aktiv: <span className="font-bold">{statistics.active}</span> ·
              Bloklanmış: <span className="font-bold">{statistics.blocked}</span>
            </div>
            <Button onClick={() => setShowCreateModal(true)} icon={Plus}>
              Yeni İstifadəçi
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 pb-24 pt-4 md:px-6 md:pt-6">
        {/* Filters */}
        <section className="mb-6 rounded-3xl border border-emerald-100 bg-white/85 p-4 shadow-xl shadow-emerald-50 backdrop-blur-md md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Input
              label="İstifadəçi axtarışı"
              value={filters.searchTerm}
              onChange={(value) => setFilters(prev => ({ ...prev, searchTerm: value }))}
              placeholder="Email, telefon, ad və ya soyad..."
              icon={Search}
              className="flex-1"
            />
            
            <Select
              label="Rol"
              value={filters.role}
              onChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
              options={[
                { value: '', label: 'Bütün rollar' },
                { value: 'CUSTOMER', label: 'Müştəri' },
                { value: 'COURIER', label: 'Kuryer' },
                { value: 'WAREHOUSE_STAFF', label: 'Anbar işçisi' },
                { value: 'MANAGER', label: 'Menecer' },
                { value: 'ADMIN', label: 'Admin' },
              ]}
              icon={Shield}
              className="w-full md:w-48"
            />
            
            <Select
              label="Status"
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value as UserStatus }))}
              options={[
                { value: 'all', label: 'Bütün statuslar' },
                { value: 'active', label: 'Aktiv' },
                { value: 'blocked', label: 'Bloklanmış' },
              ]}
              icon={Filter}
              className="w-full md:w-48"
            />
          </div>
          
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-emerald-100 pt-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600"
              />
              <span className="text-xs text-slate-600">
                Hamısını seç ({selectedUsers.size}/{filteredUsers.length})
              </span>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={fetchUsers} icon={RefreshCw} size="sm">
                Yenilə
              </Button>
              <Button variant="ghost" icon={Download} size="sm">
                Export
              </Button>
            </div>
          </div>
        </section>
        
        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-lg"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                  <CheckCircle className="h-4 w-4" />
                  {selectedUsers.size} istifadəçi seçilib
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="danger" onClick={handleBulkBlock} icon={Lock} size="sm">
                    Blokla
                  </Button>
                  <Button variant="secondary" onClick={handleBulkUnblock} icon={Unlock} size="sm">
                    Bloku aç
                  </Button>
                  <Button variant="danger" onClick={handleBulkDelete} icon={Trash2} size="sm">
                    Sil
                  </Button>
                  <Button variant="ghost" onClick={() => { setSelectedUsers(new Set()); setShowBulkActions(false); }} icon={X} size="sm">
                    Ləğv et
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Users Grid */}
        <section>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredUsers.map(user => (
                  <UserCard
                    key={user.id}
                    user={user}
                    onEdit={handleEdit}
                    onBlock={handleBlock}
                    onUnblock={handleUnblock}
                    onDelete={handleDelete}
                    selected={selectedUsers.has(user.id)}
                    onSelect={handleSelectUser}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
              <Users className="mb-4 h-14 w-14 text-slate-400" />
              <h3 className="mb-2 text-2xl font-bold text-slate-900">İstifadəçi tapılmadı</h3>
              <p className="mb-6 max-w-md text-sm text-slate-500">
                Cari filtrlərə uyğun istifadəçi yoxdur.
              </p>
              <Button onClick={() => setShowCreateModal(true)} icon={UserPlus}>
                Yeni İstifadəçi Yarat
              </Button>
            </div>
          )}
        </section>
        
        {/* Mobile FAB */}
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="primary"
          icon={Plus}
          className="fixed bottom-6 right-4 z-40 h-14 w-14 rounded-full shadow-xl shadow-emerald-400/40 md:hidden" children={undefined}        />
      </main>
      
      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl m-4"
            >
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                {showCreateModal ? 'Yeni İstifadəçi Yarat' : 'İstifadəçini Redaktə Et'}
              </h2>

              <UserForm
                user={editingUser}
                onSubmit={async (userData) => {
                  try {
                    if (showCreateModal) {
                      await fetch('/api/admin/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData),
                      });
                      addToast('success', 'İstifadəçi uğurla yaradıldı');
                    } else if (editingUser) {
                      await fetch(`/api/admin/users/${editingUser.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(userData),
                      });
                      addToast('success', 'İstifadəçi uğurla yeniləndi');
                    }
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setEditingUser(null);
                    fetchUsers();
                  } catch (error) {
                    console.error('Error saving user:', error);
                    addToast('error', 'İstifadəçini yadda saxlamaq mümkün olmadı');
                  }
                }}
                onCancel={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  setEditingUser(null);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ToastProvider>
      <AdminUsersPageContent />
    </ToastProvider>
  );
}
