'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        const role = data?.user?.role?.toLowerCase();
        const ok = role === 'admin' || role === 'superadmin';
        setIsAdmin(ok);
        if (!ok && pathname !== '/admin/login') {
          router.replace('/admin/login');
        } else if (ok && pathname === '/admin/login') {
          router.replace('/admin/dashboard');
        }
      } catch {
        setIsAdmin(false);
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      }
    };
    checkAuth();
  }, [router, pathname]);

  return { isAdmin };
}