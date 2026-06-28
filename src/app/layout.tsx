// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { AppProviders } from '@/components/AppProviders'
import { StoreRehydrator } from '@/components/StoreRehydrator'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallback } from '@/components/ErrorFallback'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { ServiceWorkerRegister } from '@/components/performance/ServiceWorkerRegister'
import { WebVitals } from '@/components/performance/WebVitals'
import { head } from 'lodash'

export const metadata: Metadata = {
  title: {
    default: 'Organik Gədəbəy – 100% Təbii Kənd Məhsulları | Bal, Pendir, Qaymaq, Bəhməz',
    template: '%s | Organik Gədəbəy',
  },
  description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr. 100% təbii, əl istehsalı, ekoloji təmiz kənd məhsulları. Azərbaycanın ən yaxşı organik məhsul mağazası.',
  keywords: ['organik məhsullar', 'kənd məhsulları', 'Gədəbəy bal', 'təbii bal', 'qaymaq', 'pendir', 'bəhməz', 'sirkə', 'quru meyvə', 'dağ məhsulları', 'ekoloji məhsullar', 'əl istehsalı', 'Azərbaycan kənd məhsulları', 'təbii qida', 'organik bazar', 'Gədəbəy rayonu', 'səhər yeməyi', 'süd məhsulları', 'təbii çərəz', 'dağ balı', 'arı məhsulları', 'ev yeməyi', 'sağlam qida'],
  authors: [{ name: 'Organik Gədəbəy', url: 'https://organikgedebey.az' }],
  creator: 'Organik Gədəbəy',
  publisher: 'Organik Gədəbəy',
  metadataBase: new URL('https://organikgedebey.az'),
  alternates: {
    canonical: '/',
    languages: {
      'az-AZ': '/az',
      'en-US': '/en',
      'ru-RU': '/ru',
    },
  },
  openGraph: {
    title: 'Organik Gədəbəy – 100% Təbii Kənd Məhsulları | Bal, Pendir, Qaymaq, Bəhməz',
    description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr. 100% təbii, əl istehsalı, ekoloji təmiz kənd məhsulları. Azərbaycanın ən yaxşı organik məhsul mağazası.',
    url: 'https://organikgedebey.az',
    siteName: 'Organik Gədəbəy',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Organik Gədəbəy - Təbii kənd məhsulları - Bal, Pendir, Qaymaq, Bəhməz',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organik Gədəbəy – 100% Təbii Kənd Məhsulları | Bal, Pendir, Qaymaq',
    description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə. 100% təbii, əl istehsalı.',
    images: ['/og-image.jpg'],
    creator: '@organikgedebey',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="az" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#4f9f4f" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body suppressHydrationWarning>
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <WebVitals />
          <ServiceWorkerRegister />
          <AppProviders>
            <StoreRehydrator />
            {children}
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}