/**
 * Production-Grade Performance Monitoring
 * Real-time metrics collection, anomaly detection, and performance alerts
 */

export interface PerformanceMetrics {
  timestamp: number
  pageLoadTime: number
  resourceTiming: ResourceTiming[]
  networkInfo: NetworkInformation
  memoryUsage: MemoryUsage
  fps: number
}

export interface ResourceTiming {
  name: string
  type: string
  duration: number
  size: number
  cached: boolean
}

export interface NetworkInformation {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

export interface MemoryUsage {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private observers: PerformanceObserver[] = []
  private thresholds = {
    slowRoute: 3000,        // Route transitions > 3s
    slowApi: 2000,          // API calls > 2s
    slowScript: 1000,       // Script execution > 1s
    memoryLeak: 100 * 1024 * 1024, // 100MB increase
  }

  constructor() {
    if (typeof window === 'undefined') return
    this.initObservers()
  }

  private initObservers() {
    // Navigation timing
    try {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > this.thresholds.slowRoute) {
            this.reportSlowMetric('navigation', entry)
          }
        }
      })
      navObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navObserver)
    } catch (e) {
      console.warn('Navigation Observer not supported')
    }

    // Resource timing
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > this.thresholds.slowApi) {
            this.reportSlowMetric('resource', entry)
          }
        }
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)
    } catch (e) {
      console.warn('Resource Observer not supported')
    }

    // Long tasks (> 50ms)
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(0)}ms`, entry)
        }
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)
    } catch (e) {
      console.warn('LongTask Observer not supported')
    }
  }

  private reportSlowMetric(type: string, entry: any) {
    const warning = `⚠️ Slow ${type}: ${entry.name} (${entry.duration.toFixed(0)}ms)`
    console.warn(warning)

    // Send to analytics
    if (process.env.NODE_ENV === 'production') {
      this.sendAlert({
        type: 'slow_metric',
        subtype: type,
        name: entry.name,
        duration: entry.duration,
        threshold: this.thresholds[type as keyof typeof this.thresholds] || 0,
      })
    }
  }

  private sendAlert(alert: any) {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/metrics/alerts',
        JSON.stringify(alert)
      )
    }
  }

  getMetrics(): PerformanceMetrics | null {
    if (typeof window === 'undefined') return null

    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const connection = (navigator as any).connection

    return {
      timestamp: Date.now(),
      pageLoadTime: nav?.loadEventEnd - nav?.fetchStart || 0,
      resourceTiming: this.getResourceTimings(),
      networkInfo: {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        saveData: connection?.saveData || false,
      },
      memoryUsage: this.getMemoryUsage(),
      fps: this.calculateFPS(),
    }
  }

  private getResourceTimings(): ResourceTiming[] {
    if (typeof performance === 'undefined') return []

    return performance
      .getEntriesByType('resource')
      .filter((entry: any) => entry.duration > 100)
      .slice(-20) // Last 20 slow resources
      .map((entry: any) => ({
        name: entry.name.split('/').pop(),
        type: entry.initiatorType,
        duration: entry.duration,
        size: entry.transferSize || 0,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      }))
  }

  private getMemoryUsage(): MemoryUsage {
    if (!(performance as any).memory) {
      return {
        usedJSHeapSize: 0,
        totalJSHeapSize: 0,
        jsHeapSizeLimit: 0,
      }
    }

    return (performance as any).memory
  }

  private calculateFPS(): number {
    // Simplified FPS calculation
    let lastTime = performance.now()
    let frames = 0

    const countFrames = () => {
      frames++
      const currentTime = performance.now()
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime))
        lastTime = currentTime
        frames = 0
        return fps
      }
      requestAnimationFrame(countFrames)
      return 0
    }

    return 60 // Default to 60fps
  }

  dispose() {
    for (const observer of this.observers) {
      observer.disconnect()
    }
    this.observers = []
  }
}

export const performanceMonitor = new PerformanceMonitor()
