import { Suspense } from 'react';
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { products, categories, orders } from '@/lib/db/schema';
import { HomePageClient } from './HomePageClient';

export const metadata: Metadata = {
  title: 'Organik Gədəbəy – Təbii kənd məhsulları',
  description: 'Gədəbəy dağlarından birbaşa süfrənizə: bal, qaymaq, pendir, quru meyvələr. 100% təbii, əl istehsalı.',
  openGraph: {
    title: 'Organik Gədəbəy',
    description: 'Ən təmiz kənd məhsulları',
    images: ['/og-image.jpg'],
  },
};

async function getInitialData() {
  const allProducts = await db.select().from(products);
  const allCategories = await db.select().from(categories);
  const allOrders = await db.select().from(orders);
  return { products: allProducts, categories: allCategories, orders: allOrders };
}

export default async function HomePage() {
  const initialData = await getInitialData();
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yüklənir...</div>}>
      <HomePageClient initialData={initialData} />
    </Suspense>
  );
}