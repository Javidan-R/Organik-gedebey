// ============================================================
// src/lib/cache/dashboardCache.ts
// PHASE 2 (yenilənib) — Dashboard API cavabları üçün Redis cache
// ============================================================
//
// Layihədə artıq "@upstash/redis" asılılığı var (package.json),
// ona görə əlavə paket lazım deyil. Yalnız aşağıdakı env-lər lazımdır:
//   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
//   UPSTASH_REDIS_REST_TOKEN=...
//
// QEYD (bugfix): əvvəlki versiya yalnız env-in MÖVCUDLUĞUNU yoxlayırdı,
// FORMATINI yox. Env `.env`-də placeholder ("https://...") kimi qalıbsa,
// `new Redis()` throw edirdi və bu, BÜTÜN dashboard route-larını 500-ə
// salırdı. İndi URL formatı yoxlanılır və Redis client konstruktoru
// try/catch içindədir — səhv konfiqurasiya "no-op cache" rejiminə keçir,
// heç bir API-ni sındırmır.

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
let redisInitAttempted = false;
let redisDisabledReason: string | null = null;

function isValidUpstashUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Real Upstash REST URL-i https://<xxx>.upstash.io formatındadır.
    // Placeholder-ları ("https://...", "your-url-here" və s.) rədd edirik.
    return parsed.protocol === 'https:' && parsed.hostname.length > 3 && parsed.hostname !== '...';
  } catch {
    return false;
  }
}

function getRedis(): Redis | null {
  if (redisInitAttempted) return redis;
  redisInitAttempted = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisDisabledReason = 'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN təyin olunmayıb';
    return null;
  }

  if (!isValidUpstashUrl(url)) {
    redisDisabledReason = `UPSTASH_REDIS_REST_URL etibarsız formatdadır (placeholder ola bilər): "${url}"`;
    console.warn(`[dashboardCache] ${redisDisabledReason} — cache söndürülür, birbaşa DB istifadə olunacaq.`);
    return null;
  }

  try {
    redis = new Redis({ url, token });
    return redis;
  } catch (error) {
    redisDisabledReason = `Redis client yaradılmadı: ${error instanceof Error ? error.message : String(error)}`;
    console.warn(`[dashboardCache] ${redisDisabledReason}`);
    return null;
  }
}

/**
 * fn() nəticəsini `ttlSeconds` müddətinə Redis-də saxlayır.
 * Redis konfiqurasiya olunmayıbsa/etibarsızdırsa, sadəcə fn()-i hər dəfə
 * çağırır — HEÇ VAXT bunun görə API xətası atmır.
 */
export async function getCachedOrCompute<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  const client = getRedis();

  if (!client) {
    return { data: await fn(), cached: false };
  }

  try {
    const cached = await client.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return { data: cached, cached: true };
    }
  } catch (error) {
    console.warn('[dashboardCache] Redis GET uğursuz oldu, DB-dən oxunur:', error);
  }

  const fresh = await fn();

  try {
    await client.set(key, fresh, { ex: ttlSeconds });
  } catch (error) {
    console.warn('[dashboardCache] Redis SET uğursuz oldu:', error);
  }

  return { data: fresh, cached: false };
}

/** Snapshot yenidən hesablandıqda (cron və ya manual refresh) çağırılmalıdır */
export async function invalidateDashboardCache(prefix = 'dashboard:'): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    let cursor = 0;
    do {
      const [nextCursor, keys] = await client.scan(cursor, { match: `${prefix}*`, count: 200 });
      if (keys.length > 0) await client.del(...keys);
      cursor = Number(nextCursor);
    } while (cursor !== 0);
  } catch (error) {
    console.warn('[dashboardCache] invalidate uğursuz oldu:', error);
  }
}

/** Bugünün göstəriciləri tez-tez dəyişdiyi üçün qısa TTL, keçmiş günlər üçün uzun TTL */
export function ttlForRange(endDateExclusive: string): number {
  const todayStr = new Date().toISOString().slice(0, 10);
  const includesToday = endDateExclusive > todayStr;
  return includesToday ? 60 : 60 * 60 * 6; // bugünü əhatə edirsə 60san, əks halda 6 saat
}

/** Debug/health-check üçün — cache aktivdirmi, deyilsə niyə? */
export function getDashboardCacheStatus(): { enabled: boolean; reason: string | null } {
  const client = getRedis();
  return { enabled: client !== null, reason: redisDisabledReason };
}