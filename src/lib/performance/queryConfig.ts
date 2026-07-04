/**
 * Optimized React Query Configuration
 * Production-ready settings for maximum caching and performance
 */

import {
  QueryClient,
  DefaultOptions,
  QueryClientConfig,
} from '@tanstack/react-query'
import { cache } from './cache'

/**
 * Production-optimized default options
 * - Longer stale times to reduce redundant requests
 * - Aggressive retry logic for transient failures
 * - Smart garbage collection
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Keep data fresh for 5 minutes before re-fetching
    staleTime: 5 * 60 * 1000,

    // Cache data for 10 minutes even if stale
    gcTime: 10 * 60 * 1000,

    // Only retry on specific errors (network, server 5xx)
    retry: (failureCount, error: any) => {
      if (failureCount > 3) return false

      // Don't retry on client errors
      if (error?.status >= 400 && error?.status < 500) {
        return false
      }

      // Exponential backoff: 1s, 2s, 4s
      return true
    },

    // Exponential backoff with jitter
    retryDelay: (attemptIndex) => {
      const baseDelay = Math.min(1000 * 2 ** attemptIndex, 30000)
      const jitter = Math.random() * 1000
      return baseDelay + jitter
    },

    // Don't refetch when window regains focus in dev
    refetchOnWindowFocus: process.env.NODE_ENV === 'production',

    // Don't refetch on remount if data is fresh
    refetchOnMount: 'stale',

    // Aggressively refetch if disconnected
    refetchOnReconnect: 'always',
  },

  mutations: {
    // Retry mutations with exponential backoff
    retry: (failureCount) => failureCount < 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  },
}

/**
 * Advanced React Query configuration with:
 * - Automatic persistence
 * - Request deduplication
 * - Network status aware refetching
 */
export function createOptimizedQueryClient(): QueryClient {
  const config: QueryClientConfig = {
    defaultOptions,
    logger: {
      // Suppress logs in production
      log: process.env.NODE_ENV === 'development' ? console.log : () => {},
      warn: process.env.NODE_ENV === 'development' ? console.warn : () => {},
      error: () => {}, // Errors handled by Sentry
    },
  }

  const queryClient = new QueryClient(config)

  // Network status aware refetching
  if (typeof window !== 'undefined') {
    const handleOnline = () => {
      console.log('✅ Back online - refetching stale queries')
      queryClient.refetchQueries({
        type: 'active',
        stale: true,
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', () => {
      console.log('🔴 Offline - using cached data')
    })

    // Cleanup
    return queryClient
  }

  return queryClient
}

/**
 * Enhanced useQuery with automatic caching
 */
export function createQueryWithCache<
  TQueryFnData,
  TError,
  TData = TQueryFnData,
>(
  queryKey: string[],
  queryFn: () => Promise<TQueryFnData>,
  options?: any
) {
  const cacheKey = queryKey.join(':')

  return {
    queryKey,
    queryFn: async () => {
      // Check local cache first
      const cached = cache.get<TQueryFnData>(cacheKey)
      if (cached) {
        console.log(`📦 Cache hit: ${cacheKey}`)
        return cached
      }

      // Fetch from server
      const data = await queryFn()

      // Store in cache with 5 minute TTL
      cache.set(cacheKey, data, {
        ttl: 5 * 60 * 1000,
        tags: queryKey,
        compress: JSON.stringify(data).length > 5000,
      })

      return data
    },
    ...options,
  }
}

/**
 * Invalidate related queries by tag
 */
export function invalidateQueriesByTag(
  queryClient: QueryClient,
  tag: string
) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      return query.queryKey.includes(tag)
    },
  })

  // Also invalidate in local cache
  cache.invalidateByTag(tag)
}
