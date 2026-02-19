// lib/auth-store.ts
'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'customer' | 'admin' | 'delivery' | 'vendor'

export type CustomerPreferences = {
  favoriteFruits?: string[]
  favoriteVegetables?: string[]
  dietaryRestrictions?: string[]
  allergies?: string[]
  preferredCategories?: string[]
  shoppingFrequency?: 'daily' | 'weekly' | 'monthly'
  averageOrderSize?: 'small' | 'medium' | 'large'
  notifications?: {
    orderUpdates: boolean
    promotions: boolean
    newProducts: boolean
    newsletter: boolean
  }
}

export type Address = {
  id: string
  type: 'home' | 'work' | 'other'
  label: string
  fullAddress: string
  city: string
  district: string
  phone: string
  isDefault: boolean
}

export type AuthUser = {
  id: string
  email: string
  name: string
  phone: string
  role: UserRole
  avatar?: string
  createdAt: string
  preferences?: CustomerPreferences
  addresses?: Address[]
}

type UserWithPassword = AuthUser & { password: string }

type AuthState = {
  user: AuthUser | null
  users: UserWithPassword[]
  loading: boolean
  
  // Actions
  login: (email: string, password: string, role?: UserRole) => Promise<AuthUser>
  signup: (data: SignupData) => Promise<AuthUser>
  logout: () => void
  updateProfile: (data: Partial<AuthUser>) => void
  updatePreferences: (prefs: Partial<CustomerPreferences>) => void
  addAddress: (address: Omit<Address, 'id'>) => void
  updateAddress: (id: string, address: Partial<Address>) => void
  deleteAddress: (id: string) => void
  forgotPassword: (email: string) => Promise<void>
  getCurrentUser: () => AuthUser | null
  _hasHydrated: boolean
  setHasHydrated: (hasHydrated: boolean) => void
}

