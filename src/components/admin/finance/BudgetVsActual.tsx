// 2. components/admin/finance/BudgetVsActual.tsx
'use client';

import { formatCurrency } from '@/utils';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, Edit } from 'lucide-react';

interface BudgetVsActualProps {
  budgetData: {
    incomeDiff: number;
    incomePct: number;
    expenseDiff: number;
    expensePct: number;
    profitDiff: number;
    profitPct: number;
  } | null;
  onEditBudget: () => void;
}

export default function BudgetVsActual({ budgetData, onEditBudget }: BudgetVsActualProps) {
  if (!budgetData) return null;

  const { incomeDiff, incomePct, expenseDiff, expensePct, profitDiff, profitPct } = budgetData;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-600" />
          Bütçe vs Gerçək (cari ay)
        </h3>
        <button
          onClick={onEditBudget}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
        >
          <Edit className="w-3 h-3" /> Redaktə et
        </button>
      </div>

      <div className="space-y-3 text-sm">
        {/* Gəlir */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-slate-600">Gəlir</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatCurrency(Math.abs(incomeDiff))}</span>
            <span className={incomePct >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {incomePct >= 0 ? (
                <TrendingUp className="w-3 h-3 inline mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 inline mr-0.5" />
              )}
              {Math.abs(incomePct).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Xərc */}
        <div className="flex justify-between items-center py-2 border-b border-slate-100">
          <span className="text-slate-600">Xərc</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatCurrency(Math.abs(expenseDiff))}</span>
            <span className={expenseDiff <= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              {expenseDiff <= 0 ? (
                <TrendingDown className="w-3 h-3 inline mr-0.5" />
              ) : (
                <TrendingUp className="w-3 h-3 inline mr-0.5" />
              )}
              {Math.abs(expensePct).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Mənfəət */}
        <div className="flex justify-between items-center pt-2">
          <span className="font-bold text-slate-800">Mənfəət</span>
          <div className="flex items-center gap-2">
            <span className="font-bold">{formatCurrency(Math.abs(profitDiff))}</span>
            <span className={`font-bold ${profitDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {profitDiff >= 0 ? (
                <TrendingUp className="w-3 h-3 inline mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 inline mr-0.5" />
              )}
              {Math.abs(profitPct).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar (mənfəət) */}
      {profitPct !== 0 && (
        <div className="mt-4">
          <div className="w-full bg-slate-100 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.abs(profitPct))}%` }}
              transition={{ duration: 0.6 }}
              className={`h-2 rounded-full ${profitPct >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            {profitPct >= 0
              ? `Hədəfdən ${profitPct.toFixed(0)}% yuxarı`
              : `Hədəfdən ${Math.abs(profitPct).toFixed(0)}% aşağı`}
          </p>
        </div>
      )}
    </motion.div>
  );
}