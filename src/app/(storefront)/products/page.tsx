import { Suspense } from 'react';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProductsPageClient } from './ProductsPageClient';

export const metadata: Metadata = {
  title: 'Məhsullar – 100% Təbii Kənd Məhsulları | Bal, Pendir, Qaymaq, Bəhməz | Organik Gədəbəy',
  description: 'Gədəbəy dağlarından ən təzə kənd məhsulları: bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr və s. 100% təbii, əl istehsalı, ekoloji təmiz. Pulsuz çatdırılma.',
  keywords: ['məhsullar', 'kənd məhsulları', 'bal', 'pendir', 'qaymaq', 'bəhməz', 'sirkə', 'quru meyvə', 'təbii', 'organik', 'Gədəbəy', 'əl istehsalı', 'ekoloji', 'online alış-veriş', 'kənd məhsulları satışı'],
  openGraph: {
    title: 'Məhsullar – 100% Təbii Kənd Məhsulları | Organik Gədəbəy',
    description: 'Gədəbəy dağlarından ən təzə kənd məhsulları: bal, qaymaq, pendir, bəhməz, sirkə. 100% təbii, əl istehsalı.',
    images: ['/og-image.jpg'],
  },
};

async function getInitialData() {
  // Optimize: Only fetch active products with pagination
  const allProducts = await db.select().from(products).where(eq(products.archived, false)).limit(100);
  const allCategories = await db.select().from(categories).where(eq(categories.archived, false));
  return { products: allProducts, categories: allCategories };
}

export default async function ProductsPage() {
  const initialData = await getInitialData();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yüklənir...</div>}>
      <ProductsPageClient initialData={initialData} />
    </Suspense>
  );
}
