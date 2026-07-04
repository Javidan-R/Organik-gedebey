// src/components/atoms/switch.tsx
'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export const Switch = memo(
  ({ label, checked, onChange, description, className = '', disabled = false }: SwitchProps) => {
    const id = label.replace(/\s/g, '-').toLowerCase();

    return (
      <div
        className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:shadow-md ${className} ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <div className="max-w-[70%] space-y-[0.15rem]">
          <label
            htmlFor={id}
            className={`text-sm font-semibold text-slate-800 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {label}
          </label>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
        <motion.button
          id={id}
          onClick={() => !disabled && onChange(!checked)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
            checked ? 'bg-emerald-600' : 'bg-slate-300'
          } ${disabled ? 'pointer-events-none' : ''}`}
          role="switch"
          aria-checked={checked}
          whileTap={{ scale: 0.92 }}
          disabled={disabled}
        >
          <motion.span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </motion.button>
      </div>
    );
  }
);

Switch.displayName = 'Switch';