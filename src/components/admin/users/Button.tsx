// src/components/admin/users/Button.tsx
import React from 'react'
import { motion } from 'framer-motion'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  icon?: React.ElementType
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  className?: string
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  icon: Icon,
  size = 'md',
  disabled,
  className = '',
}) => {
  const baseClasses = 'inline-flex items-center gap-2 rounded-xl font-semibold transition-all duration-200 shadow-lg'
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  }
  
  const variantClasses = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30',
    secondary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-red-500/30',
    ghost: 'bg-white/70 text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-none',
  }
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </motion.button>
  )
}
