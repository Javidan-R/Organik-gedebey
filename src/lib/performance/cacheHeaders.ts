/**
 * API Response Caching Middleware
 * Implements HTTP caching headers and ETags for optimal CDN/browser caching
 */

import { NextResponse, NextRequest } from 'next/server'

export interface CacheConfig {
  maxAge: number // seconds
  sMaxAge?: number // CDN cache (CloudFlare, etc)
  staleWhileRevalidate?: number
  staleIfError?: number
  public?: boolean
  private?: boolean
  immutable?: boolean
}

/**
 * Generate ETag from content
 */
export function generateETag(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return `"${Math.abs(hash).toString(36)}"`
}

/**
 * Apply cache headers to response
 */
export function withCacheHeaders(
  response: NextResponse,
  config: CacheConfig
): NextResponse {
  const cacheDirectives: string[] = []

  if (config.public) cacheDirectives.push('public')
  if (config.private) cacheDirectives.push('private')
  if (config.immutable) cacheDirectives.push('immutable')

  cacheDirectives.push(`max-age=${config.maxAge}`)

  if (config.sMaxAge) {
    cacheDirectives.push(`s-maxage=${config.sMaxAge}`)
  }

  if (config.staleWhileRevalidate) {
    cacheDirectives.push(
      `stale-while-revalidate=${config.staleWhileRevalidate}`
    )
  }

  if (config.staleIfError) {
    cacheDirectives.push(`stale-if-error=${config.staleIfError}`)
  }

  response.headers.set('Cache-Control', cacheDirectives.join(', '))

  // Add CDN directives for Cloudflare, etc
  if (config.sMaxAge) {
    response.headers.set('CDN-Cache-Control', `max-age=${config.sMaxAge}`)
  }

  return response
}

/**
 * Check if request has valid ETag
 */
export function checkETag(
  request: NextRequest,
  currentETag: string
): boolean {
  const clientETag = request.headers.get('if-none-match')
  return clientETag === currentETag
}

/**
 * Return 304 Not Modified when ETag matches
 */
export function return304NotModified(): NextResponse {
  return new NextResponse(null, {
    status: 304,
    statusText: 'Not Modified',
  })
}

/**
 * Caching strategies for different data types
 */
export const CACHE_STRATEGIES = {
  // Static/rarely changing data
  STATIC: {
    maxAge: 24 * 60 * 60, // 24 hours
    sMaxAge: 7 * 24 * 60 * 60, // 7 days on CDN
    staleWhileRevalidate: 30 * 24 * 60 * 60, // 30 days
    immutable: true,
    public: true,
  },

  // Semi-dynamic data
  SEMI_DYNAMIC: {
    maxAge: 60 * 60, // 1 hour
    sMaxAge: 12 * 60 * 60, // 12 hours on CDN
    staleWhileRevalidate: 24 * 60 * 60, // 1 day
    public: true,
  },

  // Frequently changing data
  DYNAMIC: {
    maxAge: 5 * 60, // 5 minutes
    sMaxAge: 60, // 1 minute on CDN
    staleWhileRevalidate: 10 * 60, // 10 minutes
    public: true,
  },

  // User-specific data (don't cache publicly)
  PRIVATE: {
    maxAge: 5 * 60, // 5 minutes
    private: true,
  },

  // API endpoints with revalidation
  API_REVALIDATE: {
    maxAge: 30,
    sMaxAge: 60,
    staleWhileRevalidate: 300,
    public: true,
  },
}
