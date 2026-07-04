'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
} from 'lucide-react';

interface KPICard {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  helperText?: string;
} 

interface AdminDashboardKPIsProps {
  kpis: KPICard[];
  loading?: boolean;
}

export function AdminDashboardKPIs({ kpis, loading = false }: AdminDashboardKPIsProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {kpis.map((kpi, index) => (
        <motion.div
          key={index}
          variants={item}
          className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-lg ${kpi.color}`}>
              {kpi.icon}
            </div>
            {kpi.trend && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  kpi.trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                {kpi.trend.isPositive ? '+' : '-'}
                {Math.abs(kpi.trend.value)}%
              </div>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
            <p className="text-sm text-gray-600">{kpi.label}</p>
            {kpi.helperText && (
              <p className="text-xs text-gray-500 mt-1">{kpi.helperText}</p>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default AdminDashboardKPIs;
