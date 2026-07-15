// ============================================================
// src/app/api/dashboard/summary/route.ts
// PHASE 2 — GET /api/dashboard/summary?range=last7
// GET /api/dashboard/summary?range=custom&startDate=2026-06-01&endDate=2026-06-30
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { resolveDashboardRangeFromSearchParams } from '@/lib/dashboard/dateRanges';
import { getKpiComparison, getRevenueTimeseries, getCouponUsageTotals } from '@/lib/db/repositories/analyticsRepository';
import { getCachedOrCompute, ttlForRange } from '@/lib/cache/dashboardCache';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const range = resolveDashboardRangeFromSearchParams(searchParams);

    const cacheKey = `dashboard:summary:${range.key}:${range.startDate}:${range.endDate}`;
    const ttl = ttlForRange(range.endDate);

    const { data, cached } = await getCachedOrCompute(cacheKey, ttl, async () => {
      const [kpis, timeseries, coupons] = await Promise.all([
        getKpiComparison(range.startDate, range.endDate),
        getRevenueTimeseries(range.startDate, range.endDate),
        getCouponUsageTotals(range.startDate, range.endDate),
      ]);
      return { kpis, timeseries, coupons };
    });

    return NextResponse.json({ range, ...data, cached });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[dashboard/summary] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}