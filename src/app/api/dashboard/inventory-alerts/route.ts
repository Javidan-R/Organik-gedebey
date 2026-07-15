// ============================================================
// src/app/api/dashboard/inventory-alerts/route.ts
// PHASE 2 — GET /api/dashboard/inventory-alerts
// Bu, CARİ stok vəziyyətini göstərir — snapshot deyil, real-time
// sorğudur, ona görə uzun müddət cache-lənmir (30 saniyə).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { getLowStockVariants, getOutOfStockVariants } from '@/lib/db/repositories/analyticsRepository';
import { getCachedOrCompute } from '@/lib/cache/dashboardCache';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']);

    const { data, cached } = await getCachedOrCompute('dashboard:inventory-alerts', 30, async () => {
      const [lowStock, outOfStock] = await Promise.all([getLowStockVariants(), getOutOfStockVariants()]);
      return { lowStock, outOfStock };
    });

    return NextResponse.json({
      lowStockCount: data.lowStock.length,
      outOfStockCount: data.outOfStock.length,
      lowStock: data.lowStock,
      outOfStock: data.outOfStock,
      cached,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[dashboard/inventory-alerts] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}