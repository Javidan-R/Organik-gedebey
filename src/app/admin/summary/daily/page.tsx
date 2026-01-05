// src/app/admin/daily/page.tsx
'use client';
import DailyCharts from '@/components/admin/daily/DailyCharts';
import Dailychecklist from '@/components/admin/daily/Dailychecklist';
import DailyHeader from '@/components/admin/daily/DailyHeader';
import KpiRows from '@/components/admin/daily/KpiRows';
import SaleSystem from '@/components/admin/daily/SaleSystem';
import { currency } from '@/helpers';
import { motion } from 'framer-motion';
import {
  ArrowDownRight,
  ArrowUpRight,
  PieChart as PieIcon,
  LineChart as LineIcon,
  CheckCircle2,
} from 'lucide-react';

// MAIN COMPONENT
export default function DailyPremiumPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-slate-50 px-3 py-4 md:px-6 md:py-6 space-y-6 print:bg-white print:px-0">
     
     <DailyHeader/>
      {/* TOP KPI ROWS */}
    <KpiRows/>

      {/* SYSTEM vs REAL 3-COLUMN GRID */}
     
     <SaleSystem/>

      {/* CHARTS SECTION: PIE + BAR + LINE */}
<DailyCharts/>
      {/* DAILY PRODUCT LIST + CASH / CHECKLIST */}
      <Dailychecklist/>
    </main>
  );
}

// ============= SMALL COMPONENTS =============

type Accent = 'emerald' | 'blue' | 'purple' | 'red';

export function StatCard(props: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  accent?: Accent;
}) {
  const { icon, label, value, subtitle, accent = 'emerald' } =
    props;

  const colorMap: Record<
    Accent,
    { bg: string; text: string }
  > = {
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
    },
    blue: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
    },
    red: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
    },
  };

  const { bg, text } = colorMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-slate-100 bg-white px-4 py-4 shadow-md shadow-slate-50 md:px-5 md:py-5"
    >
      <div
        className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl ${bg} ${text}`}
      >
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-xl md:text-2xl font-extrabold ${text}`}>
        {value}
      </p>
      {subtitle && (
        <p className="mt-0.5 text-[11px] md:text-xs text-slate-500">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

export function SectionCard(props: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const { title, icon, children, highlight } = props;
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
          <h2 className="text-sm md:text-base font-bold text-slate-800">
            {title}
          </h2>
        </div>
      </header>
      {children}
    </motion.section>
  );
}

export function KeyValue(props: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  const { label, value, valueClass } = props;
  return (
    <div className="flex flex-col rounded-2xl bg-slate-50 px-3 py-2">
      <span className="text-[11px] font-semibold text-slate-500">
        {label}
      </span>
      <span
        className={`text-xs md:text-sm font-semibold text-slate-800 ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}

export function NumberField(props: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const { label, value, onChange } = props;
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold text-slate-600">
        {label}
      </label>
      <input
        type="number"
        step="0.01"
        value={Number.isNaN(value) ? '' : value}
        onChange={(e) =>
          onChange(parseFloat(e.target.value || '0'))
        }
        className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs md:text-sm text-slate-800 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
}

export function DiffRow(props: {
  label: string;
  system: number;
  real: number;
  money?: boolean;
}) {
  const { label, system, real, money = true } = props;
  const diff = (real || 0) - (system || 0);
  const hasReal = !!real || real === 0;
  const positive = diff > 0;
  const neutral = diff === 0;
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold text-slate-500">
          {label}
        </span>
        <span className="text-[11px] text-slate-500">
          Sistem: {money ? currency(system) : system}
          {hasReal && (
            <>
              {' · '}Real: {money ? currency(real) : real}
            </>
          )}
        </span>
      </div>
      {hasReal && (
        <span
          className={`inline-flex items-center rounded-xl px-2 py-1 text-[10px] font-semibold ${
            neutral
              ? 'bg-slate-100 text-slate-500'
              : positive
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          {neutral ? (
            'Uyğundur'
          ) : positive ? (
            <>
              <ArrowUpRight className="mr-1 h-3 w-3" />
              +{money ? currency(diff) : diff}
            </>
          ) : (
            <>
              <ArrowDownRight className="mr-1 h-3 w-3" />
              {money ? currency(diff) : diff}
            </>
          )}
        </span>
      )}
    </div>
  );
}

export function HealthBadge(props: {
  label: string;
  score: number;
}) {
  const { label, score } = props;
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
      <CheckCircle2 className="w-4 h-4" />
      <span>{label}</span>
      <span className="rounded-xl bg-white/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        {score.toFixed(0)}/100
      </span>
    </div>
  );
}

export function ChecklistItem(props: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  const { label, checked, onChange } = props;
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

export function EmptyState(props: { message: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center text-xs md:text-sm text-slate-400">
      <p>{props.message}</p>
    </div>
  );
}
