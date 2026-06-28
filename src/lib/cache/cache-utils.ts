import { cacheGet, cacheSet, cacheDelete } from './redis';

// Cache keys generator
export const CacheKeys = {
  products: () => 'products:all',
  product: (id: string) => `product:${id}`,
  category: (id: string) => `category:${id}`,
  categories: () => 'categories:all',
  featuredProducts: () => 'products:featured',
  newArrivals: () => 'products:new',
  popularProducts: () => 'products:popular',
  searchResults: (query: string) => `search:${query}`,
};

// Cache TTL in seconds
export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// Revalidation strategies
export async function revalidateProduct(productId: string) {
  await cacheDelete(CacheKeys.product(productId));
  await cacheDelete(CacheKeys.products());
  await cacheDelete(CacheKeys.featuredProducts());
  await cacheDelete(CacheKeys.newArrivals());
  await cacheDelete(CacheKeys.popularProducts());
}

export async function revalidateCategory(categoryId: string) {
  await cacheDelete(CacheKeys.category(categoryId));
  await cacheDelete(CacheKeys.categories());
}

export async function revalidateAll() {
  // Invalidate all product-related caches
  await cacheDelete(CacheKeys.products());
  await cacheDelete(CacheKeys.categories());
  await cacheDelete(CacheKeys.featuredProducts());
  await cacheDelete(CacheKeys.newArrivals());
  await cacheDelete(CacheKeys.popularProducts());
}
