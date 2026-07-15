// src/components/admin/daily/StatCard.tsx
'use client';
import { motion } from 'framer-motion';

type Accent = 'emerald' | 'blue' | 'purple' | 'red' | 'amber' | 'orange' | 'indigo' | 'teal' | 'pink';

const colorMap: Record<Accent, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  blue:    { bg: 'bg-sky-50',    text: 'text-sky-700' },
  purple:  { bg: 'bg-purple-50', text: 'text-purple-700' },
  red:     { bg: 'bg-rose-50',   text: 'text-rose-700' },
  amber:   { bg: 'bg-amber-50',  text: 'text-amber-700' },
  orange:  { bg: 'bg-orange-50', text: 'text-orange-700' },
  indigo:  { bg: 'bg-indigo-50', text: 'text-indigo-700' },
  teal:    { bg: 'bg-teal-50',   text: 'text-teal-700' },
  pink:    { bg: 'bg-pink-50',   text: 'text-pink-700' },
};

const DEFAULT: Accent = 'emerald';

export function StatCard({
  icon,
  label,
  value,
  subtitle,
  accent = DEFAULT,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  accent?: Accent;
}) {
  const colors = colorMap[accent] ?? colorMap[DEFAULT];
  const { bg, text } = colors;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-100 bg-white px-4 py-4 shadow-md shadow-slate-50 md:px-5 md:py-5"
    >
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl ${bg} ${text}`}>
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-xl md:text-2xl font-extrabold ${text}`}>{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-[11px] md:text-xs text-slate-500">{subtitle}</p>
      )}
    </motion.div>
  );
}