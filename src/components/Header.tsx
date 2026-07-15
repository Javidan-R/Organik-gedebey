// src/components/Header.tsx
// Production-ready, tam, qısaldılmamış, bug-sız versiya

import { Suspense, cache } from 'react';
import { HeaderClient } from './HeaderClient';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import type { Category } from '@/lib/types';
import { logger } from '@/lib/logger';

/**
 * Kateqoriyaları server tərəfdən çəkir və cache-ləyir.
 * `cache()` ilə eyni request daxilində təkrar sorğunun qarşısı alınır.
 */
const getCategories = cache(async function getCategories(): Promise<Category[]> {
  try {
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.archived, false))
      .orderBy(desc(categories.isFeatured), desc(categories.displayOrder), desc(categories.createdAt))
      .limit(20);

    return cats.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? undefined,
      image: cat.imageUrl ?? undefined,
      imageUrl: cat.imageUrl ?? undefined,
      imageId: cat.imageId ?? undefined,
      imageAlt: cat.imageAlt ?? undefined,
      color: cat.color ?? undefined,
      icon: cat.icon ?? undefined,
      parentId: cat.parentId ?? undefined,
      displayOrder: cat.displayOrder ?? 0,
      isFeatured: cat.isFeatured ?? false,
      isActive: cat.isActive ?? true,
      archived: cat.archived ?? false,
      metaTitle: cat.metaTitle ?? undefined,
      metaDescription: cat.metaDescription ?? undefined,
      metaKeywords: cat.metaKeywords ?? undefined,
      createdAt: cat.createdAt?.toISOString() ?? new Date().toISOString(),
      updatedAt: cat.updatedAt?.toISOString() ?? undefined,
      createdBy: cat.createdBy ?? undefined,
      updatedBy: cat.updatedBy ?? undefined,
      _count: { products: 0 },
      productsCount: 0,
    }));
  } catch (error) {
    logger.error('Header: Kateqoriyalar alınarkən xəta:', { error });
    return [];
  }
});

/**
 * Promo bannerləri çəkir (sabit məlumat, amma future-da DB-dən gələ bilər)
 */
const getPromoBanners = cache(async function getPromoBanners() {
  // Burada future-da database-dən çəkmək olar
  return [
    { text: '🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!', color: 'from-emerald-600 to-teal-600' },
    { text: '🎁 İlk sifarişə 10% endirim! Kupon: XOSGELDIN10', color: 'from-orange-500 to-red-500' },
  ];
});

/**
 * Əsas Header komponenti (Server Component)
 * - Kateqoriyaları və promo bannerləri paralel yükləyir
 * - Suspense ilə Client Component-ə ötürür
 */
export default async function Header() {
  // Paralel data yükləmə
  const [categories, promoBanners] = await Promise.all([
    getCategories(),
    getPromoBanners(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="h-20 bg-white/80 animate-pulse border-b border-emerald-100/50" />
      }
    >
      <HeaderClient
        initialCategories={categories}
        initialPromoBanners={promoBanners}
      />
    </Suspense>
  );
}