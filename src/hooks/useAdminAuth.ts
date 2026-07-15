// src/hooks/useAdminAuth.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  isBlocked: boolean;
  avatarUrl?: string | null;
  lastLoginAt?: string | null;
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/me', { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        setError('Auth required');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setUser(data.user || null);
    } catch (err) {
      setUser(null);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const logout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    window.location.href = '/admin/login';
  }, []);

  return { user, loading, error, logout, refetch: fetchUser };
}