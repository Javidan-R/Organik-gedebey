// ============================================================
// src/app/api/dashboard/products/route.ts
// PHASE 2 — GET /api/dashboard/products?range=last30&sort=top&limit=10
// sort: 'top' (ən çox gəlir/satış) | 'least' (ən az satılan)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { resolveDashboardRangeFromSearchParams } from '@/lib/dashboard/dateRanges';
import { getTopProducts, getLeastSellingProducts } from '@/lib/db/repositories/analyticsRepository';
import { getCachedOrCompute, ttlForRange } from '@/lib/cache/dashboardCache';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const range = resolveDashboardRangeFromSearchParams(searchParams);
    const sort = (searchParams.get('sort') ?? 'top') as 'top' | 'least' | 'top-qty';
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 10)));

    const cacheKey = `dashboard:products:${sort}:${limit}:${range.key}:${range.startDate}:${range.endDate}`;
    const ttl = ttlForRange(range.endDate);

    const { data, cached } = await getCachedOrCompute(cacheKey, ttl, async () => {
      if (sort === 'least') {
        return getLeastSellingProducts(range.startDate, range.endDate, limit);
      }
      if (sort === 'top-qty') {
        return getTopProducts(range.startDate, range.endDate, limit, false);
      }
      return getTopProducts(range.startDate, range.endDate, limit, true);
    });

    return NextResponse.json({ range, sort, products: data, cached });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[dashboard/products] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}