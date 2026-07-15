// src/hooks/useDailyMetrics.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { adminFetch } from '@/lib/fetch-admin';

export type DailyMetrics = {
  date: string;
  revenue: number;
  orderCount: number;
  expenses: number;
  profit: number;
};

export function useDailyMetrics(date: string) {
  return useQuery<DailyMetrics>({
    queryKey: ['daily-stats', date],
    queryFn: () => adminFetch(`/api/daily/stats?date=${encodeURIComponent(date)}`),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    enabled: !!date,
    retry: 1,
  });
}