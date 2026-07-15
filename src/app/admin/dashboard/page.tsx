// ============================================================
// src/app/admin/dashboard/page.tsx
// PHASE 4 — CEO / Executive Dashboard — TAM olaraq real API-lara bağlıdır.
//
// QEYD: Bu fayl əvvəlki versiyanı tamamilə əvəz edir. Əvvəlki versiya
// `@/hooks/useDashboard`-dan bir `useDashboard(period)` funksiyası və
// `@/components/admin/dashboard/DashboardSkeleton` importu edirdi —
// hər ikisi repoda mövcud deyildi (build zamanı xəta verirdi). Bu versiya
// Phase 1-3-də qurulan real endpoint/hook-lardan istifadə edir və hər
// widget öz skeleton/loading vəziyyətini özü idarə edir.
// ============================================================
'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, RefreshCw, AlertTriangle, Percent, Ticket, Truck } from 'lucide-react';
import RangeSelector from '@/components/admin/dashboard/RangeSelector';
import ExecutiveKpiCards from '@/components/admin/dashboard/ExecutiveKpiCards';
import RevenueForecastChart from '@/components/admin/dashboard/RevenueForecastChart';
import TopProductsTable from '@/components/admin/dashboard/TopProductsTable';
import CategoryAndHourlyPanel from '@/components/admin/dashboard/CategoryAndHourlyPanel';
import StockRiskPanel from '@/components/admin/dashboard/StockRiskPanel';
import type { DashboardRangeKey } from '@/lib/dashboard/dateRanges';
import { currency } from '@/helpers';
import { useDashboardForecast, useDashboardSummary, useRecomputeSnapshot } from '@/hooks/useAnalyticsDashboard';

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRangeKey>('today');
  const [customStart, setCustomStart] = useState<string | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<string | undefined>(undefined);
  const [recomputing, setRecomputing] = useState(false);

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useDashboardSummary(range, customStart, customEnd);

  const { data: forecast, isLoading: forecastLoading, refetch: refetchForecast } = useDashboardForecast();
  const recomputeSnapshot = useRecomputeSnapshot();

  const handleRangeChange = (nextRange: DashboardRangeKey, start?: string, end?: string) => {
    setRange(nextRange);
    if (nextRange === 'custom') {
      setCustomStart(start);
      setCustomEnd(end);
    }
  };

  const handleRefreshAll = async () => {
    setRecomputing(true);
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      await recomputeSnapshot(yesterday.toISOString().slice(0, 10));
      await Promise.all([refetchSummary(), refetchForecast()]);
    } finally {
      setRecomputing(false);
    }
  };

  const notCoveringTomorrow = forecast?.stockRiskSummary.notCoveringTomorrowCount ?? 0;

  const secondaryKpis = useMemo(() => {
    if (!summary) return null;
    const { current } = summary.kpis;
    return [
      {
        icon: <Percent className="h-4 w-4" />,
        label: 'Endirim itkisi',
        value: currency(Number(current.discountTotal)),
      },
      {
        icon: <Ticket className="h-4 w-4" />,
        label: 'Kupon endirimi',
        value: `${currency(Number(current.couponDiscountTotal))} (${summary.coupons.usageCount} istifadə)`,
      },
      {
        icon: <Truck className="h-4 w-4" />,
        label: 'Çatdırılma gəliri',
        value: currency(Number(current.deliveryFeeTotal)),
      },
    ];
  }, [summary]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 px-4 py-6 md:px-8 md:py-8 space-y-6">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-900 flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-emerald-600" />
            CEO Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real database üzərində — {summary?.range.label ?? '...'}
            {summary?.cached && <span className="ml-2 text-[11px] text-slate-400">(keşdən)</span>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <RangeSelector value={range} customStart={customStart} customEnd={customEnd} onChange={handleRangeChange} />
          <button
            onClick={handleRefreshAll}
            disabled={recomputing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recomputing ? 'animate-spin' : ''}`} />
            Yenilə
          </button>
        </div>
      </motion.header>

      {notCoveringTomorrow > 0 && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          {notCoveringTomorrow} məhsul sabahkı gözlənilən sifarişləri qarşılamaq üçün kifayət qədər stoka malik deyil.
        </div>
      )}

      {summaryError ? (
        <div className="text-center py-20 text-red-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>Məlumatlar yüklənə bilmədi</p>
          <button
            onClick={() => refetchSummary()}
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Yenidən cəhd et
          </button>
        </div>
      ) : (
        <>
          <ExecutiveKpiCards data={summary} isLoading={summaryLoading} />

          {secondaryKpis && (
            <div className="grid gap-3 md:grid-cols-3">
              {secondaryKpis.map((k) => (
                <div key={k.label} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    {k.icon}
                    <span className="text-xs font-semibold">{k.label}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-800">{k.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueForecastChart summary={summary} forecast={forecast} isLoading={summaryLoading || forecastLoading} />
            </div>
            <StockRiskPanel />
          </div>

          <TopProductsTable range={range} customStart={customStart} customEnd={customEnd} />

          <CategoryAndHourlyPanel range={range} customStart={customStart} customEnd={customEnd} />
        </>
      )}
    </main>
  );
}