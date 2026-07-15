// ============================================================
// src/components/admin/dashboard/RangeSelector.tsx
// PHASE 4 — Bugün/Dünən/Son7/Son30/Bu ay/Keçən ay/Bu il/Custom seçici
// ============================================================
'use client';

import { useState } from 'react';
import { CalendarRange } from 'lucide-react';
import type { DashboardRangeKey } from '@/lib/dashboard/dateRanges';

const PRESETS: { key: DashboardRangeKey; label: string }[] = [
  { key: 'today', label: 'Bu gün' },
  { key: 'yesterday', label: 'Dünən' },
  { key: 'last7', label: 'Son 7 gün' },
  { key: 'last30', label: 'Son 30 gün' },
  { key: 'thisMonth', label: 'Bu ay' },
  { key: 'lastMonth', label: 'Keçən ay' },
  { key: 'thisYear', label: 'Bu il' },
  { key: 'custom', label: 'Xüsusi aralıq' },
];

interface RangeSelectorProps {
  value: DashboardRangeKey;
  customStart?: string;
  customEnd?: string;
  onChange: (range: DashboardRangeKey, customStart?: string, customEnd?: string) => void;
}

export default function RangeSelector({ value, customStart, customEnd, onChange }: RangeSelectorProps) {
  const [localStart, setLocalStart] = useState(customStart ?? new Date().toISOString().slice(0, 10));
  const [localEnd, setLocalEnd] = useState(customEnd ?? new Date().toISOString().slice(0, 10));

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 shadow-sm">
      <CalendarRange className="h-4 w-4 text-emerald-600 shrink-0" />
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            onClick={() => (p.key === 'custom' ? onChange('custom', localStart, localEnd) : onChange(p.key))}
            className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              value === p.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {value === 'custom' && (
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={localStart}
            onChange={(e) => {
              setLocalStart(e.target.value);
              onChange('custom', e.target.value, localEnd);
            }}
            className="h-8 rounded-xl border border-slate-200 px-2 text-xs font-semibold text-slate-700"
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => {
              setLocalEnd(e.target.value);
              onChange('custom', localStart, e.target.value);
            }}
            className="h-8 rounded-xl border border-slate-200 px-2 text-xs font-semibold text-slate-700"
          />
        </div>
      )}
    </div>
  );
}