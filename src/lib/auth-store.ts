// src/lib/auth-store.ts
// Müştəri tərəfi auth store.
// Şifrə heç vaxt client-da saxlanılmır.
// Bütün əməliyyatlar API route-ları vasitəsilə aparılır.
// Yalnız user metadata localStorage-da persist edilir (token deyil — token cookie-dədir).

'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserRole = 'CUSTOMER' | 'COURIER' | 'ADMIN' | 'SUPERADMIN' | 'MANAGER'

export type CustomerPreferences = {
  favoriteFruits?: string[]
  favoriteVegetables?: string[]
  dietaryRestrictions?: string[]
  allergies?: string[]
  preferredCategories?: string[]
  shoppingFrequency?: 'daily' | 'weekly' | 'monthly'
  notifications?: {
    orderUpdates: boolean
    promotions: boolean
    newProducts: boolean
    newsletter: boolean
  }
}

export type Address = {
  id: string
  type: 'HOME' | 'WORK' | 'OTHER'
  label: string
  fullAddress: string
  city: string
  district?: string
  phone: string
  isDefault: boolean
}

export type AuthUser = {
  id: string
  email: string
  name: string
  phone?: string | null
  role: UserRole
  type: 'customer' | 'admin'
  avatarUrl?: string | null
  isEmailVerified?: boolean
  loyaltyPoints?: number
  totalOrders?: number
  totalSpent?: string
  preferences?: CustomerPreferences
  addresses?: Address[]
}

export type SignupData = {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

type AuthState = {
  user: AuthUser | null
  loading: boolean
  _hasHydrated: boolean

  // Hydration
  setHasHydrated: (v: boolean) => void

  // Actions
  fetchMe: () => Promise<void>
  login: (email: string, password: string) => Promise<AuthUser>
  signup: (data: SignupData) => Promise<AuthUser>
  logout: () => Promise<void>
  updateProfile: (data: Partial<Pick<AuthUser, 'name' | 'phone' | 'avatarUrl'>>) => void
  updatePreferences: (prefs: Partial<CustomerPreferences>) => void
  addAddress: (address: Omit<Address, 'id'>) => void
  updateAddress: (id: string, address: Partial<Address>) => void
  deleteAddress: (id: string) => void
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (token: string, password: string) => Promise<void>
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // ── Cari istifadəçini API-dən yüklə ────────────────────────────────────
      fetchMe: async () => {
        set({ loading: true })
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' })
          if (res.ok) {
            const data = await res.json()
            set({ user: data.user ?? null })
          } else {
            set({ user: null })
          }
        } catch {
          set({ user: null })
        } finally {
          set({ loading: false })
        }
      },

      // ── Giriş ──────────────────────────────────────────────────────────────
      login: async (email, password) => {
        set({ loading: true })
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          })

          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Giriş uğursuz oldu')

          set({ user: data.user })
          return data.user as AuthUser
        } finally {
          set({ loading: false })
        }
      },

      // ── Qeydiyyat ──────────────────────────────────────────────────────────
      signup: async (signupData) => {
        set({ loading: true })
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(signupData),
          })

          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Qeydiyyat uğursuz oldu')

          set({ user: data.user })
          return data.user as AuthUser
        } finally {
          set({ loading: false })
        }
      },

      // ── Çıxış ──────────────────────────────────────────────────────────────
      logout: async () => {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        set({ user: null })
      },

      // ── Profil yenilə ──────────────────────────────────────────────────────
      updateProfile: (data) => {
        set((s) => ({ user: s.user ? { ...s.user, ...data } : null }))
      },

      // ── Üstünlüklər ────────────────────────────────────────────────────────
      updatePreferences: (prefs) => {
        set((s) => {
          if (!s.user) return {}
          return {
            user: {
              ...s.user,
              preferences: { ...s.user.preferences, ...prefs },
            },
          }
        })
      },

      // ── Ünvanlar ───────────────────────────────────────────────────────────
      addAddress: (address) => {
        const id = crypto.randomUUID()
        set((s) => {
          if (!s.user) return {}
          const addresses = s.user.addresses ?? []
          const newAddr: Address = { ...address, id }
          return {
            user: {
              ...s.user,
              addresses: address.isDefault
                ? [...addresses.map((a) => ({ ...a, isDefault: false })), newAddr]
                : [...addresses, newAddr],
            },
          }
        })
      },

      updateAddress: (id, address) => {
        set((s) => {
          if (!s.user) return {}
          return {
            user: {
              ...s.user,
              addresses: (s.user.addresses ?? []).map((a) =>
                a.id === id ? { ...a, ...address } : a
              ),
            },
          }
        })
      },

      deleteAddress: (id) => {
        set((s) => {
          if (!s.user) return {}
          return {
            user: {
              ...s.user,
              addresses: (s.user.addresses ?? []).filter((a) => a.id !== id),
            },
          }
        })
      },

      // ── Şifrə bərpası ──────────────────────────────────────────────────────
      forgotPassword: async (email) => {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      },

      resetPassword: async (token, password) => {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Xəta baş verdi')
      },
    }),
    {
      name: 'og-auth',
      storage: createJSONStorage(() => localStorage),
      // HEÇ VAXT password saxlama — yalnız user metadata
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              email: state.user.email,
              name: state.user.name,
              role: state.user.role,
              type: state.user.type,
              phone: state.user.phone,
              avatarUrl: state.user.avatarUrl,
              loyaltyPoints: state.user.loyaltyPoints,
              totalOrders: state.user.totalOrders,
              preferences: state.user.preferences,
              addresses: state.user.addresses,
            }
          : null,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useAuth() {
  const store = useAuthStore()

  return {
    user: store.user,
    loading: store.loading,
    hasHydrated: store._hasHydrated,
    isAuthenticated: !!store.user,
    isAdmin: ['ADMIN', 'SUPERADMIN', 'MANAGER'].includes(store.user?.role ?? ''),
    isCustomer: store.user?.role === 'CUSTOMER',
    isCourier: store.user?.role === 'COURIER',

    fetchMe: store.fetchMe,
    login: store.login,
    signup: store.signup,
    logout: store.logout,
    updateProfile: store.updateProfile,
    updatePreferences: store.updatePreferences,
    addAddress: store.addAddress,
    updateAddress: store.updateAddress,
    deleteAddress: store.deleteAddress,
    forgotPassword: store.forgotPassword,
    resetPassword: store.resetPassword,
  }
}
