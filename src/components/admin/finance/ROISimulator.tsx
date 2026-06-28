// 5. components/admin/finance/ROISimulator.tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Percent, TrendingUp, DollarSign } from 'lucide-react';
import { Input } from '@/components/atoms/input';
import type { CampaignROI } from '@/types/finance';

interface ROISimulatorProps {
  discount: number;
  setDiscount: (v: number) => void;
  salesIncrease: number;
  setSalesIncrease: (v: number) => void;
  result: CampaignROI;
  formatCurrency: (n: number) => string;
}

export default function ROISimulator({
  discount,
  setDiscount,
  salesIncrease,
  setSalesIncrease,
  result,
  formatCurrency,
}: ROISimulatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200"
    >
      <h3 className="text-md font-bold text-slate-800 flex items-center gap-2 mb-4">
        <Percent className="w-4 h-4 text-indigo-600" />
        Kampaniya ROI Simulyatoru
      </h3>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Input
            label="Endirim faizi (%)"
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            min={0}
            max={100}
            icon={<Percent className="w-3 h-3" />}
          />
        </div>
        <div>
          <Input
            label="Gözlənilən satış artımı (%)"
            type="number"
            value={salesIncrease}
            onChange={(e) => setSalesIncrease(Number(e.target.value))}
            min={0}
            icon={<TrendingUp className="w-3 h-3" />}
          />
        </div>
      </div>

      <div className="mt-5 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="text-[10px] text-slate-500">Proqnoz dövriyyə</p>
            <p className="font-bold text-slate-800">{formatCurrency(result.projectedRevenue)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Proqnoz mənfəət</p>
            <p className="font-bold text-emerald-700">{formatCurrency(result.projectedProfit)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Təxmini ROI</p>
            <p className={`font-bold ${result.roi >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {result.roi.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        * Bu simulyator cari aylıq gəlir ({formatCurrency(result.projectedRevenue / (1 + salesIncrease / 100))}) və marja ({result.projectedProfit / result.projectedRevenue * 100}%) əsasında hesablanır.
      </p>
    </motion.div>
  );
}