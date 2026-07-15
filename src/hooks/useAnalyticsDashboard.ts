// ============================================================
// src/hooks/useDashboard.ts
// PHASE 2 — Dashboard React Query hook-ları
// (mövcud useDailyMetrics.ts ilə eyni pattern: adminFetch + useQuery)
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/lib/fetch-admin';
import type { DashboardRangeKey } from '@/lib/dashboard/dateRanges';

function buildRangeQuery(range: DashboardRangeKey, customStart?: string, customEnd?: string) {
  const params = new URLSearchParams({ range });
  if (range === 'custom' && customStart && customEnd) {
    params.set('startDate', customStart);
    params.set('endDate', customEnd);
  }
  return params.toString();
}

export type DashboardSummary = {
  range: { key: string; startDate: string; endDate: string; label: string };
  kpis: {
    current: Record<string, number | string>;
    previous: Record<string, number | string>;
    growth: {
      revenueGrowthPct: number;
      profitGrowthPct: number;
      ordersGrowthPct: number;
      customerGrowthPct: number;
    };
  };
  timeseries: Array<{ date: string; netRevenue: string; ordersTotal: number; netProfit: string }>;
  coupons: { usageCount: number; totalDiscount: string };
  cached: boolean;
};

export function useDashboardSummary(range: DashboardRangeKey, customStart?: string, customEnd?: string) {
  const qs = buildRangeQuery(range, customStart, customEnd);
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary', range, customStart, customEnd],
    queryFn: () => adminFetch(`/api/dashboard/summary?${qs}`),
    staleTime: 1000 * 60, // 1 dəq — server-tərəfdə Redis artıq cache edir
  });
}

export type ProductStat = { productId: string; productName: string; totalQty: number; totalRevenue: string };

export function useDashboardProducts(
  range: DashboardRangeKey,
  sort: 'top' | 'least' | 'top-qty' = 'top',
  limit = 10,
  customStart?: string,
  customEnd?: string
) {
  const qs = buildRangeQuery(range, customStart, customEnd);
  return useQuery<{ products: ProductStat[] }>({
    queryKey: ['dashboard-products', range, sort, limit, customStart, customEnd],
    queryFn: () => adminFetch(`/api/dashboard/products?${qs}&sort=${sort}&limit=${limit}`),
    staleTime: 1000 * 60,
  });
}

export type CategoryStat = { categoryId: string; categoryName: string; totalQty: number; totalRevenue: string };
export type HourlyStat = { hour: number; ordersCount: number; revenue: string };

export function useDashboardBreakdown(range: DashboardRangeKey, customStart?: string, customEnd?: string) {
  const qs = buildRangeQuery(range, customStart, customEnd);
  return useQuery<{ categories: CategoryStat[]; hourly: HourlyStat[] }>({
    queryKey: ['dashboard-breakdown', range, customStart, customEnd],
    queryFn: () => adminFetch(`/api/dashboard/breakdown?${qs}`),
    staleTime: 1000 * 60,
  });
}

export type InventoryAlerts = {
  lowStockCount: number;
  outOfStockCount: number;
  lowStock: Array<{ variantId: string; productName: string; variantName: string; stock: number; minStock: number; unit: string | null }>;
  outOfStock: Array<{ variantId: string; productName: string; variantName: string }>;
};

export function useInventoryAlerts() {
  return useQuery<InventoryAlerts>({
    queryKey: ['dashboard-inventory-alerts'],
    queryFn: () => adminFetch('/api/dashboard/inventory-alerts'),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // 1 dəqiqədə bir avtomatik yenilənir
  });
}

export type ForecastPoint = { date: string; predicted: number; lowerBound: number; upperBound: number };
export type StockRiskItem = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  unit: string | null;
  currentStock: number;
  minStock: number | null;
  avgDailyQty: number;
  daysUntilStockout: number | null;
  coversTomorrow: boolean;
  riskLevel: 'critical' | 'warning' | 'ok' | 'unknown';
};

export type DashboardForecast = {
  revenueForecast: {
    points: ForecastPoint[];
    trend: 'artan' | 'azalan' | 'sabit';
    trendSlopePerDay: number;
    r2: number;
  };
  stockRisk: StockRiskItem[];
  stockRiskSummary: { criticalCount: number; warningCount: number; notCoveringTomorrowCount: number };
};

export function useDashboardForecast(historyDays = 30, daysAhead = 7, velocityDays = 14) {
  return useQuery<DashboardForecast>({
    queryKey: ['dashboard-forecast', historyDays, daysAhead, velocityDays],
    queryFn: () =>
      adminFetch(
        `/api/dashboard/forecast?historyDays=${historyDays}&daysAhead=${daysAhead}&velocityDays=${velocityDays}`
      ),
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 10,
  });
}

export function useRecomputeSnapshot() {
  return async (date: string) => {
    return adminFetch('/api/cron/analytics', { method: 'POST', body: { date } });
  };
}