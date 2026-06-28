// src/components/admin/users/StatusBadge.tsx
import React from 'react'
import { Ban, CheckCircle, XCircle } from 'lucide-react'

interface StatusBadgeProps {
  isActive: boolean
  isBlocked: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive, isBlocked }) => {
  if (isBlocked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
        <Ban className="h-3.5 w-3.5" />
        Bloklanmış
      </span>
    )
  }
  
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle className="h-3.5 w-3.5" />
        Aktiv
      </span>
    )
  }
  
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      <XCircle className="h-3.5 w-3.5" />
      Deaktiv
    </span>
  )
}
