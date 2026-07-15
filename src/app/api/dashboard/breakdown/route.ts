// ============================================================
// src/app/api/dashboard/breakdown/route.ts
// PHASE 2 — GET /api/dashboard/breakdown?range=thisMonth
// Kateqoriya üzrə gəlir bölgüsü + saatlıq satış heatmap-i birlikdə qaytarır
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { resolveDashboardRangeFromSearchParams } from '@/lib/dashboard/dateRanges';
import { getCategoryBreakdown, getHourlyHeatmap } from '@/lib/db/repositories/analyticsRepository';
import { getCachedOrCompute, ttlForRange } from '@/lib/cache/dashboardCache';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const range = resolveDashboardRangeFromSearchParams(searchParams);

    const cacheKey = `dashboard:breakdown:${range.key}:${range.startDate}:${range.endDate}`;
    const ttl = ttlForRange(range.endDate);

    const { data, cached } = await getCachedOrCompute(cacheKey, ttl, async () => {
      const [categories, hourly] = await Promise.all([
        getCategoryBreakdown(range.startDate, range.endDate),
        getHourlyHeatmap(range.startDate, range.endDate),
      ]);
      return { categories, hourly };
    });

    return NextResponse.json({ range, ...data, cached });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[dashboard/breakdown] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}