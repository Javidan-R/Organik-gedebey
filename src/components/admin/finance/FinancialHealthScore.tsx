'use client';

import { HeartPulse, Gauge, Layers, Droplets } from 'lucide-react';
import type { FinancialHealthMetrics } from '@/types/finance';

function scoreMeta(score: number) {
  if (score >= 75)
    return { label: 'Əla', color: 'text-emerald-700', ring: '#10b981', bg: 'bg-emerald-50' };
  if (score >= 50)
    return { label: 'Yaxşı', color: 'text-sky-700', ring: '#0ea5e9', bg: 'bg-sky-50' };
  if (score >= 30)
    return { label: 'Orta', color: 'text-amber-700', ring: '#f59e0b', bg: 'bg-amber-50' };
  return { label: 'Zəif', color: 'text-rose-700', ring: '#ef4444', bg: 'bg-rose-50' };
}

export default function FinancialHealthScore({
  score,
  metrics,
}: {
  score: number;
  metrics: FinancialHealthMetrics;
}) {
  const meta = scoreMeta(score);
  const dash = 2 * Math.PI * 42;
  const offset = dash * (1 - Math.min(100, Math.max(0, score)) / 100);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-900">
        <HeartPulse className="h-4 w-4 text-emerald-600" />
        Maliyyə Sağlamlıq Balı
      </h2>

      <div className="flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={meta.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={dash}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-extrabold ${meta.color}`}>
              {Math.round(score)}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              / 100
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${meta.bg} ${meta.color}`}
          >
            Vəziyyət: {meta.label}
          </span>
          <ul className="space-y-1.5 text-[11px] text-slate-600">
            <li className="flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-emerald-600" />
              Xalis marja: <b className="text-slate-800">{metrics.netMargin.toFixed(1)}%</b>
            </li>
            <li className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-sky-600" />
              Stok dövriyyəsi:{' '}
              <b className="text-slate-800">{metrics.inventoryTurnover.toFixed(2)}x</b>
            </li>
            <li className="flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-amber-600" />
              Likvidlik nisbəti:{' '}
              <b className="text-slate-800">{metrics.liquidity.toFixed(2)}</b>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
