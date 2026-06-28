// src/components/admin/users/Select.tsx
import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
  icon?: React.ElementType
}

interface SelectProps {
  label?: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  icon?: React.ElementType
  className?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  onChange,
  options,
  icon: Icon,
  className = '',
}) => (
  <div className={`space-y-1 ${className}`}>
    {label && <label className="block text-xs font-semibold text-slate-600">{label}</label>}
    <div className="relative">
      {Icon && (
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full appearance-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2 pr-10 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 ${Icon ? 'pl-9' : ''}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  </div>
)
