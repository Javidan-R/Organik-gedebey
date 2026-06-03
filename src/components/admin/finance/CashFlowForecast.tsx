'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Waves } from 'lucide-react';
import type { CashFlowProjection } from '@/types/finance';

export default function CashFlowForecast({
  data,
  formatCurrency,
}: {
  data: CashFlowProjection[];
  formatCurrency: (n: number) => string;
}) {
  const last = data[data.length - 1];
  const endCash = last?.cumulativeCash ?? 0;
  const minCash = data.reduce(
    (m, d) => Math.min(m, d.cumulativeCash),
    Number.POSITIVE_INFINITY,
  );
  const hasRisk = data.some((d) => d.cumulativeCash < 0);

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
          <Waves className="h-4 w-4 text-emerald-600" />
          30 Günlük Pul Axını Proqnozu
        </h2>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            hasRisk
              ? 'bg-rose-50 text-rose-700'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {hasRisk ? 'Likvidlik riski' : 'Sabit axın'}
        </span>
      </div>

      <div className="h-56">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="cashFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9 }}
                tickFormatter={(d: string) => d.slice(5)}
                minTickGap={20}
              />
              <YAxis tick={{ fontSize: 9 }} width={40} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => `Tarix: ${label}`}
              />
              <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" />
              <Area
                type="monotone"
                dataKey="cumulativeCash"
                name="Yığılmış nağd"
                stroke="#16a34a"
                strokeWidth={2}
                fill="url(#cashFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-slate-500">Proqnoz üçün məlumat yoxdur.</p>
          </div>
        )}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-slate-500">30 gün sonra (təxmini)</span>
          <p className="font-bold text-slate-800">{formatCurrency(endCash)}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-slate-500">Ən aşağı balans</span>
          <p
            className={`font-bold ${
              minCash < 0 ? 'text-rose-700' : 'text-slate-800'
            }`}
          >
            {formatCurrency(Number.isFinite(minCash) ? minCash : 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
