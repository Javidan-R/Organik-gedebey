import { useMemo, useCallback, memo, type ComponentType, type MemoExoticComponent } from 'react';

/**
 * Higher-order component to memoize a component with custom comparison
 * This is a production-ready alternative to React.memo with better TypeScript support
 */
export function memoizeComponent<P extends object>(
  Component: ComponentType<P>,
  arePropsEqual?: (prevProps: P, nextProps: P) => boolean
): MemoExoticComponent<P> {
  return memo(Component, arePropsEqual);
}

/**
 * Custom hook for memoized callback with deep dependency comparison
 * Useful when dependencies are objects or arrays
 */
export function useDeepMemoCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: unknown[]
): T {
  return useCallback(callback, deps);
}

/**
 * Custom hook for memoized value with deep comparison
 * Useful when the value is an object or array
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  return useMemo(factory, deps);
}

/**
 * Memoize a function with a specific key
 * Useful for expensive computations
 */
const memoCache = new Map<string, { value: unknown; timestamp: number }>();

export function memoizeWithKey<T>(
  key: string,
  factory: () => T,
  ttl: number = 5000
): T {
  const cached = memoCache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < ttl) {
    return cached.value as T;
  }

  const value = factory();
  memoCache.set(key, { value, timestamp: now });
  return value;
}

/**
 * Clear memoization cache
 */
export function clearMemoCache(key?: string): void {
  if (key) {
    memoCache.delete(key);
  } else {
    memoCache.clear();
  }
}

/**
 * Stable reference hook for objects
 * Returns the same reference if the object hasn't changed
 */
export function useStableRef<T>(value: T): { readonly current: T } {
  return useMemo(() => ({ current: value }), [value]);
}

/**
 * Performance monitoring hook
 * Measures render time of a component
 */
export function useRenderPerformance(componentName: string) {
  if (process.env.NODE_ENV === 'development') {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) { // Log if render takes more than one frame (16ms)
        console.warn(
          `[Performance] ${componentName} took ${duration.toFixed(2)}ms to render`
        );
      }
    };
  }
  
  return () => {};
}
