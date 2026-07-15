// src/app/admin/summary/daily/page.tsx
'use client';

import { useState, useMemo, useCallback } from 'react';
import DailyHeader from '@/components/admin/daily/DailyHeader';
import KpiRows from '@/components/admin/daily/KpiRows';
import SaleSystem from '@/components/admin/daily/SaleSystem';
import DailyCharts from '@/components/admin/daily/DailyCharts';
import Dailychecklist from '@/components/admin/daily/Dailychecklist';
import DailyOrdersTable from '@/components/admin/daily/DailyOrdersTable';
import { useDailySummary } from '@/hooks/useDailySummary';
import { useApp } from '@/lib/store';
import { sumBalances } from '@/utils/safe-sum';
import { currency } from '@/helpers';
import { motion } from 'framer-motion';
import {
  RefreshCw, AlertTriangle, TrendingUp, TrendingDown,
} from 'lucide-react';

export default function DailyPremiumPage() {
  const [selectedDay, setSelectedDay] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const { data, isLoading, error, saveDailySummary, refetch } =
    useDailySummary(selectedDay);
  const { products, categories } = useApp();

  const closingForm = useMemo(
    () => ({
      realCustomers: data?.saved?.realCustomers ?? 0,
      realSales: data?.saved?.realSales ?? 0,
      realPurchases: data?.saved?.realPurchases ?? 0,
      realExpenses: data?.saved?.realExpenses ?? 0,
      realCashStart: data?.saved?.realCashStart ?? 0,
      realCashEnd: data?.saved?.realCashEnd ?? 0,
      realPos: data?.saved?.realPos ?? 0,
      realBank: data?.saved?.realBank ?? 0,
      note: data?.saved?.note ?? '',
    }),
    [data]
  );

  const handleSave = useCallback(
    (updated: typeof closingForm) => {
      saveDailySummary({ ...updated, date: selectedDay });
    },
    [saveDailySummary, selectedDay]
  );

  const kassaSystem = useMemo(
    () => sumBalances(data?.system?.systemBalances),
    [data]
  );

  const dayHealthScore = useMemo(() => {
    if (!data) return 100;
    const { system, computed } = data;
    let score = 100;
    const gapSalesRatio =
      system.salesTotal > 0 ? Math.abs(computed.diffSales) / system.salesTotal : 0;
    if (gapSalesRatio > 0.1) score -= 25;
    else if (gapSalesRatio > 0.05) score -= 10;

    const expRatio =
      system.salesTotal > 0 ? system.expensesTotal / system.salesTotal : 0;
    if (expRatio > 0.6) score -= 20;
    else if (expRatio > 0.4) score -= 10;

    if (computed.realProfit < 0) score -= 20;
    if (computed.diffKassa !== 0) score -= 15;

    return Math.max(0, Math.min(100, score));
  }, [data]);

  const dayTag = useMemo(() => {
    const realProfit = data?.computed?.realProfit ?? 0;
    if (dayHealthScore >= 85 && realProfit > 0)
      return { label: 'Super Gün', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (dayHealthScore >= 60 && realProfit >= 0)
      return { label: 'Normal Gün', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (realProfit < 0)
      return { label: 'Zərərlə Gün', color: 'bg-red-100 text-red-800 border-red-300' };
    return { label: 'Riskli Gün', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }, [dayHealthScore, data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Günlük məlumatlar yüklənir...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center px-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-xl font-semibold text-red-600">Xəta baş verdi</p>
        <p className="text-sm text-slate-500 mt-2">
          {(error as Error)?.message || 'Məlumat yüklənə bilmədi'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-5 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Yenidən cəhd et
        </button>
      </div>
    );
  }

  const { system, computed, orders } = data;
  const comparisonItems = [
    { label: 'Satış', system: system.salesTotal, real: closingForm.realSales },
    { label: 'Müştəri', system: system.customerCount, real: closingForm.realCustomers, integer: true },
    { label: 'Kassa', system: kassaSystem, real: computed.kassaReal },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 px-3 py-4 md:px-6 md:py-6 space-y-6 print:bg-white print:px-0">
      <DailyHeader
        selectedDay={selectedDay}
        onDayChange={setSelectedDay}
        systemMetrics={system}
        closingForm={closingForm}
        realProfit={computed.realProfit}
        systemProfit={system.systemProfit}
        purchasesTotal={system.purchasesTotal}
        expensesTotal={system.expensesTotal}
        kassaReal={computed.kassaReal}
        kassaSystem={kassaSystem}
        diffSales={computed.diffSales}
        diffCustomers={computed.diffCustomers}
        diffKassa={computed.diffKassa}
        dayHealthScore={dayHealthScore}
        dayTag={dayTag}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStatCard
          label="Ümumi gəlir"
          value={currency(system.salesTotal)}
          trend={system.salesTotal > 0 ? 'up' : 'down'}
        />
        <QuickStatCard
          label="Xərclər"
          value={currency(system.expensesTotal)}
          trend="down"
          danger
        />
        <QuickStatCard
          label="Sistem mənfəət"
          value={currency(system.systemProfit)}
          trend={system.systemProfit >= 0 ? 'up' : 'down'}
          highlight
        />
        <QuickStatCard
          label="Real mənfəət"
          value={currency(computed.realProfit)}
          trend={computed.realProfit > system.systemProfit ? 'up' : 'down'}
          highlight
        />
      </div>

      <KpiRows
        systemMetrics={system}
        closingForm={closingForm}
        systemProfit={system.systemProfit}
        realProfit={computed.realProfit}
        dayHealthScore={dayHealthScore}
        dayTag={dayTag}
        diffCustomers={computed.diffCustomers}
        diffSales={computed.diffSales}
        diffKassa={computed.diffKassa}
        expensesTotal={system.expensesTotal}
        avgTicket={system.avgTicket}
        cashPayments={system.cashPayments}
        cardPayments={system.cardPayments}
        totalDiscount={system.totalDiscount}
        totalDelivery={system.totalDelivery}
      />

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-100 bg-white/95 p-5 shadow-lg"
      >
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          Real vs Sistem Müqayisəsi
        </h3>
        <div className="space-y-3">
          {comparisonItems.map((item) => {
            const diff = item.real - item.system;
            const percent = item.system > 0 ? (Math.abs(diff) / item.system) * 100 : 0;
            const barWidth = Math.min(percent, 100);
            const isPositive = diff >= 0;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-20 text-xs font-semibold text-slate-600">{item.label}</span>
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-red-400'}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="text-xs w-16 text-right font-mono text-slate-700">
                  {isPositive ? '+' : ''}{item.integer ? diff.toFixed(0) : currency(Math.abs(diff))}
                </span>
              </div>
            );
          })}
        </div>
      </motion.section>

      <SaleSystem
        closingForm={closingForm}
        onClosingFormChange={handleSave}
        systemMetrics={system}
        purchasesTotal={system.purchasesTotal}
        expensesTotal={system.expensesTotal}
        systemProfit={system.systemProfit}
        kassaSystem={kassaSystem}
        kassaReal={computed.kassaReal}
        systemBalances={system.systemBalances}
        dayOrders={orders ?? []}
        selectedDay={selectedDay}
      />

      <DailyCharts
        dayOrders={orders ?? []}
        productBreakdown={system.productBreakdown ?? []}
        hourlySales={system.hourlySales ?? []}
        products={products}
        categories={categories}
      />

      <DailyOrdersTable orders={orders ?? []} />

      <Dailychecklist
        dayOrders={orders ?? []}
        products={products}
        systemBalances={system.systemBalances}
        kassaSystem={kassaSystem}
        kassaReal={computed.kassaReal}
        closingForm={closingForm}
        systemMetrics={system}
        diffSales={computed.diffSales}
        diffKassa={computed.diffKassa}
        realProfit={computed.realProfit}
        expensesTotal={system.expensesTotal}
      />
    </main>
  );
}

function QuickStatCard({
  label,
  value,
  trend,
  highlight,
  danger,
}: {
  label: string;
  value: string;
  trend: 'up' | 'down';
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white/90 border border-slate-100 p-3 shadow-sm">
      <p className="text-[11px] text-slate-500 font-medium">{label}</p>
      <p className={`text-lg font-extrabold mt-1 ${highlight ? 'text-emerald-700' : 'text-slate-800'}`}>
        {value}
      </p>
      <div className="flex items-center gap-1 mt-1">
        {trend === 'up' ? (
          <TrendingUp className={`w-3.5 h-3.5 ${danger ? 'text-red-500' : 'text-emerald-500'}`} />
        ) : (
          <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
        )}
        <span className="text-[10px] text-slate-500">{trend === 'up' ? 'Artım' : 'Azalma'}</span>
      </div>
    </div>
  );
}