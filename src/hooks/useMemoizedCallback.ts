import { useCallback, useRef } from 'react';

/**
 * Custom hook for memoized callbacks that won't change unless dependencies change
 * This is more performant than useCallback for complex dependencies
 */ 
export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  const depsRef = useRef(deps);

  // Update callback ref when callback changes
  callbackRef.current = callback;

  // Check if dependencies have changed
  const hasDepsChanged = deps.some((dep, index) => {
    return dep !== depsRef.current[index];
  });

  // Update deps ref
  depsRef.current = deps;

  // Return stable callback reference
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, hasDepsChanged ? deps : []) as T;
}

/**
 * Custom hook for memoized callback with deep comparison
 * Useful when dependencies are objects or arrays
 */
export function useDeepMemoCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const callbackRef = useRef(callback);
  const depsRef = useRef<string>(JSON.stringify(deps));

  // Update callback ref when callback changes
  callbackRef.current = callback;

  // Check if dependencies have changed (deep comparison)
  const currentDepsString = JSON.stringify(deps);
  const hasDepsChanged = currentDepsString !== depsRef.current;

  // Update deps ref
  depsRef.current = currentDepsString;

  // Return stable callback reference
  return useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, hasDepsChanged ? deps : []) as T;
}
