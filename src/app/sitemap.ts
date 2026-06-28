// src/app/sitemap.ts
// DÜZƏLİŞ: /product/ → /products/ (köhnədə 404 idi)

import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export default async function sitemap() {
  const baseUrl = 'https://organikgedebey.az'

  try {
    const [productsList, categoriesList] = await Promise.all([
      db
        .select({ slug: products.slug, updatedAt: products.updatedAt })
        .from(products)
        .where(eq(products.archived, false)),
      db
        .select({ slug: categories.slug })
        .from(categories)
        .where(eq(categories.archived, false)),
    ])

    const productUrls = productsList.map((p) => ({
      url: `${baseUrl}/products/${p.slug}`,   // ← /products/ (düzəldi)
      lastModified: p.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    const categoryUrls = categoriesList.map((c) => ({
      url: `${baseUrl}/category/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
      { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
      { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
      { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.6 },
      { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.5 },
      ...productUrls,
      ...categoryUrls,
    ]
  } catch {
    // DB xətası — yalnız static URL-lər
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 1 },
      { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
      { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.8 },
    ]
  }
}
