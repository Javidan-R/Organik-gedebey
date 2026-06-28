import React, { lazy, Suspense, ComponentType, LazyExoticComponent } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface LazyLoadOptions {
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

/**
 * Higher-order component for lazy loading with loading and error states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const LazyComponent = lazy(importFn);

  const WrappedComponent = (props: React.ComponentProps<T>) => {
    return (
      <ErrorBoundary
        FallbackComponent={({ error }) =>
          options.errorFallback || (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-red-500 mb-2">Failed to load component</p>
                <p className="text-sm text-gray-600">{error.message}</p>
              </div>
            </div>
          )
        }
        onError={options.onError}
      >
        <Suspense
          fallback={
            options.fallback || (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )
          }
        >
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `LazyLoad(${LazyComponent.displayName || 'Component'})`;

  return WrappedComponent as LazyExoticComponent<T>;
}

/**
 * Preload a lazy component
 * Useful for preloading components on hover or before navigation
 */
export function preloadLazyComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
): void {
  lazyComponent.preload?.();
}

/**
 * Create a lazy loaded component with custom loading state
 */
export function withLoadingState<T extends ComponentType<any>>(
  Component: ComponentType<T>,
  LoadingComponent: ComponentType<{ isLoading: boolean }>
): ComponentType<T> {
  return function WithLoadingState(props: T) {
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      setIsLoading(false);
    }, []);

    return (
      <>
        {isLoading && <LoadingComponent isLoading={isLoading} />}
        <Component {...props} />
      </>
    );
  };
}
