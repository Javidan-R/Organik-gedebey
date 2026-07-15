// src/app/admin/baskets/analytics/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Download,
  RefreshCcw,
} from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { logger } from '@/lib/logger';

// ------------------------------------------------------------------
// Tiplər (API cavabına uyğun)
// ------------------------------------------------------------------
interface AnalyticsData {
  period: string;
  dateRange: { start: string; end: string };
  metrics: {
    totalBaskets: number;
    totalBasketRevenue: string;
  };
  basketTypeDistribution: Array<{
    type: string;
    count: number;
    totalStock: number;
  }>;
  topBaskets: Array<{
    basketId: string | null;
    basketName: string | null;
    totalSold: number;
    totalRevenue: string;
    details: any | null;
  }>;
  lowStockBaskets: Array<any>;
  basketSalesByType: Array<{
    basketType: string;
    totalRevenue: string;
    totalSold: number;
  }>;
}

type TimeRange = '7d' | '30d' | '90d';

// ------------------------------------------------------------------
// Sabit rəng sxemi (JIT ilə işləyən)
// ------------------------------------------------------------------
const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
  red: { bg: 'bg-red-100', text: 'text-red-600' },
};

// ------------------------------------------------------------------
// Səhifə komponenti
// ------------------------------------------------------------------
export default function BasketAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // API çağırışı
  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ period: timeRange }); // ✅ days → period
      const res = await fetch(
        `/api/admin/baskets/analytics?${params}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Analitika yüklənə bilmədi');
      }
      const data: AnalyticsData = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      logger.error('Analytics fetch error', { error: err });
      setError(err.message || 'Xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ------------------------------------------------------------------
  // Yükləmə / Xəta halları
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600">Yüklənir...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <BarChart3 className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            Analitika yüklənə bilmədi
          </h2>
          <p className="mt-2 text-sm text-gray-500">{error}</p>
          <Button
            variant="secondary"
            onClick={fetchAnalytics}
            className="mt-6"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Yenidən cəhd et
          </Button>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Hesablamalar
  // ------------------------------------------------------------------
  const totalSales = parseFloat(analytics.metrics.totalBasketRevenue) || 0;
  const totalOrders = analytics.metrics.totalBaskets || 0;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const conversionRate = 3.2; // real mənbə yoxdur, sabit; sonra order/traffic nisbəti ilə əvəz oluna bilər

  // Top basketlərə pay faizi (0‑a bölmə qoruması)
  const topBasketsWithShare = analytics.topBaskets.map((b) => ({
    ...b,
    share: totalSales > 0 ? (parseFloat(b.totalRevenue) / totalSales) * 100 : 0,
  }));

  // Satış növü üzrə faiz
  const salesByType = analytics.basketSalesByType.map((item) => ({
    type: item.basketType,
    value: totalSales > 0 ? (parseFloat(item.totalRevenue) / totalSales) * 100 : 0,
  }));

  // KPI kartları
  const kpiCards = [
    {
      label: 'Toplam Satış',
      value: `${totalSales.toLocaleString('az-AZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ₼`,
      change: '+12.5%', // hələlik sabit
      up: true,
      icon: DollarSign,
      color: 'emerald' as const,
    },
    {
      label: 'Sifariş Sayı',
      value: totalOrders,
      change: '+8.3%',
      up: true,
      icon: ShoppingCart,
      color: 'blue' as const,
    },
    {
      label: 'Orta Sifariş Dəyəri',
      value: `${avgOrderValue.toLocaleString('az-AZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ₼`,
      change: '+4.2%',
      up: true,
      icon: Package,
      color: 'purple' as const,
    },
    {
      label: 'Konversiya Nisbəti',
      value: `${conversionRate}%`,
      change: '-2.1%',
      up: false,
      icon: TrendingUp,
      color: 'orange' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Səbət Analitikası
            </h1>
            <p className="mt-1 text-gray-600">
              {analytics.period} dövrü üçün satış və performans məlumatları
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border bg-white p-1">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range === '7d' ? '7 gün' : range === '30d' ? '30 gün' : '90 gün'}
                </button>
              ))}
            </div>
            <Button variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              {/* <div className="mb-4 flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    COLOR_MAP[kpi.color].bg
                  }`}
                >
                  <kpi.icon
                    className={`h-6 w-6 ${COLOR_MAP[kpi.color].text}`}
                  />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    kpi.up ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {kpi.up ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {kpi.change}
                </div>
              </div> */}
              <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
              <div className="mt-1 text-sm text-gray-600">{kpi.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts – növə görə satış + top basketlər (günlük satış çıxarılıb) */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Satış növü üzrə pay */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Növə Görə Satış
              </h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {salesByType.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-24 text-sm capitalize text-gray-600">
                    {item.type}
                  </div>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(item.value, 100)}%` }}
                    />
                  </div>
                  <div className="w-12 text-sm font-semibold text-gray-900">
                    {item.value.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Baskets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Ən Çox Satılan Səbətlər
              </h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Səbət
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      Satış
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      Gəlir
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      Pay
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topBasketsWithShare.map((basket, idx) => (
                    <tr
                      key={basket.basketId ?? idx}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {basket.basketName || 'Adsız səbət'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {basket.totalSold}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {parseFloat(basket.totalRevenue).toLocaleString(
                          'az-AZ',
                          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                        )}{' '}
                        ₼
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-emerald-600">
                          {basket.share.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Basket növünə görə paylanma cədvəli (əlavə) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-4 text-lg font-semibold text-gray-900">
            Səbət Növü üzrə Paylanma
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                    Növ
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                    Say
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-600">
                    Ümumi Stok
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.basketTypeDistribution.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 capitalize text-gray-900">
                      {item.type}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {item.count}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {item.totalStock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}