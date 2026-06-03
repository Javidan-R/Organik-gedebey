'use client';

import { Target, ArrowUpRight, ArrowDownRight, Settings2 } from 'lucide-react';
import type { BudgetComparison } from '@/types/finance';

type Row = {
  label: string;
  diff: number;
  pct: number;
  /** true => artım yaxşıdır (gəlir, mənfəət); false => artım pisdir (xərc) */
  higherIsBetter: boolean;
};

function StatusRow({ label, diff, pct, higherIsBetter }: Row) {
  const good = higherIsBetter ? diff >= 0 : diff <= 0;
  const color = good ? 'text-emerald-700' : 'text-rose-700';
  const bg = good ? 'bg-emerald-50' : 'bg-rose-50';
  const Arrow = diff >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2">
      <span className="text-xs font-medium text-slate-700">{label}</span>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${bg} ${color}`}
      >
        <Arrow className="h-3 w-3" />
        {diff >= 0 ? '+' : ''}
        {diff.toFixed(0)} ₼ ({pct >= 0 ? '+' : ''}
        {pct.toFixed(1)}%)
      </span>
    </div>
  );
}

export default function BudgetVsActual({
  budgetData,
  onEditBudget,
}: {
  budgetData: BudgetComparison | null;
  onEditBudget: () => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
          <Target className="h-4 w-4 text-indigo-600" />
          Büdcə vs Faktiki (Cari ay)
        </h2>
        <button
          type="button"
          onClick={onEditBudget}
          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50"
        >
          <Settings2 className="h-3 w-3" />
          Büdcəni dəyiş
        </button>
      </div>

      {budgetData ? (
        <div className="space-y-2">
          <StatusRow
            label="Gəlir hədəfi"
            diff={budgetData.incomeDiff}
            pct={budgetData.incomePct}
            higherIsBetter
          />
          <StatusRow
            label="Xərc hədəfi"
            diff={budgetData.expenseDiff}
            pct={budgetData.expensePct}
            higherIsBetter={false}
          />
          <StatusRow
            label="Mənfəət hədəfi"
            diff={budgetData.profitDiff}
            pct={budgetData.profitPct}
            higherIsBetter
          />
          <p className="pt-1 text-[11px] text-slate-500">
            Müsbət gəlir/mənfəət fərqi hədəfin üstündə olduğunuzu, mənfi xərc
            fərqi isə xərclərin hədəfdən aşağı qaldığını göstərir.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-indigo-200 bg-white/60 px-4 py-6 text-center">
          <p className="text-xs text-slate-500">
            Bu ay üçün büdcə hədəfi təyin edilməyib.
          </p>
          <button
            type="button"
            onClick={onEditBudget}
            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow hover:bg-indigo-700"
          >
            <Settings2 className="h-3 w-3" />
            Büdcə təyin et
          </button>
        </div>
      )}
    </div>
  );
}
