// 6. components/admin/finance/InventoryFinancialImpact.tsx
'use client';

import { motion } from 'framer-motion';
import { Package, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import type { InventoryFinancialStats } from '@/types/finance';

interface InventoryFinancialImpactProps {
  totalCost: number;
  potentialRevenue: number;
  avgMargin: number;
  formatCurrency: (n: number) => string;
}

export default function InventoryFinancialImpact({
  totalCost,
  potentialRevenue,
  avgMargin,
  formatCurrency,
}: InventoryFinancialImpactProps) {
  const turnoverRatio = totalCost > 0 ? potentialRevenue / totalCost : 0;
  const daysInventoryOutstanding = turnoverRatio > 0 ? 365 / turnoverRatio : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.12 }}
      className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200"
    >
      <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
        <Package className="w-4 h-4 text-emerald-600" />
        Stokun Maliyyə Təsiri
      </h3>

      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-sm text-slate-600">Stokda dondurulmuş kapital</span>
          <span className="font-bold text-slate-800">{formatCurrency(totalCost)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-sm text-slate-600">Potensial gəlir (stokun satış dəyəri)</span>
          <span className="font-bold text-emerald-700">{formatCurrency(potentialRevenue)}</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="text-sm text-slate-600">Stok dövriyyə nisbəti</span>
          <span className={`font-bold ${turnoverRatio >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {turnoverRatio.toFixed(1)}x
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-600">Orta stokda qalma müddəti</span>
          <span className="font-bold text-slate-800">{daysInventoryOutstanding.toFixed(0)} gün</span>
        </div>
      </div>

      <div className="mt-4 p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500">
        {turnoverRatio < 2 ? (
          <span className="flex items-center gap-1 text-amber-700"><TrendingDown className="w-3 h-3" /> Stok dövriyyəniz aşağıdır. Stokda daha az kapital dondurmaq üçün tədbirlər görün.</span>
        ) : turnoverRatio < 4 ? (
          <span className="flex items-center gap-1 text-slate-600">✅ Stok dövriyyəniz normal səviyyədədir.</span>
        ) : (
          <span className="flex items-center gap-1 text-emerald-700"><TrendingUp className="w-3 h-3" /> Stok dövriyyəniz yüksəkdir — səmərəli idarə olunur.</span>
        )}
      </div>
    </motion.div>
  );
}