// src/components/admin/users/UserCard.tsx
import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Phone, ShoppingBag, MapPin, Calendar, MoreVertical, Edit, Lock, Unlock, Trash2 } from 'lucide-react'
import { RoleBadge } from './RoleBadge'
import { StatusBadge } from './StatusBadge'
import { User } from '@/types/user'

interface UserCardProps {
  user: User
  onEdit: (user: User) => void
  onBlock: (user: User) => void
  onUnblock: (user: User) => void
  onDelete: (user: User) => void
  selected: boolean
  onSelect: (id: string) => void
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onBlock,
  onUnblock,
  onDelete,
  selected,
  onSelect,
}) => {
  const [showMenu, setShowMenu] = useState(false)
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative rounded-2xl border bg-white/90 p-4 shadow-lg backdrop-blur-md transition-all hover:shadow-xl ${
        selected ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(user.id)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 accent-emerald-600"
        />
        
        {/* Avatar */}
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg shadow-lg">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.firstName} className="h-full w-full rounded-full object-cover" />
          ) : (
            `${user.firstName[0]}${user.lastName[0]}`
          )}
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {user.firstName} {user.lastName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-500 truncate">{user.email}</span>
                {user.isEmailVerified && (
                  <svg className="h-3 w-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <RoleBadge role={user.role} />
              <StatusBadge isActive={user.isActive} isBlocked={user.isBlocked} />
            </div>
          </div>
          
          {/* Details */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
            {user.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {user.phone}
              </span>
            )}
            <span className="flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" />
              {user._count?.orders || 0} sifariş
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {user.addresses?.length || 0} ünvan
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(user.createdAt).toLocaleDateString('az-AZ')}
            </span>
          </div>
          
          {/* Stats */}
          <div className="mt-3 flex items-center gap-4 text-xs">
            <div className="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700">
              <span className="font-semibold">{parseFloat(user.totalSpent || '0').toFixed(2)} ₼</span>
              <span className="text-emerald-600 ml-1">xərclənib</span>
            </div>
            {user.loyaltyPoints > 0 && (
              <div className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700">
                <span className="font-semibold">{user.loyaltyPoints}</span>
                <span className="text-amber-600 ml-1">bal</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              <button
                onClick={() => { onEdit(user); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Edit className="h-4 w-4" />
                Redaktə et
              </button>
              {user.isBlocked ? (
                <button
                  onClick={() => { onUnblock(user); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                >
                  <Unlock className="h-4 w-4" />
                  Bloku aç
                </button>
              ) : (
                <button
                  onClick={() => { onBlock(user); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-700 hover:bg-amber-50"
                >
                  <Lock className="h-4 w-4" />
                  Blokla
                </button>
              )}
              <button
                onClick={() => { onDelete(user); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Sil
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
