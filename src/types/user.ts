// src/types/user.ts
// Shared types for user-related functionality across the application

import { z } from 'zod'
 
// ============================================
// ENUMS
// ============================================

export type UserRole = 'CUSTOMER' | 'COURIER' | 'WAREHOUSE_STAFF' | 'MANAGER' | 'ADMIN' | 'SUPERADMIN'
export type UserStatus = 'active' | 'blocked' | 'all'

// ============================================
// INTERFACES
// ============================================

export interface User {
  id: string
  email: string
  phone: string | null
  firstName: string
  lastName: string
  role: UserRole
  avatarUrl: string | null
  isEmailVerified: boolean
  isPhoneVerified: boolean
  isActive: boolean
  isBlocked: boolean
  blockedReason: string | null
  totalOrders: number
  totalSpent: string
  loyaltyPoints: number
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
  addresses?: any[]
  _count?: {
    orders: number
    notifications: number
  }
}

export interface FilterState {
  searchTerm: string
  role: string
  status: UserStatus
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface UserFormData {
  email: string
  phone: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
}

export interface UserStatistics {
  total: number
  active: number
  blocked: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UsersResponse {
  users: User[]
  statistics: UserStatistics
  pagination: PaginationMeta
}

// ============================================
// VALIDATION SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: z.string().email('Düzgün email formatı daxil edin'),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'Ad mütləqdir'),
  lastName: z.string().min(1, 'Soyad mütləqdir'),
  role: z.enum(['CUSTOMER', 'COURIER', 'WAREHOUSE_STAFF', 'MANAGER', 'ADMIN']),
  password: z.string().min(6, 'Şifrə ən azı 6 simvol olmalıdır'),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = z.object({
  email: z.string().email('Düzgün email formatı daxil edin').optional(),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'Ad mütləqdir').optional(),
  lastName: z.string().min(1, 'Soyad mütləqdir').optional(),
  role: z.enum(['CUSTOMER', 'COURIER', 'WAREHOUSE_STAFF', 'MANAGER', 'ADMIN', 'SUPERADMIN']).optional(),
  isActive: z.boolean().optional(),
})

export const blockUserSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().optional(),
})

export const updateRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'COURIER', 'WAREHOUSE_STAFF', 'MANAGER', 'ADMIN', 'SUPERADMIN']),
  reason: z.string().optional(),
})

export const bulkActionSchema = z.object({
  action: z.enum(['block', 'unblock', 'delete', 'activate']),
  userIds: z.array(z.string().uuid()).min(1, 'Ən azı bir istifadəçi seçilməlidir'),
  reason: z.string().optional(),
})

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type BlockUserInput = z.infer<typeof blockUserSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>
export type BulkActionInput = z.infer<typeof bulkActionSchema>
