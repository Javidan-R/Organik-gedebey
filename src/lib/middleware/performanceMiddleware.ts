import { NextRequest, NextResponse } from 'next/server'

// Performance monitoring middleware
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>()

  static recordMetric(name: string, duration: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    const metrics = this.metrics.get(name)!
    metrics.push(duration)
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  static getMetricStats(name: string) {
    const metrics = this.metrics.get(name)
    if (!metrics || metrics.length === 0) {
      return null
    }

    const sorted = [...metrics].sort((a, b) => a - b)
    const sum = metrics.reduce((a, b) => a + b, 0)
    const avg = sum / metrics.length
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return { avg, p50, p95, p99, count: metrics.length }
  }

  static clearMetrics() {
    this.metrics.clear()
  }
}

export function withPerformanceMonitoring<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>,
  metricName: string
) {
  return async (request: NextRequest, ...args: any[]): Promise<T> => {
    const start = performance.now()
    try {
      const result = await handler(request, ...args)
      const duration = performance.now() - start
      PerformanceMonitor.recordMetric(metricName, duration)
      
      // Add performance header in development
      if (process.env.NODE_ENV === 'development') {
        const response = result as NextResponse
        if (response.headers) {
          response.headers.set('X-Server-Timing', `${metricName};dur=${duration.toFixed(2)}`)
        }
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - start
      PerformanceMonitor.recordMetric(`${metricName}_error`, duration)
      throw error
    }
  }
}

// Response caching middleware for GET requests
export function withCache<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>,
  options: {
    maxAge?: number
    staleWhileRevalidate?: number
    tags?: string[]
  } = {}
) {
  const { maxAge = 60, staleWhileRevalidate = 300, tags = [] } = options

  return async (request: NextRequest, ...args: any[]): Promise<T> => {
    const response = await handler(request, ...args)
    
    if (response instanceof NextResponse && request.method === 'GET') {
      const cacheControl = `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      response.headers.set('Cache-Control', cacheControl)
      
      if (tags.length > 0) {
        response.headers.set('Cache-Tags', tags.join(','))
      }
    }
    
    return response
  }
}

// Request deduplication middleware
const pendingRequests = new Map<string, Promise<any>>()

export function withDeduplication<T>(
  handler: (request: NextRequest, ...args: any[]) => Promise<T>
) {
  return async (request: NextRequest, ...args: any[]): Promise<T> => {
    const key = `${request.method}:${request.url}`
    
    if (pendingRequests.has(key)) {
      return pendingRequests.get(key)!
    }
    
    const promise = handler(request, ...args)
      .finally(() => {
        pendingRequests.delete(key)
      })
    
    pendingRequests.set(key, promise)
    return promise
  }
}

// Rate limiting middleware (in-memory for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options: {
    requestsPerMinute?: number
    requestsPerHour?: number
  } = {}
) {
  const { requestsPerMinute = 60, requestsPerHour = 1000 } = options

  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const now = Date.now()
    const minuteKey = `${ip}:minute`
    const hourKey = `${ip}:hour`
    
    const minuteData = rateLimitStore.get(minuteKey) || { count: 0, resetTime: now + 60000 }
    const hourData = rateLimitStore.get(hourKey) || { count: 0, resetTime: now + 3600000 }
    
    // Reset if expired
    if (now > minuteData.resetTime) {
      minuteData.count = 0
      minuteData.resetTime = now + 60000
    }
    if (now > hourData.resetTime) {
      hourData.count = 0
      hourData.resetTime = now + 3600000
    }
    
    // Check limits
    if (minuteData.count >= requestsPerMinute) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Too many requests per minute' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    
    if (hourData.count >= requestsPerHour) {
      return NextResponse.json(
        { error: 'Rate limit exceeded: Too many requests per hour' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      )
    }
    
    // Increment counters
    minuteData.count++
    hourData.count++
    rateLimitStore.set(minuteKey, minuteData)
    rateLimitStore.set(hourKey, hourData)
    
    return handler(request, ...args)
  }
}
