import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook to throttle a value
 * @param value - The value to throttle
 * @param limit - The time limit in milliseconds
 * @returns The throttled value
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value, () => value);
  const lastRan = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRan.current;

    if (timeSinceLastRun >= limit) {
      setThrottledValue(value);
      lastRan.current = now;
    } else {
      const timeout = setTimeout(() => {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }, limit - timeSinceLastRun);

      return () => clearTimeout(timeout);
    } 
  }, [value, limit]);

  return throttledValue;
}

/**
 * Custom hook to throttle a callback function
 * @param callback - The function to throttle
 * @param limit - The time limit in milliseconds
 * @returns The throttled callback function
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= limit) {
      callbackRef.current(...args);
      lastRun.current = now;
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        lastRun.current = Date.now();
      }, limit - timeSinceLastRun);
    }
  };
}
