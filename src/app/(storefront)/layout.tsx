// app/(storefront)/layout.tsx
'use client';

import Header from '@/components/Header';
import { Footer } from '@/components/footer';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1  py-6">{children}</main>
      <Footer />
    </div>
  );
}