export type SignupData = {
  email: string
  password: string
  name: string
  phone: string
  preferences?: Partial<CustomerPreferences>
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK USERS (for testing)
// ═══════════════════════════════════════════════════════════════════════════

const INITIAL_USERS: UserWithPassword[] = [
  {
    id: 'admin-001',
    email: 'admin@organikgedebey.az',
    password: 'admin123',
    name: 'Admin İstifadəçi',
    phone: '+994501234567',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'delivery-001',
    email: 'delivery@organikgedebey.az',
    password: 'delivery123',
    name: 'Çatdırılma',
    phone: '+994502345678',
    role: 'delivery',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'vendor-001',
    email: 'vendor@organikgedebey.az',
    password: 'vendor123',
    name: 'Satıcı',
    phone: '+994503456789',
    role: 'vendor',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'customer-001',
    email: 'customer@example.com',
    password: 'customer123',
    name: 'Test Müştəri',
    phone: '+994504567890',
    role: 'customer',
    createdAt: new Date().toISOString(),
    preferences: {
      favoriteFruits: ['alma', 'armud'],
      favoriteVegetables: ['pomidor', 'xiyar'],
      dietaryRestrictions: ['vegetarian'],
      allergies: [],
      shoppingFrequency: 'weekly',
      averageOrderSize: 'medium',
      notifications: {
        orderUpdates: true,
        promotions: true,
        newProducts: true,
        newsletter: false,
      },
    },
    addresses: [
      {
        id: 'addr-001',
        type: 'home',
        label: 'Ev',
        fullAddress: 'Bakı ş., Nəsimi r., 28 May küç., 12',
        city: 'Bakı',
        district: 'Nəsimi',
        phone: '+994504567890',
        isDefault: true,
      },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════════
// STORE
// ═══════════════════════════════════════════════════════════════════════════

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: INITIAL_USERS,
      loading: false,
      _hasHydrated: false,

      setHasHydrated: (hasHydrated) => {
        set({ _hasHydrated: hasHydrated })
      },

      // ─────────────────────────────────────────────────────────────────────
      // LOGIN
      // ─────────────────────────────────────────────────────────────────────
      login: async (email, password, role) => {
        const { users } = get()
        
        console.log('🔐 Login attempt:', { email, role })
        
        // Find user
        const foundUser = users.find(
          (u) =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.password === password &&
            (!role || u.role === role)
        )

        if (!foundUser) {
          console.log('❌ Login failed: User not found')
          throw new Error('Email və ya şifrə yanlışdır')
        }

        // Remove password from user object
        const { password: _, ...user } = foundUser

        set({ user: user as AuthUser })
        
        console.log('✅ Login successful:', user.email, user.role)
        return user as AuthUser
      },

      // ─────────────────────────────────────────────────────────────────────
      // SIGNUP
      // ─────────────────────────────────────────────────────────────────────
      signup: async (data) => {
        const { users } = get()

        console.log('📝 Signup attempt:', data.email)

        // Check if email exists
        const exists = users.find(
          (u) => u.email.toLowerCase() === data.email.toLowerCase()
        )

        if (exists) {
          console.log('❌ Signup failed: Email exists')
          throw new Error('Bu email artıq qeydiyyatdan keçib')
        }

        // Validate
        if (!data.email.includes('@')) {
          throw new Error('Düzgün email daxil edin')
        }

        if (data.password.length < 6) {
          throw new Error('Şifrə ən azı 6 simvol olmalıdır')
        }

        if (data.name.trim().length < 2) {
          throw new Error('Ad ən azı 2 simvol olmalıdır')
        }

        // Create new user
        const newUser: UserWithPassword = {
          id: `user-${Date.now()}`,
          email: data.email,
          password: data.password,
          name: data.name,
          phone: data.phone,
          role: 'customer',
          createdAt: new Date().toISOString(),
          preferences: {
            favoriteFruits: data.preferences?.favoriteFruits || [],
            favoriteVegetables: data.preferences?.favoriteVegetables || [],
            dietaryRestrictions: data.preferences?.dietaryRestrictions || [],
            allergies: data.preferences?.allergies || [],
            preferredCategories: data.preferences?.preferredCategories || [],
            shoppingFrequency: data.preferences?.shoppingFrequency || 'weekly',
            averageOrderSize: data.preferences?.averageOrderSize || 'medium',
            notifications: {
              orderUpdates: true,
              promotions: true,
              newProducts: true,
              newsletter: false,
              ...(data.preferences?.notifications || {}),
            },
          },
          addresses: [],
        }

        // Add to users
        const updatedUsers = [...users, newUser]
        set({ users: updatedUsers })

        // Auto-login
        const { password: _, ...user } = newUser
        set({ user: user as AuthUser })

        console.log('✅ Signup successful:', user.email)
        return user as AuthUser
      },

      // ─────────────────────────────────────────────────────────────────────
      // LOGOUT
      // ─────────────────────────────────────────────────────────────────────
      logout: () => {
        set({ user: null })
        console.log('✅ Logged out')
      },

      // ─────────────────────────────────────────────────────────────────────
      // UPDATE PROFILE
      // ─────────────────────────────────────────────────────────────────────
      updateProfile: (data) => {
        const { user, users } = get()
        if (!user) return

        const updatedUser = { ...user, ...data }
        
        // Update in users list
        const updatedUsers = users.map((u) =>
          u.id === user.id ? { ...u, ...data } : u
        )

        set({ user: updatedUser, users: updatedUsers })
        console.log('✅ Profile updated')
      },

      // ─────────────────────────────────────────────────────────────────────
      // UPDATE PREFERENCES
      // ─────────────────────────────────────────────────────────────────────
      updatePreferences: (prefs) => {
        const { user } = get()
        if (!user) return

        const updatedPreferences = {
          ...user.preferences,
          ...prefs,
        }

        get().updateProfile({ preferences: updatedPreferences as CustomerPreferences })
      },

      // ─────────────────────────────────────────────────────────────────────
      // ADD ADDRESS
      // ─────────────────────────────────────────────────────────────────────
      addAddress: (address) => {
        const { user } = get()
        if (!user) return

        const newAddress: Address = {
          ...address,
          id: `addr-${Date.now()}`,
        }

        const addresses = user.addresses || []
        const updatedAddresses = newAddress.isDefault
          ? [...addresses.map(a => ({ ...a, isDefault: false })), newAddress]
          : [...addresses, newAddress]

        get().updateProfile({ addresses: updatedAddresses })
        console.log('✅ Address added')
      },

      // ─────────────────────────────────────────────────────────────────────
      // UPDATE ADDRESS
      // ─────────────────────────────────────────────────────────────────────
      updateAddress: (id, data) => {
        const { user } = get()
        if (!user || !user.addresses) return

        const updatedAddresses = user.addresses.map(a => {
          if (a.id === id) {
            return { ...a, ...data }
          }
          if (data.isDefault) {
            return { ...a, isDefault: false }
          }
          return a
        })

        get().updateProfile({ addresses: updatedAddresses })
        console.log('✅ Address updated')
      },

      // ─────────────────────────────────────────────────────────────────────
      // DELETE ADDRESS
      // ─────────────────────────────────────────────────────────────────────
      deleteAddress: (id) => {
        const { user } = get()
        if (!user || !user.addresses) return

        const updatedAddresses = user.addresses.filter(a => a.id !== id)
        get().updateProfile({ addresses: updatedAddresses })
        console.log('✅ Address deleted')
      },

      // ─────────────────────────────────────────────────────────────────────
      // FORGOT PASSWORD
      // ─────────────────────────────────────────────────────────────────────
      forgotPassword: async (email) => {
        const { users } = get()
        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase())

        if (!user) {
          throw new Error('Bu email ilə istifadəçi tapılmadı')
        }

        console.log('📧 Password reset email sent to:', email)
        await new Promise(resolve => setTimeout(resolve, 1000))
      },

      // ─────────────────────────────────────────────────────────────────────
      // GET CURRENT USER
      // ─────────────────────────────────────────────────────────────────────
      getCurrentUser: () => {
        return get().user
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        users: state.users,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// ═══════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════

export const useAuth = () => {
  const store = useAuthStore()
  
  return {
    user: store.user,
    loading: store.loading,
    isAuthenticated: !!store.user,
    isAdmin: store.user?.role === 'admin',
    isDelivery: store.user?.role === 'delivery',
    isVendor: store.user?.role === 'vendor',
    isCustomer: store.user?.role === 'customer',
    login: store.login,
    signup: store.signup,
    logout: store.logout,
    updateProfile: store.updateProfile,
    updatePreferences: store.updatePreferences,
    addAddress: store.addAddress,
    updateAddress: store.updateAddress,
    deleteAddress: store.deleteAddress,
    forgotPassword: store.forgotPassword,
    getCurrentUser: store.getCurrentUser,
    hasHydrated: store._hasHydrated,
  }
}

// Protection hook - redirects if not authenticated
export const useRequireAuth = () => {
  const { user, isAuthenticated, hasHydrated } = useAuth()
  
  if (typeof window !== 'undefined' && hasHydrated && !isAuthenticated) {
    window.location.href = '/login'
  }
  
  return { user, isAuthenticated, hasHydrated }
}

// Role protection
export const useRequireRole = (role: UserRole) => {
  const { user, isAuthenticated, hasHydrated } = useAuth()
  
  if (typeof window !== 'undefined' && hasHydrated) {
    if (!isAuthenticated) {
      window.location.href = '/login'
    } else if (user?.role !== role) {
      window.location.href = '/unauthorized'
    }
  }
  
  return { user, isAuthenticated, hasHydrated }
}

// Redirect if authenticated
export const useRedirectIfAuth = (redirectTo: string = '/account') => {
  const { isAuthenticated, hasHydrated } = useAuth()
  
  if (typeof window !== 'undefined' && hasHydrated && isAuthenticated) {
    window.location.href = redirectTo
  }
  
  return { isAuthenticated, hasHydrated }
}