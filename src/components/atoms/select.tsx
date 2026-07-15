// src/components/atoms/Select.tsx
import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  label?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;          // ← artıq string, event deyil
  options: SelectOption[];
  required?: boolean;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function Select({
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  error,
  helper,
  icon,
  className = '',
  disabled = false,
  placeholder,
}: SelectProps) {
  const selectClasses = `
    w-full px-4 py-3 border-2 rounded-2xl text-base font-medium
    transition-all duration-300 shadow-sm bg-white text-slate-900
    placeholder:text-slate-500
    focus:outline-none focus:ring-4 focus:ring-emerald-200/70 focus:border-emerald-500
    hover:border-emerald-300 hover:shadow-md
    disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70
    appearance-none
    bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B7280%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E")] bg-[length:20px] bg-[right:14px_center] bg-no-repeat pr-12
    ${error ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200/70' : 'border-slate-300'}
    ${className}
  `;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {icon && <span className="text-emerald-500">{icon}</span>}
          {label}
          {required && <span className="text-rose-500 text-xs font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}   // ← hadisəni soyub string ötür
          className={selectClasses}
          disabled={disabled}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* ikon varsa əlavə etmək olar, lakin standart select ikonu istifadə olunur */}
      </div>
      {error && (
        <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-1">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {helper && !error && (
        <p className="text-xs text-slate-400 mt-1">{helper}</p>
      )}
    </div>
  );
}