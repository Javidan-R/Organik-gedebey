// app/layout.tsx
'use client';

import { useEffect } from 'react';
import './globals.css';
import { useApp } from '@/lib/store';
import { AppProviders } from '@/components/AppProviders';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useApp.persist.rehydrate();
  }, []);

  return (
    <html lang="az">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
