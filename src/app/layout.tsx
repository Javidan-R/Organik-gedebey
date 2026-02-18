// app/layout.tsx
// ⚠️  Root layout 'use client' ola BİLMƏZ — Next.js metadata işləmir.
//     useEffect + useApp.persist.rehydrate → ayrı client komponentə köçürüldü.

import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/AppProviders'
import { StoreRehydrator } from '@/components/StoreRehydrator'

export const metadata: Metadata = {
  title: 'Organik Gədəbəy',
  description: 'Organik məhsullar mağazası',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="az">
      <body>
        {/* QueryClientProvider bütün app-ı əhatə edir */}
        <AppProviders>
          {/* Zustand store-u rehydrate edir (client component) */}
          <StoreRehydrator />
          {children}
        </AppProviders>
      </body>
    </html>
  )
}