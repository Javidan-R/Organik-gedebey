// src/app/(storefront)/products/[slug]/page.tsx
import { Metadata } from 'next';
import { db } from '@/lib/db';
import { products, reviews } from '@/lib/db/schema';
import { eq, and, not, desc } from 'drizzle-orm';
import { ProductDetailClient } from './ProductDetailClient';
import { Package } from 'lucide-react';
import { formatProductWithRelations } from '@/lib/utils/productFormatter';

// ─── Məhsul məlumatını gətir ──────────────────────────────────────
async function getProductData(slug: string) {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      category: true,
      images: true,
      variants: true,
      tags: true,
      reviews: {
        where: eq(reviews.isApproved, true),
        orderBy: desc(reviews.createdAt),
      },
    },
  });

  return product ? formatProductWithRelations(product) : null;
}

// ─── Oxşar məhsulları gətir (eyni kateqoriya, ən yenilər) ────────
async function getSimilarProducts(currentProductId: string, categoryId: string | null) {
  if (!categoryId) return [];

  const similar = await db.query.products.findMany({
    where: and(
      eq(products.categoryId, categoryId),
      eq(products.archived, false),
      not(eq(products.id, currentProductId))
    ),
    with: {
      images: true,
      variants: true,
      tags: true,
    },
    orderBy: desc(products.createdAt),
    limit: 4,
  });

  return similar.map(p => formatProductWithRelations(p));
}

// ─── Generate Metadata ──────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductData(slug);

  if (!product) {
    return {
      title: 'Məhsul tapılmadı | Organik Gədəbəy',
      description: 'Axtardığınız məhsul mövcud deyil.',
    };
  }

  // OpenGraph type "website" istifadə edirik, əlavə produkt məlumatları ilə
  return {
    title: `${product.name} | Organik Gədəbəy`,
    description: product.shortDescription || product.description?.slice(0, 160) || 'Təbii kənd məhsulları',
    openGraph: {
      title: product.name,
      description: product.shortDescription ?? product.description ?? '',
      images: product.images?.[0]?.url ?? '/og-image.jpg',
      type: 'website',
      // Məhsul spesifik əlavələr (istəyə görə)
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.shortDescription ?? '',
      images: product.images?.[0]?.url ?? '/og-image.jpg',
    },
  };
}

// ─── Server Component ──────────────────────────────────────────────
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProductData(slug);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 px-4">
        <div className="text-center max-w-md">
          <Package className="mx-auto h-20 w-20 text-slate-300" />
          <h2 className="mt-4 text-2xl font-black text-slate-700">Məhsul tapılmadı</h2>
          <p className="mt-2 text-sm text-slate-500">Axtardığınız məhsul hazırda mövcud deyil.</p>
        </div>
      </div>
    );
  }

  const similarProducts = await getSimilarProducts(product.id, product.categoryId);

  return (
    <ProductDetailClient
      initialProduct={product}
    />
  );
}