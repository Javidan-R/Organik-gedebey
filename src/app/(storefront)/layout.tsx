// app/(storefront)/layout.tsx

import Header from '@/components/Header';
import { Footer } from '@/components/footer';
import { StorefrontThemeProvider } from './StorefrontThemeProvider';
import ChatWidget from '@/components/ChatWidget';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <StorefrontThemeProvider>
        <Header />
        <main className="flex-1 py-6">{children}</main>
        <Footer />
        <ChatWidget />
      </StorefrontThemeProvider>
    </div>
  );
}
