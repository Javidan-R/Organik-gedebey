// src/components/admin/daily/DailyComponents.tsx
'use client';
import { motion } from 'framer-motion';

export function SectionCard({
  title,
  icon,
  children,
  highlight,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border bg-white/95 px-4 py-4 md:px-5 md:py-5 shadow-lg ${
        highlight
          ? 'border-purple-200 shadow-purple-50'
          : 'border-slate-100 shadow-slate-50'
      }`}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2">
          {icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50 text-slate-700">
              {icon}
            </div>
          )}
          <h2 className="text-sm md:text-base font-bold text-slate-800">{title}</h2>
        </div>
      </header>
      {children}
    </motion.section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-xs md:text-sm text-slate-400">
      <p>{message}</p>
    </div>
  );
}

export function ChecklistItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex w-full items-center justify-between rounded-xl px-2 py-1.5 text-[11px] md:text-xs text-left ${
        checked
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-white text-slate-700 hover:bg-slate-100'
      }`}
    >
      <span>{label}</span>
      <span
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
          checked
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-slate-300 text-slate-400'
        }`}
      >
        {checked ? '✓' : ''}
      </span>
    </button>
  );
}