// app/(storefront)/layout.tsx

import Header from '@/components/Header';
import { StorefrontThemeProvider } from './StorefrontThemeProvider';
import ChatWidget from '@/components/ChatWidget';
import StoreFooter from '@/components/StoreFooter';

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <StorefrontThemeProvider>
        <Header />
        <main className="flex-1 py-6">{children}</main>
        <StoreFooter />
        <ChatWidget />
      </StorefrontThemeProvider>
    </div>
  );
}
