import { useEffect, useState, useRef } from 'react';
import { performanceMonitor, type PerformanceMetrics } from '@/utils/performanceMonitor';

/**
 * Hook to monitor performance metrics
 */
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [currentFPS, setCurrentFPS] = useState(0);

  useEffect(() => {
    const unsubscribe = performanceMonitor.subscribe((metric) => {
      setMetrics((prev) => [...prev, metric].slice(-100));
      setCurrentFPS(metric.fps);
    });

    return unsubscribe;
  }, []);

  return {
    metrics,
    currentFPS,
    averageFPS: performanceMonitor.getAverageFPS(),
    getWebVitals: () => {
      if (typeof window === 'undefined') return null;
      return {
        LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
        FID: performance.getEntriesByType('first-input')[0]?.processingStart || 0,
        CLS: performance.getEntriesByType('layout-shift').reduce((acc, entry) => {
          return acc + (entry as any).value;
        }, 0),
      };
    },
  };
}

/**
 * Hook to measure component render time
 */
export function useRenderTime(componentName: string) {
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);

  useEffect(() => {
    renderCount.current++;
  });

  useEffect(() => {
    const endMeasure = performanceMonitor.measureRenderTime(componentName);
    return () => {
      const duration = endMeasure();
      totalRenderTime.current += duration;
    };
  });

  return {
    renderCount: renderCount.current,
    averageRenderTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0,
  };
}

/**
 * Hook to measure interaction time
 */
export function useInteractionTime() {
  const measure = (name: string) => {
    return performanceMonitor.measureInteraction(name);
  };

  return { measure };
}

/**
 * Hook to detect low performance mode
 */
export function useLowPerformanceMode(threshold: number = 30) {
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const { currentFPS } = usePerformanceMonitor();

  useEffect(() => {
    setIsLowPerformance(currentFPS < threshold && currentFPS > 0);
  }, [currentFPS, threshold]);

  return isLowPerformance;
}
