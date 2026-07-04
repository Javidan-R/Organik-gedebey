/**
 * Web Vitals Tracking - Core Performance Metrics
 * Tracks LCP, FID, CLS, TTFB, FCP
 */

export interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
}

// Thresholds for Web Vitals
const VITALS_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },      // Largest Contentful Paint
  FID: { good: 100, poor: 300 },        // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
  TTFB: { good: 600, poor: 1800 },      // Time to First Byte
  FCP: { good: 1800, poor: 3000 },      // First Contentful Paint
}

export function getRating(
  metricName: keyof typeof VITALS_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = VITALS_THRESHOLDS[metricName]
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

export function trackWebVital(metric: any): WebVitalMetric {
  const rating = getRating(metric.name as keyof typeof VITALS_THRESHOLDS, metric.value)
  
  const vitalMetric: WebVitalMetric = {
    name: metric.name,
    value: Math.round(metric.value),
    rating,
    timestamp: Date.now(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  }

  // Log to analytics
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // Send to Sentry/Analytics
    logMetricToAnalytics(vitalMetric)
  }

  return vitalMetric
}

export function logMetricToAnalytics(metric: WebVitalMetric) {
  // Use beacon API for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      '/api/metrics/vitals',
      JSON.stringify(metric)
    )
  } else {
    // Fallback to fetch
    fetch('/api/metrics/vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
      keepalive: true,
    }).catch(() => {
      // Silent fail
    })
  }
}

export function initWebVitalsTracking() {
  if (typeof window === 'undefined') return

  try {
    import('web-vitals').then(({ getCLS, getFCP, getFID, getLCP, getTTFB }) => {
      getLCP(trackWebVital)
      getFID(trackWebVital)
      getCLS(trackWebVital)
      getTTFB(trackWebVital)
      getFCP(trackWebVital)
    })
  } catch (error) {
    console.error('Failed to load web-vitals:', error)
  }
}
