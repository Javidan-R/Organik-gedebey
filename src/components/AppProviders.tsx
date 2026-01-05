// src/components/AppProviders.tsx
'use client';

import { useEffect, ReactNode } from 'react';
import { useApp, useHasHydrated } from '@/lib/store';

export function AppProviders({ children }: { children: ReactNode }) {
  const hasHydrated = useHasHydrated();

  // Əlavə rehydrate call etmək istəyirsənsə:
  useEffect(() => {
    if (!hasHydrated && (useApp as any).persist?.rehydrate) {
      useApp.persist.rehydrate();
    }
  }, [hasHydrated]);

  // İstəsən burada ThemeProvider, Toaster və s. də əlavə edə bilərsən
  return <>{children}</>;
}
