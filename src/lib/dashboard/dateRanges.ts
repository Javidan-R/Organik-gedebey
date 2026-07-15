// ============================================================
// src/lib/dashboard/dateRanges.ts
// PHASE 2 — Dashboard filter → { startDate, endDate } çeviricisi
// ============================================================
//
// Bütün analyticsRepository funksiyaları [startDate, endDate) yarımaçıq
// aralıq gözləyir (endDate DAXİL DEYİL). Bu fayl UI-dan gələn preset
// açarını ("today", "last7" və s.) və ya custom aralığı bu formata çevirir.

export type DashboardRangeKey =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisYear'
  | 'custom';

export interface ResolvedRange {
  key: DashboardRangeKey;
  startDate: string; // YYYY-MM-DD, daxildir
  endDate: string; // YYYY-MM-DD, xaric edilir (exclusive)
  label: string;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function resolveDashboardRange(
  key: string | null,
  customStart?: string | null,
  customEnd?: string | null
): ResolvedRange {
  const today = startOfToday();
  const tomorrow = addDays(today, 1);

  switch (key as DashboardRangeKey) {
    case 'yesterday': {
      const y = addDays(today, -1);
      return { key: 'yesterday', startDate: toDateStr(y), endDate: toDateStr(today), label: 'Dünən' };
    }
    case 'last7': {
      const start = addDays(today, -6);
      return { key: 'last7', startDate: toDateStr(start), endDate: toDateStr(tomorrow), label: 'Son 7 gün' };
    }
    case 'last30': {
      const start = addDays(today, -29);
      return { key: 'last30', startDate: toDateStr(start), endDate: toDateStr(tomorrow), label: 'Son 30 gün' };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { key: 'thisMonth', startDate: toDateStr(start), endDate: toDateStr(tomorrow), label: 'Bu ay' };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 1);
      return { key: 'lastMonth', startDate: toDateStr(start), endDate: toDateStr(end), label: 'Keçən ay' };
    }
    case 'thisYear': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { key: 'thisYear', startDate: toDateStr(start), endDate: toDateStr(tomorrow), label: 'Bu il' };
    }
    case 'custom': {
      if (!customStart || !customEnd) {
        throw new Error('custom aralıq üçün startDate və endDate tələb olunur');
      }
      // customEnd istifadəçidən "daxil olan son gün" kimi gəlir — exclusive-ə çeviririk
      const endExclusive = toDateStr(addDays(new Date(customEnd), 1));
      return { key: 'custom', startDate: customStart, endDate: endExclusive, label: 'Seçilmiş aralıq' };
    }
    case 'today':
    default: {
      return { key: 'today', startDate: toDateStr(today), endDate: toDateStr(tomorrow), label: 'Bu gün' };
    }
  }
}

/** API route-larda query-dən oxumaq üçün qısayol */
export function resolveDashboardRangeFromSearchParams(searchParams: URLSearchParams): ResolvedRange {
  return resolveDashboardRange(
    searchParams.get('range'),
    searchParams.get('startDate'),
    searchParams.get('endDate')
  );
}