import { useMemo, useRef } from 'react';

/**
 * Custom hook for memoized values with deep comparison
 * Useful when the value is an object or array
 */ 
export function useMemoizedValue<T>(factory: () => T, deps: React.DependencyList): T {
  const valueRef = useRef<T | null>(null);
  const depsRef = useRef<string>(JSON.stringify(deps));

  // Check if dependencies have changed (deep comparison)
  const currentDepsString = JSON.stringify(deps);
  const hasDepsChanged = currentDepsString !== depsRef.current;

  if (hasDepsChanged || valueRef.current === null) {
    valueRef.current = factory();
    depsRef.current = currentDepsString;
  }

  return valueRef.current;
}

/**
 * Custom hook for memoized value with shallow comparison
 * Similar to useMemo but with better performance for simple cases
 */
export function useShallowMemo<T>(value: T): T {
  const ref = useRef(value);
  
  if (ref.current !== value) {
    ref.current = value;
  }
  
  return ref.current;
}

/**
 * Custom hook for memoized value with custom comparison function
 */
export function useMemoizedCompare<T>(
  value: T,
  compare: (prev: T, next: T) => boolean
): T {
  const ref = useRef(value);
  
  if (!compare(ref.current, value)) {
    ref.current = value;
  }
  
  return ref.current;
}
