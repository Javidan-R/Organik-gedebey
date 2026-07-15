// ============================================================
// src/app/api/cron/analytics/route.ts
// PHASE 2 — Gündəlik snapshot hesablama cron endpoint-i
// ============================================================
//
// Vercel Cron hər gün 00:10-da (Bakı vaxtı üçün UTC+4 nəzərə alınıb)
// bu endpoint-i çağırır və DÜNƏNKİ günün snapshot-unu hesablayır.
// Həmçinin admin panelindən konkret tarix üçün manual POST edilə bilər.

import { NextRequest, NextResponse } from 'next/server';
import { recomputeDaySnapshot } from '@/lib/db/repositories/analyticsRepository';
import { invalidateDashboardCache } from '@/lib/cache/dashboardCache';
import { requireAuth, AuthError } from '@/lib/auth';

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ─── Vercel Cron çağırışı (GET, CRON_SECRET ilə qorunur) ───────────────────
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dateStr = yesterdayStr();
    const result = await recomputeDaySnapshot(dateStr);
    await invalidateDashboardCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[cron/analytics] GET error:', error);
    return NextResponse.json({ error: 'Snapshot hesablanmadı' }, { status: 500 });
  }
}

// ─── Admin panelindən manual "Yenidən hesabla" düyməsi (POST) ──────────────
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const body = await request.json().catch(() => ({}));
    const dateStr: string = body.date ?? yesterdayStr();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return NextResponse.json({ error: 'Tarix formatı YYYY-MM-DD olmalıdır' }, { status: 400 });
    }

    const result = await recomputeDaySnapshot(dateStr);
    await invalidateDashboardCache();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[cron/analytics] POST error:', error);
    return NextResponse.json({ error: 'Snapshot hesablanmadı' }, { status: 500 });
  }
}