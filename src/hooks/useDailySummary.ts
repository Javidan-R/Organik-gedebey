// src/hooks/useDailySummary.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/fetch-admin';

export interface SystemMetrics {
  salesTotal: number;
  orderCount: number;
  customerCount: number;
  purchasesTotal: number;
  expensesTotal: number;
  systemProfit: number;
  avgTicket: number;
  totalDiscount: number;
  totalDelivery: number;
  totalCoupon: number;
  cashPayments: number;
  cardPayments: number;
  systemBalances: { id: string; name: string; type: string; balance: number }[];
  productBreakdown: { productName: string; totalQty: number; totalRevenue: number }[];
  hourlySales: { hour: number; label: string; sales: number; orders: number }[];
}

export interface DailyOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  status: string;
  total: string;
  paymentMethod: string;
  createdAt: string;
  discountAmount: string;
  deliveryFee: string;
  subtotal: string;
  couponDiscount: string;
  items: {
    id: string;
    productName: string;
    variantName: string;
    qty: number;
    priceAtOrder: string;
    subtotal: string;
    costAtOrder: string;
  }[];
}

export interface DailySummary {
  id?: string;
  date: string;
  realCustomers: number;
  realSales: number;
  realPurchases: number;
  realExpenses: number;
  realCashStart: number;
  realCashEnd: number;
  realPos: number;
  realBank: number;
  note: string;
}

export interface DailySummaryResponse {
  date: string;
  saved: DailySummary | null;
  orders: DailyOrder[];
  system: SystemMetrics;
  computed: {
    diffSales: number;
    diffCustomers: number;
    diffKassa: number;
    realProfit: number;
    kassaReal: number;
  };
}

export function useDailySummary(date: string) {
  const queryClient = useQueryClient();

  const query = useQuery<DailySummaryResponse>({
    queryKey: ['daily-summary', date],
    queryFn: () => adminFetch(`/api/daily/summary?date=${encodeURIComponent(date)}`),
    staleTime: 1000 * 30,
    enabled: !!date,
  });

  const mutation = useMutation({
    mutationFn: (data: Partial<DailySummary> & { date: string }) =>
      adminFetch('/api/daily/summary', {
        method: 'PUT',
        body: data,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['daily-summary', variables.date] });
    },
  });

  const saveDailySummary = (data: Partial<DailySummary> & { date: string }) =>
    mutation.mutateAsync(data);

  return {
    ...query,
    saveDailySummary,
    isSaving: mutation.isPending,
  };
}