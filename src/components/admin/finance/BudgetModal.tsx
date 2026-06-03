'use client';

import { useState } from 'react';
import { X, Target } from 'lucide-react';
import type { Budget } from '@/types/finance';

export default function BudgetModal({
  isOpen,
  onClose,
  month,
  initial,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  month: string; // YYYY-MM
  initial: Budget | null;
  onSave: (budget: Budget) => void;
}) {
  const [incomeTarget, setIncomeTarget] = useState(initial?.incomeTarget ?? 0);
  const [expenseTarget, setExpenseTarget] = useState(
    initial?.expenseTarget ?? 0,
  );
  const [profitTarget, setProfitTarget] = useState(initial?.profitTarget ?? 0);

  if (!isOpen) return null;

  const fields: {
    label: string;
    value: number;
    set: (v: number) => void;
  }[] = [
    { label: 'Gəlir hədəfi (₼)', value: incomeTarget, set: setIncomeTarget },
    { label: 'Xərc hədəfi (₼)', value: expenseTarget, set: setExpenseTarget },
    { label: 'Mənfəət hədəfi (₼)', value: profitTarget, set: setProfitTarget },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="flex items-center gap-2 text-base font-semibold text-indigo-900">
            <Target className="h-4 w-4 text-indigo-600" />
            Büdcə hədəfləri · {month}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            title="Bağla"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          {fields.map((f) => (
            <div key={f.label} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-700">
                {f.label}
              </label>
              <input
                type="number"
                value={f.value}
                onChange={(e) => f.set(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm shadow-inner outline-none focus:border-emerald-400"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Ləğv et
          </button>
          <button
            type="button"
            onClick={() => {
              onSave({ month, incomeTarget, expenseTarget, profitTarget });
              onClose();
            }}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
          >
            Yadda saxla
          </button>
        </div>
      </div>
    </div>
  );
}
