import { db } from '@/lib/db';
import { products, categories } from '@/lib/db/schema';

export default async function sitemap() {
  const baseUrl = 'https://organikgedebey.az';

  const productsList = await db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products);
  const categoriesList = await db.select({ slug: categories.slug }).from(categories);

  const productUrls = productsList.map(p => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: p.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categoryUrls = categoriesList.map(c => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/products`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...productUrls,
    ...categoryUrls,
  ];
}