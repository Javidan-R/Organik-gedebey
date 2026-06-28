// src/components/admin/users/Input.tsx
import React from 'react'

interface InputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  icon?: React.ElementType
  type?: string
  className?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = 'text',
  className = '',
}) => (
  <div className={`space-y-1 ${className}`}>
    {label && <label className="block text-xs font-semibold text-slate-600">{label}</label>}
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${Icon ? 'pl-9' : ''}`}
      />
    </div>
  </div>
)
