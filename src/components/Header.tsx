import { Suspense, cache } from 'react';
import { HeaderClient } from './HeaderClient';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Category } from '@/lib/types';

const getCategories = cache(async function getCategories(): Promise<Category[]> {
  try {
    const cats = await db
      .select()
      .from(categories)
      .where(eq(categories.archived, false))
      .limit(20);

    return cats.map((cat) => ({
      _count: { products: 0 },
      image: cat.imageUrl || '',
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      description: cat.description || undefined,
      archived: cat.archived,
      featured: cat.isFeatured,
      createdAt: cat.createdAt.toISOString(),
      parentId: cat.parentId || undefined,
    }));
  } catch (error) {
    console.error('Kateqoriyalar alınarkən xəta:', error);
    return [];
  }
});


export default async function Header() {
  const categories = await getCategories();
  const promoBanners = [
    { text: "🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!", color: "from-emerald-600 to-teal-600" },
    { text: "🎁 İlk sifarişə 10% endirim! Kupon: XOSGELDIN10", color: "from-orange-500 to-red-500" },
  ];

  return (
    <Suspense fallback={<div className="h-20 bg-white/80 animate-pulse" />}>
      <HeaderClient initialCategories={categories} initialPromoBanners={promoBanners} />
    </Suspense>
  );
}