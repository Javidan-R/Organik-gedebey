/**
 * Production-Ready Caching System
 * 
 * Multi-layer caching strategy with memory cache, Redis cache,
 * and HTTP cache headers for optimal performance.
 */

import { logger } from './logger';

// ============================================
// CACHE CONFIGURATION
// ============================================

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize?: number; // Maximum number of items in memory cache
  tags?: string[]; // Cache tags for invalidation
}

export const CACHE_CONFIGS = {
  // Short-lived cache for frequently changing data
  SHORT: { ttl: 60, maxSize: 1000 }, // 1 minute
  
  // Medium-lived cache for moderately changing data
  MEDIUM: { ttl: 300, maxSize: 500 }, // 5 minutes
  
  // Long-lived cache for rarely changing data
  LONG: { ttl: 3600, maxSize: 200 }, // 1 hour
  
  // Very long-lived cache for static data
  STATIC: { ttl: 86400, maxSize: 100 }, // 24 hours
} as const;

// ============================================
// MEMORY CACHE
// ============================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  tags: string[];
}

class MemoryCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, value: T, ttl: number, tags: string[] = []): void {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + ttl * 1000,
      tags,
    };

    // Evict oldest entry if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, entry);
    logger.debug('Memory cache set', { key, ttl, tags });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug('Memory cache expired', { key });
      return null;
    }

    logger.debug('Memory cache hit', { key });
    return entry.value;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    logger.debug('Memory cache invalidated by tag', { tag, count });
    return count;
  }

  clear(): void {
    this.cache.clear();
    logger.debug('Memory cache cleared');
  }

  cleanup(): number {
    const now = Date.now();
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      logger.debug('Memory cache cleanup', { count });
    }
    
    return count;
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Would need to track hits/misses
    };
  }
}

// ============================================
// REDIS CACHE
// ============================================

class RedisCache {
  private redis: any = null;
  private enabled: boolean = false;

  constructor() {
    try {
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const { Redis } = require('@upstash/redis');
        this.redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
          enableAutoPipelining: true,
          enableTelemetry: false,
        });
        this.enabled = true;
        logger.info('Redis cache initialized');
      }
    } catch (error) {
      logger.warn('Failed to initialize Redis cache', { error });
    }
  }

  async set(key: string, value: any, ttl: number, tags: string[] = []): Promise<void> {
    if (!this.enabled) return;

    try {
      const data = JSON.stringify({ value, tags });
      await this.redis.setex(key, ttl, data);
      logger.debug('Redis cache set', { key, ttl, tags });
    } catch (error) {
      logger.error('Redis cache set error', { error, key });
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.enabled) return null;

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      logger.debug('Redis cache hit', { key });
      return parsed.value;
    } catch (error) {
      logger.error('Redis cache get error', { error, key });
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      await this.redis.del(key);
      logger.debug('Redis cache delete', { key });
      return true;
    } catch (error) {
      logger.error('Redis cache delete error', { error, key });
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    if (!this.enabled) return 0;

    try {
      // This would require a more complex setup with Redis sets for tags
      // For now, we'll skip this
      logger.warn('Redis cache tag invalidation not implemented', { tag });
      return 0;
    } catch (error) {
      logger.error('Redis cache tag invalidation error', { error, tag });
      return 0;
    }
  }

  async clear(): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.redis.flushdb();
      logger.debug('Redis cache cleared');
    } catch (error) {
      logger.error('Redis cache clear error', { error });
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}

// ============================================
// MULTI-LAYER CACHE
// ============================================

class CacheManager {
  private memoryCache: MemoryCache;
  private redisCache: RedisCache;

  constructor() {
    this.memoryCache = new MemoryCache(1000);
    this.redisCache = new RedisCache();

    // Auto-cleanup memory cache every 5 minutes
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => this.memoryCache.cleanup(), 5 * 60 * 1000);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    // Try memory cache first
    const memoryValue = this.memoryCache.get<T>(key);
    if (memoryValue !== null) {
      return memoryValue;
    }

    // Try Redis cache
    const redisValue = await this.redisCache.get<T>(key);
    if (redisValue !== null) {
      // Populate memory cache
      this.memoryCache.set(key, redisValue, 300, []); // Default 5 min TTL
      return redisValue;
    }

    return null;
  }

  async set(key: string, value: any, config: CacheConfig): Promise<void> {
    // Set in memory cache
    this.memoryCache.set(key, value, config.ttl, config.tags || []);

    // Set in Redis cache
    await this.redisCache.set(key, value, config.ttl, config.tags || []);
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await this.redisCache.delete(key);
  }

  async invalidateByTag(tag: string): Promise<void> {
    this.memoryCache.invalidateByTag(tag);
    await this.redisCache.invalidateByTag(tag);
  }

  async clear(): Promise<void> {
    this.memoryCache.clear();
    await this.redisCache.clear();
  }

  getStats() {
    return {
      memory: this.memoryCache.getStats(),
      redis: {
        enabled: this.redisCache.isEnabled(),
      },
    };
  }
}

export const cacheManager = new CacheManager();

// ============================================
// CACHE HELPERS
// ============================================

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig = CACHE_CONFIGS.MEDIUM
): Promise<T> {
  // Try to get from cache
  const cached = await cacheManager.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await cacheManager.set(key, data, config);

  return data;
}

export async function invalidateCache(key: string): Promise<void> {
  await cacheManager.delete(key);
}

export async function invalidateCacheByTag(tag: string): Promise<void> {
  await cacheManager.invalidateByTag(tag);
}

export async function clearCache(): Promise<void> {
  await cacheManager.clear();
}

// ============================================
// CACHE HEADERS
// ============================================

export function getCacheHeaders(ttl: number): HeadersInit {
  return {
    'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
    'CDN-Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
  };
}

export function getNoCacheHeaders(): HeadersInit {
  return {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

// ============================================
// CACHE DECORATOR
// ============================================

export function withCache<T extends any[], R>(
  keyPrefix: string,
  config: CacheConfig = CACHE_CONFIGS.MEDIUM,
  keyGenerator?: (...args: T) => string
) {
  return async (fn: (...args: T) => Promise<R>, ...args: T): Promise<R> => {
    const key = keyGenerator 
      ? `${keyPrefix}:${keyGenerator(...args)}`
      : `${keyPrefix}:${JSON.stringify(args)}`;

    return getCached(key, () => fn(...args), config);
  };
}
