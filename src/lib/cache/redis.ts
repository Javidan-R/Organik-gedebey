import { Redis } from '@upstash/redis';

// Redis cache configuration for advanced caching strategies
let redis: Redis | null = null;

export function getRedisClient() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;
  
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data as string) : null;
  } catch (error) {
    console.error('[Cache Get Error]', error);
    return null;
  }
}

export async function cacheSet(key: string, value: any, ttl: number = 3600): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  
  try {
    await client.set(key, JSON.stringify(value), { ex: ttl });
  } catch (error) {
    console.error('[Cache Set Error]', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  
  try {
    await client.del(key);
  } catch (error) {
    console.error('[Cache Delete Error]', error);
  }
}

export async function cacheInvalidatePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  } catch (error) {
    console.error('[Cache Invalidate Error]', error);
  }
}
