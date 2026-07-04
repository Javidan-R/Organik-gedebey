/**
 * Performance monitoring utilities
 * Track and measure application performance metrics
 */

export interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number;
  renderTime: number;
  interactionTime: number;
  timestamp: number;
}
 
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private fpsUpdateInterval = 1000;
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFPSMonitoring();
      this.startMemoryMonitoring();
    }
  }

  private startFPSMonitoring() {
    const measureFPS = () => {
      this.frameCount++;
      const now = performance.now();
      
      if (now - this.lastFrameTime >= this.fpsUpdateInterval) {
        const fps = Math.round((this.frameCount * 1000) / (now - this.lastFrameTime));
        this.recordMetric({ fps });
        this.frameCount = 0;
        this.lastFrameTime = now;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
  }

  private startMemoryMonitoring() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric({ memoryUsage: memory.usedJSHeapSize });
      }, 5000);
    }
  }

  private recordMetric(partial: Partial<PerformanceMetrics>) {
    const metrics: PerformanceMetrics = {
      fps: 0,
      renderTime: 0,
      interactionTime: 0,
      timestamp: Date.now(),
      ...partial,
    };
    
    this.metrics.push(metrics);
    
    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
    
    // Notify observers
    this.observers.forEach(callback => callback(metrics));
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getAverageFPS(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.fps, 0);
    return Math.round(sum / this.metrics.length);
  }

  public measureRenderTime(componentName: string) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      this.recordMetric({ renderTime: duration });
      
      if (process.env.NODE_ENV === 'development' && duration > 16) {
        console.warn(`[Performance] ${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  }

  public measureInteraction(name: string) {
    const start = performance.now();
    return () => {
      const end = performance.now();
      const duration = end - start;
      this.recordMetric({ interactionTime: duration });
      
      if (process.env.NODE_ENV === 'development' && duration > 100) {
        console.warn(`[Performance] ${name} interaction took ${duration.toFixed(2)}ms`);
      }
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const end = performance.now();
    const duration = end - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Measure async function execution time
 */
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const end = performance.now();
    const duration = end - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
    }
  }
}

/**
 * Get Web Vitals
 */
export function getWebVitals() {
  if (typeof window === 'undefined') return null;

  return {
    // Largest Contentful Paint
    LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
    // First Input Delay
    FID: performance.getEntriesByType('first-input')[0]?.processingStart || 0,
    // Cumulative Layout Shift
    CLS: performance.getEntriesByType('layout-shift').reduce((acc, entry) => {
      return acc + (entry as any).value;
    }, 0),
    // Time to First Byte
    TTFB: performance.timing.responseStart - performance.timing.requestStart,
  };
}
