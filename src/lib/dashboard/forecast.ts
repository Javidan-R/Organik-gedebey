// ============================================================
// src/lib/dashboard/forecast.ts
// PHASE 3 — Proqnozlaşdırma (forecasting) — DB-dən asılı olmayan
// təmiz riyazi funksiyalar. Test etmək asandır, heç bir side-effect yoxdur.
//
// QEYD: layihədə tsconfig.json-da `noUncheckedIndexedAccess: true` aktivdir
// (strict TypeScript), ona görə bu fayl heç yerdə birbaşa `array[i]` ilə
// oxuma etmir — bunun əvəzinə forEach/reduce və explicit undefined check
// istifadə olunur.
// ============================================================

export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export interface ForecastResult {
  points: ForecastPoint[];
  trend: 'artan' | 'azalan' | 'sabit';
  trendSlopePerDay: number;
  method: 'linear-regression';
  historyDays: number;
  r2: number; // 0-1, model nə qədər "izah edici"dir
}

/**
 * Ən kiçik kvadratlar (least-squares) üsulu ilə xətti reqressiya.
 * x = 0..n-1 (gün indeksi), y = dəyər (məs. gündəlik dövriyyə)
 *
 * `values.forEach` istifadə olunur ki, `values[i]` kimi indexed access
 * lazım olmasın (noUncheckedIndexedAccess bunu `number | undefined` edir).
 */
function linearRegression(values: number[]): { slope: number; intercept: number; r2: number } {
  const n = values.length;
  if (n === 0) return { slope: 0, intercept: 0, r2: 0 };
  if (n === 1) {
    const only = values[0] ?? 0;
    return { slope: 0, intercept: only, r2: 0 };
  }

  const meanX = (n - 1) / 2; // x = 0..n-1 üçün orta qiymət
  const meanY = values.reduce((s, y) => s + y, 0) / n;

  let numerator = 0;
  let denominator = 0;
  values.forEach((y, x) => {
    numerator += (x - meanX) * (y - meanY);
    denominator += (x - meanX) ** 2;
  });
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  // R² (determination coefficient)
  let ssRes = 0;
  let ssTot = 0;
  values.forEach((y, x) => {
    const predicted = intercept + slope * x;
    ssRes += (y - predicted) ** 2;
    ssTot += (y - meanY) ** 2;
  });
  const r2 = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);

  return { slope, intercept, r2 };
}

function stdDev(values: number[], mean: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Tarixi seriyadan (məs. son 30-60 günün gündəlik dövriyyəsi) növbəti
 * `daysAhead` gün üçün xətti trend proqnozu qurur, ± 1 standart kənarlaşma
 * ilə etibarlılıq intervalı (confidence band) verir.
 */
export function forecastLinear(history: TimeseriesPoint[], daysAhead = 7): ForecastResult {
  const values = history.map((p) => Math.max(0, p.value));
  const { slope, intercept, r2 } = linearRegression(values);
  const mean = values.reduce((s, v) => s + v, 0) / Math.max(1, values.length);
  const sd = stdDev(values, mean);

  const lastPoint = history.length > 0 ? history[history.length - 1] : undefined;
  const lastDate = lastPoint ? new Date(lastPoint.date) : new Date();
  const n = values.length;

  const points: ForecastPoint[] = [];
  for (let i = 1; i <= daysAhead; i++) {
    const x = n - 1 + i;
    const predictedRaw = intercept + slope * x;
    const predicted = Math.max(0, predictedRaw);
    const band = sd * 1; // ~68% etibarlılıq intervalı
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);
    points.push({
      date: date.toISOString().slice(0, 10),
      predicted: Math.round(predicted * 100) / 100,
      lowerBound: Math.round(Math.max(0, predicted - band) * 100) / 100,
      upperBound: Math.round((predicted + band) * 100) / 100,
    });
  }

  const trend: ForecastResult['trend'] =
    Math.abs(slope) < mean * 0.01 ? 'sabit' : slope > 0 ? 'artan' : 'azalan';

  return {
    points,
    trend,
    trendSlopePerDay: Math.round(slope * 100) / 100,
    method: 'linear-regression',
    historyDays: n,
    r2: Math.round(r2 * 1000) / 1000,
  };
}

/**
 * Bir məhsulun son N günlük satış tempinə (velocity) əsasən neçə günə
 * stokun tükənəcəyini hesablayır. "Sabah sifarişləri qarşılamaq üçün stok
 * kifayət edirmi?" sualının riyazi əsasıdır.
 */
export function estimateStockoutRisk(params: {
  currentStock: number;
  qtySoldLastNDays: number;
  nDays: number;
}): {
  avgDailyQty: number;
  daysUntilStockout: number | null; // null = satış yoxdur, proqnoz mümkün deyil
  coversTomorrow: boolean;
  riskLevel: 'critical' | 'warning' | 'ok' | 'unknown';
} {
  const { currentStock, qtySoldLastNDays, nDays } = params;
  const avgDailyQty = nDays > 0 ? qtySoldLastNDays / nDays : 0;

  if (avgDailyQty <= 0) {
    return { avgDailyQty: 0, daysUntilStockout: null, coversTomorrow: currentStock > 0, riskLevel: 'unknown' };
  }

  const daysUntilStockout = currentStock / avgDailyQty;
  const coversTomorrow = currentStock >= avgDailyQty;

  let riskLevel: 'critical' | 'warning' | 'ok' = 'ok';
  if (daysUntilStockout <= 1) riskLevel = 'critical';
  else if (daysUntilStockout <= 3) riskLevel = 'warning';

  return {
    avgDailyQty: Math.round(avgDailyQty * 100) / 100,
    daysUntilStockout: Math.round(daysUntilStockout * 10) / 10,
    coversTomorrow,
    riskLevel,
  };
}