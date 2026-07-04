/**
 * Production-Ready Suspense Boundaries
 * Optimize component loading with progressive hydration
 */

import React, { Suspense } from 'react'

export interface SuspenseBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  name?: string
  timeout?: number
  onError?: (error: Error) => void
}

/**
 * Performance-optimized suspense boundary with:
 * - Error fallback
 * - Loading skeleton
 * - Performance monitoring
 */
export function OptimizedSuspense({
  children,
  fallback,
  name = 'Component',
  timeout = 5000,
  onError,
}: SuspenseBoundaryProps) {
  const [hasError, setHasError] = React.useState(false)
  const [loadingTime, setLoadingTime] = React.useState(0)
  const startTime = React.useRef(Date.now())

  React.useEffect(() => {
    const timer = setTimeout(() => {
      const elapsed = Date.now() - startTime.current
      setLoadingTime(elapsed)
      if (elapsed > timeout) {
        console.warn(`⚠️ Component ${name} exceeded timeout: ${elapsed}ms`)
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [name, timeout])

  if (hasError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-800">
          Error loading {name}. Please refresh the page.
        </p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        fallback || (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        )
      }
    >
      <React.ErrorBoundary
        onError={(error) => {
          setHasError(true)
          onError?.(error)
        }}
      >
        {children}
      </React.ErrorBoundary>
    </Suspense>
  )
}

/**
 * Lazy route component wrapper
 * Automatically handles code splitting with suspense
 */
export function createLazyPage<P extends object>(
  Component: React.LazyExoticComponent<React.ComponentType<P>>,
  displayName: string,
  fallback?: React.ReactNode
) {
  const LazyPage = (props: P) => (
    <OptimizedSuspense
      name={displayName}
      fallback={
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin">
              <div className="h-8 w-8 border-4 border-gray-200 border-t-green-500 rounded-full" />
            </div>
          </div>
        )
      }
    >
      <Component {...props} />
    </OptimizedSuspense>
  )

  LazyPage.displayName = displayName
  return LazyPage
}
