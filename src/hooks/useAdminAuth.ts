// src/hooks/useAdminAuth.ts
// Admin sessiyasını idarə edir.
// AdminClientLayout bu hook-u istifadə edir.

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export type AdminRole = "ADMIN" | "SUPERADMIN" | "MANAGER" | "WAREHOUSE_STAFF";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  type: "admin";
};

type AuthState = {
  user: AdminUser | null;
  loading: boolean;
};

export function useAdminAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        // Cache yox — hər dəfə server-dən oxu
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });

      if (!res.ok) {
        setState({ user: null, loading: false });
        return;
      }

      const data = await res.json();

      // ✅ type:"admin" yoxlanması — bu field /api/auth/me-dən gəlməlidir
      if (data?.user?.type === "admin") {
        setState({ user: data.user as AdminUser, loading: false });
      } else {
        // Admin deyil — login-ə yönləndir
        setState({ user: null, loading: false });
        // ⚠️ Middleware artıq bunu idarə edir, amma defence-in-depth üçün:
        // router.push burada çağırılmır çünki loop yaranır.
        // Middleware token yoxlayır — token yoxdursa login-ə redirect edir.
      }
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  const logout = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Xəta olsa belə çıxışı tamamla
    }

    setState({ user: null, loading: false });

    // ✅ Full page reload — middleware yeni vəziyyəti tanısın
    window.location.href = "/admin/login";
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return {
    user: state.user,
    loading: state.loading,
    logout,
    refetch: fetchMe,
  };
}