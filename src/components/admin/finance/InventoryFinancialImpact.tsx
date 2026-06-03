'use client';

import { Boxes, TrendingUp, Coins } from 'lucide-react';

export default function InventoryFinancialImpact({
  totalCost,
  potentialRevenue,
  avgMargin,
  formatCurrency,
}: {
  totalCost: number;
  potentialRevenue: number;
  avgMargin: number;
  formatCurrency: (n: number) => string;
}) {
  const potentialProfit = potentialRevenue - totalCost;
  const lockedRatio =
    potentialRevenue > 0 ? (totalCost / potentialRevenue) * 100 : 0;

  return (
    <div className="space-y-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-white to-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-sky-900">
        <Boxes className="h-4 w-4 text-sky-600" />
        Stokun Maliyyə Təsiri
      </h2>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <Coins className="h-3 w-3" />
            Dondurulmuş kapital
          </div>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <TrendingUp className="h-3 w-3" />
            Potensial gəlir
          </div>
          <p className="mt-1 text-sm font-bold text-emerald-700">
            {formatCurrency(potentialRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <Coins className="h-3 w-3" />
            Potensial mənfəət
          </div>
          <p
            className={`mt-1 text-sm font-bold ${
              potentialProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {formatCurrency(potentialProfit)}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-600">
          <span>Stokda dondurulmuş kapitalın gəlirə nisbəti</span>
          <span className="font-semibold">{lockedRatio.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${
              lockedRatio <= 60
                ? 'bg-emerald-500'
                : lockedRatio <= 75
                  ? 'bg-amber-400'
                  : 'bg-rose-500'
            }`}
            style={{ width: `${Math.min(100, lockedRatio)}%` }}
          />
        </div>
        <p className="text-[11px] text-slate-500">
          Orta marja: <b className="text-slate-700">{avgMargin.toFixed(1)}%</b>.
          Nisbət nə qədər aşağıdırsa, kapital o qədər səmərəli işləyir.
        </p>
      </div>
    </div>
  );
}
