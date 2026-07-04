// components/AppProviders.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function AppProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 dəqiqə
            gcTime: 10 * 60 * 1000, // 10 dəqiqə
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </SessionProvider>
  );
}