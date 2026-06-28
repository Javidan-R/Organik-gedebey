// src/hooks/useAuth.ts
// Storefront üçün auth hook.
// Auth store-dan istifadə edir — API çağırışlarını store idarə edir.

export { useAuth, useAuthStore } from '@/lib/auth-store'
export type { AuthUser, UserRole, SignupData, Address, CustomerPreferences } from '@/lib/auth-store'

// ─── Protected route hook ────────────────────────────────────────────────────

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-store'

export function useRequireAuth(redirectTo = '/login') {
  const { user, loading, hasHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (hasHydrated && !loading && !user) {
      router.push(redirectTo)
    }
  }, [hasHydrated, loading, user, redirectTo, router])

  return { user, loading, isReady: hasHydrated && !loading }
}

export function useRedirectIfAuth(redirectTo = '/account') {
  const { user, loading, hasHydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (hasHydrated && !loading && user) {
      router.push(redirectTo)
    }
  }, [hasHydrated, loading, user, redirectTo, router])

  return { loading, isReady: hasHydrated && !loading }
}
