import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

import { AppProviders } from '@/components/AppProviders';
import { ServiceWorkerRegister } from '@/components/performance/ServiceWorkerRegister';
import { WebVitals } from '@/components/performance/WebVitals';

export const metadata: Metadata = {
  title: {
    default: 'Organik Gədəbəy – Təbii Kənd Məhsulları',
    template: '%s | Organik Gədəbəy',
  },
  description: 'Gədəbəy dağlarından birbaşa süfrənizə: ən təbii bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr. 100% təbii, əl istehsalı.',
  keywords: [
    'organik məhsullar',
    'kənd məhsulları',
    'Gədəbəy bal',
    'təbii bal',
    'qaymaq',
    'pendir',
  ],
  authors: [{ name: 'Organik Gədəbəy', url: 'https://organikgedebey.az' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'https://organikgedebey.az'),
  openGraph: {
    title: 'Organik Gədəbəy – Təbii Kənd Məhsulları',
    description: 'Gədəbəy dağlarından birbaşa süfrənizə...',
    url: process.env.NEXT_PUBLIC_URL || 'https://organikgedebey.az',
    siteName: 'Organik Gədəbəy',
    locale: 'az_AZ',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Organik Gədəbəy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organik Gədəbəy',
    description: 'Təbii kənd məhsulları',
    images: ['/og-image.jpg'],
    creator: '@organikgedebey',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

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

        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body suppressHydrationWarning>
        <WebVitals />
        <ServiceWorkerRegister />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}