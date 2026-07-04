/**
 * Performance Dashboard - Monitor app metrics in real-time
 * Shows Web Vitals, API performance, and resource usage
 */

'use client'

import { useEffect, useState } from 'react'
import { performanceMonitor } from '@/lib/performance/monitor'
import { cache } from '@/lib/performance/cache'
import { Activity, TrendingUp, AlertCircle, Zap } from 'lucide-react'

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [cacheStats, setCacheStats] = useState<any>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics every 5 seconds
      const currentMetrics = performanceMonitor.getMetrics()
      setMetrics(currentMetrics)

      // Get cache stats
      setCacheStats(cache.getStats())

      // Fetch alerts from API
      fetch('/api/metrics/vitals/summary', { method: 'GET' })
        .then((res) => res.json())
        .then((data) => {
          setAlerts(data.alerts || [])
        })
        .catch(() => {
          // Silent fail
        })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  if (!metrics) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading performance metrics...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Performance Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Page Load Time */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Page Load</p>
              <p className="text-2xl font-bold">
                {metrics.pageLoadTime.toFixed(0)}ms
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* FPS */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">FPS</p>
              <p className="text-2xl font-bold">{metrics.fps}</p>
            </div>
            <Zap className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Memory</p>
              <p className="text-2xl font-bold">
                {(
                  metrics.memoryUsage.usedJSHeapSize / 1024 / 1024
                ).toFixed(1)}MB
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cache Hit Rate</p>
              <p className="text-2xl font-bold">
                {(cacheStats?.hitRate * 100 || 0).toFixed(0)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Resource Timing */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Slow Resources (Top 10)</h2>
        <div className="space-y-2">
          {metrics.resourceTiming.slice(0, 10).map((resource: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex-1">
                <p className="text-sm font-medium truncate">{resource.name}</p>
                <p className="text-xs text-gray-600">{resource.type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {resource.duration.toFixed(0)}ms
                </p>
                <p className="text-xs text-gray-600">
                  {(resource.size / 1024).toFixed(1)}KB
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h2 className="text-lg font-semibold text-red-800 mb-4">
            Recent Alerts ({alerts.length})
          </h2>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-white rounded border border-red-100 text-sm"
              >
                <p className="font-medium text-red-700">
                  {alert.type}: {alert.name}
                </p>
                <p className="text-gray-600">
                  Duration: {alert.duration}ms (threshold: {alert.threshold}ms)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cache Statistics */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Cache Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Hits</p>
            <p className="text-xl font-bold">{cacheStats?.hits || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Misses</p>
            <p className="text-xl font-bold">{cacheStats?.misses || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sets</p>
            <p className="text-xl font-bold">{cacheStats?.sets || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cache Size</p>
            <p className="text-xl font-bold">{cacheStats?.size || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
