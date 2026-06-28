'use client';

import { HeaderClient } from './HeaderClient';
import { useApp } from '@/lib/store';
import type { Category } from '@/lib/types';

export function HeaderWrapper({ initialCategories }: { initialCategories: Category[] }) {
  const storefrontConfig = useApp((state) => state.storefrontConfig);
  const promoBanners = (storefrontConfig?.headerBanners as { text: string; color: string; link?: string }[]) || [
    { text: "🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!", color: "from-emerald-600 to-teal-600" },
    { text: "🎁 İlk sifarişə 10% endirim! Kupon: XOSGELDIN10", color: "from-orange-500 to-red-500" },
  ];

  return <HeaderClient initialCategories={initialCategories} initialPromoBanners={promoBanners} />;
}
