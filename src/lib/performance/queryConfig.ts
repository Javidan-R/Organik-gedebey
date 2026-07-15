// src/lib/performance/queryConfig.ts

import { QueryClient, defaultShouldDehydrateQuery } from '@tanstack/react-query';

export function createOptimizedQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 dəqiqə
        gcTime: 1000 * 60 * 10, // 10 dəqiqə
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 2,
        retryDelay: 1000,
      },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });
}