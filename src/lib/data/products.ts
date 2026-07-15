// src/lib/data/products.ts
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Product } from "@/types/products";

export async function getProductBySlug(slug: string): Promise<Product> {
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      variants: true,
      images: true,
      tags: true,
      // reviews, ratings ayrıca əlaqələndirilə bilər
    },
  });

  if (!product) throw new Error("Məhsul tapılmadı");

  // API‑dan gələn formatı Product tipinə çevirən utilit
  return formatProductWithRelations(product);
}