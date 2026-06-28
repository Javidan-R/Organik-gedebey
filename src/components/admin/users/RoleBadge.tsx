// src/components/admin/users/RoleBadge.tsx
import React from 'react'
import { UserCheck, Truck, Package, Building2, Crown } from 'lucide-react'
import { UserRole } from '@/types/user'

interface RoleBadgeProps {
  role: UserRole
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const config = {
    CUSTOMER: { icon: UserCheck, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Müştəri' },
    COURIER: { icon: Truck, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Kuryer' },
    WAREHOUSE_STAFF: { icon: Package, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Anbar işçisi' },
    MANAGER: { icon: Building2, color: 'bg-teal-100 text-teal-700 border-teal-200', label: 'Menecer' },
    ADMIN: { icon: Crown, color: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Admin' },
    SUPERADMIN: { icon: Crown, color: 'bg-red-100 text-red-700 border-red-200', label: 'Superadmin' },
  }
  
  const { icon: Icon, color, label } = config[role]
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
