// src/hooks/useDashboard.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/lib/fetch-admin';

export type DashboardSummary = {
  totalOrders: number;
  totalRevenue: number;
  netProfit: number;
  totalDiscount: number;
  totalDeliveryFee: number;
  avgOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  returnedOrders: number;
  newCustomers: number;
  returningCustomers: number;
  inventoryValue: number;
  lowStockCount: number;
};

export type RevenueByPeriod = {
  date: string;
  revenue: number;
  orders: number;
};

export type TopProduct = {
  productId: string;
  productName: string;
  totalQty: number;
  totalRevenue: number;
};

export type TopCategory = {
  categoryId: string;
  categoryName: string;
  totalRevenue: number;
};

export type CustomerSegments = {
  newCustomers: number;
  returningCustomers: number;
};

export type LowStockProduct = {
  productId: string;
  variantId: string;
  variantName: string;
  stock: number;
  minStock: number;
  productName: string;
};

export type OrdersByHour = {
  hour: number;
  orderCount: number;
};

export type KpiComparisons = {
  revenueGrowth: number | null;
  orderGrowth: number | null;
};

export type DashboardData = {
  summary: DashboardSummary;
  revenueByPeriod: RevenueByPeriod[];
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  customerSegments: CustomerSegments | null;
  lowStockProducts: LowStockProduct[];
  ordersByHour: OrdersByHour[];
  kpiComparisons: KpiComparisons;
};

export function useDashboard(period: string, start?: string, end?: string) {
  const params = new URLSearchParams({ period });
  if (start) params.set('start', start);
  if (end) params.set('end', end);

  return useQuery<DashboardData>({
    queryKey: ['dashboard', period, start, end],
    queryFn: () => adminFetch(`/api/admin/dashboard?${params.toString()}`),
    staleTime: 1000 * 60 * 5, // 5 dəqiqə cache
    refetchOnWindowFocus: true,
    retry: 2,
  });
}