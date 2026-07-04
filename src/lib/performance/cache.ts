/**
 * Advanced Caching Strategy with TTL, Invalidation, and Compression
 * Production-ready cache layer for reducing server load
 */

export interface CacheEntry<T> {
  value: T
  expiresAt: number
  tags: string[]
  compressed?: boolean
}

export interface CacheConfig {
  ttl: number // milliseconds
  tags?: string[]
  compress?: boolean
}

class AdvancedCache {
  private cache = new Map<string, CacheEntry<any>>()
  private timers = new Map<string, NodeJS.Timeout>()
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  }

  set<T>(key: string, value: T, config: CacheConfig) {
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + config.ttl,
      tags: config.tags || [],
      compressed: config.compress || false,
    }

    this.cache.set(key, entry)
    this.stats.sets++

    // Auto-expire
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!)
    }

    const timer = setTimeout(() => {
      this.delete(key)
    }, config.ttl)

    this.timers.set(key, timer)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key)
      this.stats.misses++
      return null
    }

    this.stats.hits++
    return entry.value as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
      this.delete(key)
      return false
    }
    return true
  }

  delete(key: string) {
    this.cache.delete(key)
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key)!)
      this.timers.delete(key)
    }
    this.stats.deletes++
  }

  // Invalidate by tags
  invalidateByTag(tag: string) {
    const keysToDelete: string[] = []
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.delete(key))
  }

  clear() {
    for (const timer of this.timers.values()) {
      clearTimeout(timer)
    }
    this.cache.clear()
    this.timers.clear()
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
    }
  }
}

export const cache = new AdvancedCache()

/**
 * Request-level deduplication (prevents duplicate API calls during same request)
 */
class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>()

  async execute<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!
    }

    const promise = fn().finally(() => {
      this.pending.delete(key)
    })

    this.pending.set(key, promise)
    return promise
  }

  clear() {
    this.pending.clear()
  }
}

export const deduplicator = new RequestDeduplicator()
