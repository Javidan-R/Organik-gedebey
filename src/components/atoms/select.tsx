// src/components/atoms/select.tsx
'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helper?: string;
  containerClassName?: string;
  required?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      value,
      onChange,
      error,
      helper,
      containerClassName = '',
      className = '',
      required = false,
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || label?.replace(/\s/g, '-').toLowerCase() || 'select';

    return (
      <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="text-sm font-semibold text-slate-700">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={[
            'w-full rounded-2xl border-2 bg-white px-4 py-3 text-base font-medium text-slate-900 shadow-sm transition-all duration-200',
            'focus:outline-none focus:ring-4 focus:ring-emerald-200/70 focus:border-emerald-500',
            'hover:border-emerald-300 hover:shadow-md',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70',
            'appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B7280%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E")] bg-[length:20px] bg-[right:14px_center] bg-no-repeat pr-12',
            error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200/70 hover:border-rose-400' : 'border-slate-300',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {helper && <p className="text-xs text-slate-500">{helper}</p>}
        {error && <p className="text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';