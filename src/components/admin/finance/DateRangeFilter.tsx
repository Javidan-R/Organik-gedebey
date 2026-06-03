'use client';

import { CalendarRange } from 'lucide-react';

const DAY_MS = 24 * 60 * 60 * 1000;

const toInput = (d: Date) => d.toISOString().slice(0, 10);

const PRESETS: { label: string; days: number }[] = [
  { label: '7 gün', days: 7 },
  { label: '30 gün', days: 30 },
  { label: '90 gün', days: 90 },
];

export default function DateRangeFilter({
  value,
  onChange,
}: {
  value: { from: Date; to: Date };
  onChange: (range: { from: Date; to: Date }) => void;
}) {
  const applyPreset = (days: number) => {
    const to = new Date();
    onChange({ from: new Date(to.getTime() - days * DAY_MS), to });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 shadow-sm">
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
        <CalendarRange className="h-3.5 w-3.5 text-emerald-600" />
        Aralıq:
      </span>

      <input
        type="date"
        value={toInput(value.from)}
        max={toInput(value.to)}
        onChange={(e) =>
          onChange({ ...value, from: new Date(e.target.value) })
        }
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-emerald-400"
      />
      <span className="text-xs text-slate-400">—</span>
      <input
        type="date"
        value={toInput(value.to)}
        min={toInput(value.from)}
        onChange={(e) => onChange({ ...value, to: new Date(e.target.value) })}
        className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-emerald-400"
      />

      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => applyPreset(p.days)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
