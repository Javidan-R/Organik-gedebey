// hooks/useAuth.ts
import { create } from 'zustand'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

type User = {
  id: string
  email: string
  name: string
  role: 'admin' | 'delivery' | 'vendor' | 'customer'
  avatar?: string
  phone?: string
}

type AuthState = {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}))

// ═══════════════════════════════════════════════════════════════════════════
// Auth Hook
// ═══════════════════════════════════════════════════════════════════════════
export function useAuth() {
  const { user, loading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function login(email: string, password: string, role?: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Giriş uğursuz oldu')
    }

    const data = await res.json()
    setUser(data.user)
    return data.user
  }

  async function signup(email: string, password: string, name: string, phone?: string) {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, phone }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Qeydiyyat uğursuz oldu')
    }

    const data = await res.json()
    setUser(data.user)
    return data.user
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  async function forgotPassword(email: string) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Xəta baş verdi')
    }

    return res.json()
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDelivery: user?.role === 'delivery',
    isVendor: user?.role === 'vendor',
    isCustomer: user?.role === 'customer',
    login,
    signup,
    logout,
    forgotPassword,
    refetch: fetchUser,
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Protected Route Hook
// ═══════════════════════════════════════════════════════════════════════════
export function useRequireAuth(requiredRole?: string) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }

    if (!loading && user && requiredRole && user.role !== requiredRole) {
      router.push('/unauthorized')
    }
  }, [user, loading, requiredRole, router])

  return { user, loading }
}

// ═══════════════════════════════════════════════════════════════════════════
// Redirect if Authenticated Hook
// ═══════════════════════════════════════════════════════════════════════════
export function useRedirectIfAuth(redirectTo: string = '/account') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, redirectTo, router])

  return { loading }
}