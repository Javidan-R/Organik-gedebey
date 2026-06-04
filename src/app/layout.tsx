// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/AppProviders'
import { StoreRehydrator } from '@/components/StoreRehydrator'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ErrorFallback'

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
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <AppProviders>
            <StoreRehydrator />
            {children}
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}