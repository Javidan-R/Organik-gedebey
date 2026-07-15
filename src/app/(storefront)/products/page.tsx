// src/app/(storefront)/products/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { products, categories, productImages } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProductsPageClient } from "./ProductsPageClient";
import { formatProducts } from "@/lib/utils/productFormatter";
// ✅ Import only the types (no runtime code)
import type { FormattedProduct } from "./ProductsPageClient";
import { Category } from "@/types/products";

export const metadata: Metadata = {
  title:
    "Məhsullar – 100% Təbii Kənd Məhsulları | Bal, Pendir, Qaymaq, Bəhməz | Organik Gədəbəy",
  description:
    "Gədəbəy dağlarından ən təzə kənd məhsulları: bal, qaymaq, pendir, bəhməz, sirkə, quru meyvələr və s. 100% təbii, əl istehsalı, ekoloji təmiz. Pulsuz çatdırılma.",
  keywords: [
    "məhsullar",
    "kənd məhsulları",
    "bal",
    "pendir",
    "qaymaq",
    "bəhməz",
    "sirkə",
    "quru meyvə",
    "təbii",
    "organik",
    "Gədəbəy",
    "əl istehsalı",
    "ekoloji",
    "online alış-veriş",
    "kənd məhsulları satışı",
  ],
  openGraph: {
    title: "Məhsullar – 100% Təbii Kənd Məhsulları | Organik Gədəbəy",
    description:
      "Gədəbəy dağlarından ən təzə kənd məhsulları: bal, qaymaq, pendir, bəhməz, sirkə. 100% təbii, əl istehsalı.",
    images: ["/og-image.jpg"],
    type: "website",
    siteName: "Organik Gədəbəy",
    locale: "az_AZ",
  },
  alternates: {
    canonical: "/products",
  },
};

// ─── Server-side data fetch ──────────────────────────────────────────────
async function getInitialData() {
  const [allProducts, rawCategories] = await Promise.all([
    db.query.products.findMany({
      where: eq(products.archived, false),
      orderBy: [desc(products.createdAt)],
      limit: 100,
      with: {
        images: {
          orderBy: [productImages.displayOrder],
        },
        variants: true,
        tags: true,
      },
    }),
    db.select().from(categories).where(eq(categories.archived, false)),
  ]);

  // Format products and filter nulls
  const formattedProducts = formatProducts(allProducts).filter(
    (p): p is NonNullable<typeof p> => p != null
  ) as FormattedProduct[];

  // Map categories to the exact CategoryItem shape
  const allCategories = rawCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    archived: c.archived ?? false, // always false because of the query, but safe default
  }));

  return {
    products: formattedProducts,
    categories: allCategories,
  };
}

export default async function ProductsPage() {
  const initialData = await getInitialData();

  return (
    <Suspense>
      <ProductsPageClient initialData={initialData} />
    </Suspense>
  );
}