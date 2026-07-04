/**
 * Optimized Data Fetching Hook
 * Wraps React Query with automatic caching and deduplication
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { cache, deduplicator } from '@/lib/performance/cache'

export interface UseOptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryFn'> {
  cacheConfig?: {
    ttl?: number
    tags?: string[]
  }
  deduplicateRequests?: boolean
}

/**
 * Hook for optimized data fetching with automatic caching
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: UseOptimizedQueryOptions<T>
) {
  const cacheKey = queryKey.join(':')

  return useQuery({
    queryKey,
    queryFn: async () => {
      // Check local cache first
      const cached = cache.get<T>(cacheKey)
      if (cached) {
        console.log(`📦 Cache hit: ${cacheKey}`)
        return cached
      }

      // Deduplicate concurrent requests
      const result = options?.deduplicateRequests ?? true
        ? await deduplicator.execute(cacheKey, queryFn)
        : await queryFn()

      // Store in cache
      cache.set(cacheKey, result, {
        ttl: options?.cacheConfig?.ttl ?? 5 * 60 * 1000,
        tags: options?.cacheConfig?.tags ?? queryKey,
      })

      return result
    },
    staleTime: options?.cacheConfig?.ttl ?? 5 * 60 * 1000,
    gcTime: (options?.cacheConfig?.ttl ?? 5 * 60 * 1000) * 2,
    ...options,
  })
}

/**
 * Hook for multiple queries with batching
 */
export function useOptimizedQueries<T>(
  queries: Array<{
    key: string[]
    fn: () => Promise<T>
    options?: UseOptimizedQueryOptions<T>
  }>
) {
  return queries.map((q) => useOptimizedQuery(q.key, q.fn, q.options))
}
