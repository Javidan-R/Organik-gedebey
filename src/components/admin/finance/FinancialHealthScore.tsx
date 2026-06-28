// 4. components/admin/finance/FinancialHealthScore.tsx
'use client';

import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';

interface FinancialHealthScoreProps {
  score: number;
  metrics: {
    netMargin: number;
    inventoryTurnover: number;
    liquidity: number;
  };
}

export default function FinancialHealthScore({ score, metrics }: FinancialHealthScoreProps) {
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreMessage = () => {
    if (score >= 80) return 'Əla vəziyyət';
    if (score >= 60) return 'Yaxşı, lakin yaxşılaşdırma lazım';
    return 'Diqqət tələb olunur';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-white shadow-sm border border-purple-100"
    >
      <div className="flex justify-between items-start">
        <h3 className="text-md font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-600" />
          Maliyyə Sağlamlıq İndeksi
        </h3>
        <div className="text-right">
          <div className={`text-3xl font-black ${getScoreColor()}`}>{score}</div>
          <p className="text-[10px] text-slate-500">/ 100</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="w-full bg-slate-100 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-3 rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
          />
        </div>
        <p className="text-xs font-semibold mt-2">{getScoreMessage()}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-[11px]">
        <div>
          <p className="text-slate-500">Mənfəət marjası</p>
          <p className={`font-bold ${metrics.netMargin >= 15 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {metrics.netMargin.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-slate-500">Stok dövriyyəsi</p>
          <p className={`font-bold ${metrics.inventoryTurnover >= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {metrics.inventoryTurnover.toFixed(1)}x
          </p>
        </div>
        <div>
          <p className="text-slate-500">Likvidlik əmsalı</p>
          <p className={`font-bold ${metrics.liquidity >= 1 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {metrics.liquidity.toFixed(2)}x
          </p>
        </div>
      </div>
    </motion.div>
  );
}