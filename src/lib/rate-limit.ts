// In-memory rate limiter for API routes (per-instance; use Upstash in multi-instance prod).

type Entry = { count: number; resetAt: number }

const stores = new Map<string, Map<string, Entry>>()

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSec: number
}
 
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function checkRateLimit(
  bucket: string,
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  let store = stores.get(bucket)
  if (!store) {
    store = new Map()
    stores.set(bucket, store)
  }

  const entry = store.get(key)
  const retryAfterSec = Math.ceil(windowMs / 1000)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, retryAfterSec }
  }

  if (entry.count >= max) {
    const remainingMs = entry.resetAt - now
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil(remainingMs / 1000)),
    }
  }

  entry.count++
  return { allowed: true, remaining: max - entry.count, retryAfterSec }
}

export function rateLimitResponse(message: string, retryAfterSec: number) {
  return {
    body: { error: message },
    status: 429,
    headers: {
      'Retry-After': String(retryAfterSec),
      'X-RateLimit-Remaining': '0',
    },
  } as const
}
