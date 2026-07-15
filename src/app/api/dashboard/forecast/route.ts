// ============================================================
// src/app/api/dashboard/forecast/route.ts
// PHASE 3 — GET /api/dashboard/forecast?historyDays=30&daysAhead=7&velocityDays=14
// ============================================================
//
// Qaytarır:
//  - revenueForecast: növbəti N günün dövriyyə proqnozu (xətti trend + interval)
//  - stockRisk: hansı variantların neçə günə tükənəcəyi, "sabahı qarşılayır?"
//
// Cavab sualı: "Sabah sifarişləri qarşılamaq üçün stok kifayət edirmi?"
// → stockRisk siyahısında coversTomorrow=false olanlar CAVABDIR.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { forecastLinear, estimateStockoutRisk } from '@/lib/dashboard/forecast';
import { getDailyRevenueHistory, getVariantSalesVelocity } from '@/lib/db/repositories/analyticsRepository';
import { getCachedOrCompute } from '@/lib/cache/dashboardCache';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']);

    const { searchParams } = new URL(request.url);
    const historyDays = Math.min(180, Math.max(7, Number(searchParams.get('historyDays') ?? 30)));
    const daysAhead = Math.min(30, Math.max(1, Number(searchParams.get('daysAhead') ?? 7)));
    const velocityDays = Math.min(90, Math.max(3, Number(searchParams.get('velocityDays') ?? 14)));

    const cacheKey = `dashboard:forecast:${historyDays}:${daysAhead}:${velocityDays}`;

    const { data, cached } = await getCachedOrCompute(cacheKey, 60 * 15, async () => {
      const [history, velocityRows] = await Promise.all([
        getDailyRevenueHistory(historyDays),
        getVariantSalesVelocity(velocityDays),
      ]);

      const revenueForecast = forecastLinear(
        history.map((h) => ({ date: h.date as unknown as string, value: Number(h.netRevenue) })),
        daysAhead
      );

      const stockRisk = velocityRows
        .map((v) => {
          const risk = estimateStockoutRisk({
            currentStock: v.currentStock,
            qtySoldLastNDays: Number(v.qtySoldLastNDays),
            nDays: velocityDays,
          });
          return {
            variantId: v.variantId,
            productId: v.productId,
            productName: v.productName,
            variantName: v.variantName,
            unit: v.unit,
            currentStock: v.currentStock,
            minStock: v.minStock,
            ...risk,
          };
        })
        // Kritik və xəbərdarlıq səviyyəli olanları önə çıxarır
        .sort((a, b) => {
          const order = { critical: 0, warning: 1, ok: 2, unknown: 3 };
          return order[a.riskLevel] - order[b.riskLevel];
        });

      const criticalCount = stockRisk.filter((r) => r.riskLevel === 'critical').length;
      const warningCount = stockRisk.filter((r) => r.riskLevel === 'warning').length;
      const notCoveringTomorrowCount = stockRisk.filter((r) => !r.coversTomorrow).length;

      return {
        revenueForecast,
        stockRisk,
        stockRiskSummary: { criticalCount, warningCount, notCoveringTomorrowCount },
      };
    });

    return NextResponse.json({ ...data, cached });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[dashboard/forecast] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}