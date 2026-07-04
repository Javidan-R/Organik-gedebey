/**
 * Performance Metrics Collection API
 * Collects Web Vitals, Core Web Vitals, and performance alerts
 */

import { NextRequest, NextResponse } from 'next/server'
import { cache, deduplicator } from '@/lib/performance/cache'

interface PerformanceAlert {
  type: 'slow_metric' | 'memory_leak' | 'high_cpu' | 'network_error'
  subtype?: string
  name?: string
  duration?: number
  threshold?: number
  timestamp: number
  url: string
}

// In-memory store for metrics (in production, use a database)
const metricsStore: any[] = []
const alertsStore: PerformanceAlert[] = []

/**
 * POST /api/metrics/vitals
 * Collect Web Vitals data
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const metric = {
      ...data,
      receivedAt: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      country: request.headers.get('cf-ipl-country'), // Cloudflare header
    }

    // Store metric
    metricsStore.push(metric)

    // Keep last 1000 metrics
    if (metricsStore.length > 1000) {
      metricsStore.shift()
    }

    // Alert on poor metrics
    if (metric.rating === 'poor') {
      const alert: PerformanceAlert = {
        type: 'slow_metric',
        name: metric.name,
        duration: metric.value,
        threshold: 0,
        timestamp: Date.now(),
        url: metric.url,
      }

      alertsStore.push(alert)

      // Send to Sentry/monitoring in production
      if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        // Capture alert
        console.warn('📊 Poor metric detected:', metric.name, metric.value)
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Failed to process metric:', error)
    return NextResponse.json({ error: 'Failed to process metric' }, { status: 500 })
  }
}

/**
 * GET /api/metrics/vitals/summary
 * Get performance metrics summary
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json(
        {
          metrics: metricsStore.slice(-100),
          alerts: alertsStore.slice(-50),
          summary: {
            totalMetrics: metricsStore.length,
            avgMetrics: calculateAverages(metricsStore),
            poorMetricsCount: metricsStore.filter((m) => m.rating === 'poor')
              .length,
          },
        },
        { status: 200 }
      )
    }

    return NextResponse.json({ error: 'Not available' }, { status: 403 })
  } catch (error) {
    console.error('Failed to get metrics:', error)
    return NextResponse.json({ error: 'Failed to get metrics' }, { status: 500 })
  }
}

function calculateAverages(metrics: any[]): Record<string, number> {
  const byType: Record<string, number[]> = {}

  for (const metric of metrics) {
    if (!byType[metric.name]) byType[metric.name] = []
    byType[metric.name].push(metric.value)
  }

  const averages: Record<string, number> = {}
  for (const [name, values] of Object.entries(byType)) {
    const sum = values.reduce((a, b) => a + b, 0)
    averages[name] = Math.round(sum / values.length)
  }

  return averages
}
