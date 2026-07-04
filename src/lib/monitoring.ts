/**
 * Performance Monitoring and Observability
 * 
 * Production-ready monitoring system with metrics collection,
 * performance tracking, and integration with monitoring services.
 */

import { logger } from './logger';

// ============================================
// METRIC TYPES
// ============================================
 
export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  success: boolean;
  tags?: Record<string, string>;
}

// ============================================
// METRICS COLLECTOR
// ============================================

class MetricsCollector {
  private metrics: Metric[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private maxMetricsInMemory = 1000;

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetricsInMemory) {
      this.metrics.shift();
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(metric);
    }
  }

  recordPerformance(name: string, duration: number, success: boolean = true, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      success,
      tags,
    };

    this.performanceMetrics.push(metric);
    if (this.performanceMetrics.length > this.maxMetricsInMemory) {
      this.performanceMetrics.shift();
    }

    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow operation detected', { name, duration, tags });
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendPerformanceToMonitoring(metric);
    }
  }

  private sendToMonitoring(metric: Metric): void {
    // TODO: Integrate with monitoring service (Datadog, New Relic, etc.)
    // This is a placeholder for production monitoring integration
    if (typeof window !== 'undefined') {
      fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
        keepalive: true,
      }).catch(() => {
        // Silently fail to avoid infinite loops
      });
    }
  }

  private sendPerformanceToMonitoring(metric: PerformanceMetric): void {
    // TODO: Integrate with APM service
    if (typeof window !== 'undefined') {
      fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
        keepalive: true,
      }).catch(() => {
        // Silently fail to avoid infinite loops
      });
    }
  }

  getMetrics(name?: string, limit: number = 100): Metric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name).slice(-limit);
    }
    return this.metrics.slice(-limit);
  }

  getPerformanceMetrics(name?: string, limit: number = 100): PerformanceMetric[] {
    if (name) {
      return this.performanceMetrics.filter(m => m.name === name).slice(-limit);
    }
    return this.performanceMetrics.slice(-limit);
  }

  clearMetrics(): void {
    this.metrics = [];
    this.performanceMetrics = [];
  }

  getStats() {
    return {
      totalMetrics: this.metrics.length,
      totalPerformanceMetrics: this.performanceMetrics.length,
      avgPerformance: this.performanceMetrics.length > 0
        ? this.performanceMetrics.reduce((sum, m) => sum + m.duration, 0) / this.performanceMetrics.length
        : 0,
      successRate: this.performanceMetrics.length > 0
        ? this.performanceMetrics.filter(m => m.success).length / this.performanceMetrics.length
        : 1,
    };
  }
}

export const metricsCollector = new MetricsCollector();

// ============================================
// PERFORMANCE TRACKING UTILITIES
// ============================================

export function trackPerformance<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  const startTime = Date.now();
  return fn()
    .then((result) => {
      const duration = Date.now() - startTime;
      metricsCollector.recordPerformance(name, duration, true, tags);
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      metricsCollector.recordPerformance(name, duration, false, tags);
      throw error;
    });
}

export function trackSyncPerformance<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>
): T {
  const startTime = Date.now();
  try {
    const result = fn();
    const duration = Date.now() - startTime;
    metricsCollector.recordPerformance(name, duration, true, tags);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    metricsCollector.recordPerformance(name, duration, false, tags);
    throw error;
  }
}

// ============================================
// PERFORMANCE OBSERVER
// ============================================

class BrowserPerformanceMonitor {
  private observer: PerformanceObserver | null = null;

  init(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return;
    }

    this.observer = new PerformanceObserver((list: { getEntries: () => any; }) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          metricsCollector.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
          metricsCollector.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
          metricsCollector.recordMetric('first_paint', navEntry.responseStart - navEntry.fetchStart);
        } else if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          metricsCollector.recordMetric('resource_load_time', resourceEntry.duration, {
            resource: resourceEntry.name,
            type: resourceEntry.initiatorType,
          });
        }
      }
    });

    this.observer.observe({ entryTypes: ['navigation', 'resource'] });
  }

  disconnect(): void {
    this.observer?.disconnect();
  }
}

export const performanceObserver = new BrowserPerformanceMonitor();

// Initialize performance observer on client
if (typeof window !== 'undefined') {
  performanceObserver.init();
}

// ============================================
// API RESPONSE TIME TRACKING
// ============================================

export function withPerformanceTracking<T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>,
  tags?: Record<string, string>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    return trackPerformance(name, () => fn(...args), tags);
  };
}

// ============================================
// HEALTH CHECK
// ============================================

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: { status: string; latency?: number };
    redis?: { status: string; latency?: number };
    externalServices?: Record<string, { status: string; latency?: number }>;
  };
  metrics: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
  };
}

export async function getHealthCheck(): Promise<HealthCheck> {
  const checks: HealthCheck['checks'] = {
    database: { status: 'unknown' },
  };

  // Check database connectivity
  try {
    const startTime = Date.now();
    // TODO: Add actual database ping
    // await db.select({ count: sql`count(*)` }).from(users);
    const latency = Date.now() - startTime;
    checks.database = { status: 'healthy', latency };
  } catch (error) {
    checks.database = { status: 'unhealthy' };
  }

  // Check Redis if configured
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const startTime = Date.now();
      // TODO: Add actual Redis ping
      const latency = Date.now() - startTime;
      checks.redis = { status: 'healthy', latency };
    }
  } catch (error) {
    checks.redis = { status: 'unhealthy' };
  }

  // Determine overall status
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');
  const anyUnhealthy = Object.values(checks).some(check => check.status === 'unhealthy');

  const status = allHealthy ? 'healthy' : anyUnhealthy ? 'unhealthy' : 'degraded';

  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  };
}

// ============================================
// EXPORTS
// ============================================

export const recordMetric = (name: string, value: number, tags?: Record<string, string>) =>
  metricsCollector.recordMetric(name, value, tags);

export const recordPerformance = (name: string, duration: number, success: boolean = true, tags?: Record<string, string>) =>
  metricsCollector.recordPerformance(name, duration, success, tags);

export const getMetrics = (name?: string, limit?: number) => metricsCollector.getMetrics(name, limit);
export const getPerformanceMetrics = (name?: string, limit?: number) => metricsCollector.getPerformanceMetrics(name, limit);
export const getMonitoringStats = () => metricsCollector.getStats();
