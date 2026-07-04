/**
 * Centralized Product Utilities
 * Consolidates all product-related calculations and helpers
 * to prevent code duplication across components
 */
 
import { Product, ProductImage } from '@/types/products';
import { finalPrice } from '@/lib/calc';
import { DEFAULT_CURRENCY } from '@/const';

// ============================================================================
// PRICE CALCULATIONS
// ============================================================================

/**
 * Get the base price of a product (before discounts)
 * Handles both variants and simple products
 */
export function getProductBasePrice(product: Product): number {
  if (!product) return 0;
  return product.variants?.[0]?.price ?? product.price ?? 0;
}

/**
 * Get the final price after discount
 * Combines base price calculation with discount logic
 */
export function getProductFinalPrice(product: Product): number {
  const basePrice = getProductBasePrice(product);
  return finalPrice(basePrice, product.discountType, product.discountValue);
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(product: Product): number {
  const basePrice = getProductBasePrice(product);
  if (basePrice <= 0) return 0;
  const discountedPrice = getProductFinalPrice(product);
  return Math.max(0, Math.round(((basePrice - discountedPrice) / basePrice) * 100));
}

/**
 * Format currency with proper localization
 * Centralized currency formatting to prevent duplication
 */
export function formatCurrency(value: number, currency: string = DEFAULT_CURRENCY): string {
  if (typeof value !== 'number' || isNaN(value)) return `0.00 ${currency}`;
  return `${value.toFixed(2)} ${currency}`;
}

/**
 * Format price range for products with variants
 */
export function formatPriceRange(product: Product, currency: string = DEFAULT_CURRENCY): string {
  if (!product.variants || product.variants.length === 0) {
    return formatCurrency(getProductBasePrice(product), currency);
  }
  
  const prices = product.variants.map(v => v.price ?? 0);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  
  if (min === max) {
    return formatCurrency(min, currency);
  }
  
  return `${formatCurrency(min, currency)} - ${formatCurrency(max, currency)}`;
}

// ============================================================================
// IMAGE HANDLING
// ============================================================================

/**
 * Get the first image URL from a product
 * Handles both string URLs and ProductImage objects
 */
export function getFirstImageUrl(product: Product, placeholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EŞəkil yoxdur%3C/text%3E%3C/svg%3E'): string {
  if (!product?.images || !Array.isArray(product.images) || product.images.length === 0) {
    return placeholder;
  }

  const firstImage = product.images[0];
  if (typeof firstImage === 'string') return firstImage || placeholder;
  if (typeof firstImage === 'object' && firstImage?.url) return firstImage.url || placeholder;

  return placeholder;
}

/**
 * Get all image URLs from a product
 */
export function getAllImageUrls(product: Product, placeholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EŞəkil yoxdur%3C/text%3E%3C/svg%3E'): string[] {
  if (!product?.images || !Array.isArray(product.images)) return [placeholder];
  
  return product.images.map(img => {
    if (typeof img === 'string') return img || placeholder;
    if (typeof img === 'object' && img?.url) return img.url || placeholder;
    return placeholder;
  }).filter(url => url !== placeholder);
}

/**
 * Safe image URL extraction
 * Handles null, undefined, and invalid URLs
 */
export function safeImageUrl(img: ProductImage | string | null, placeholder: string = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EŞəkil yoxdur%3C/text%3E%3C/svg%3E'): string {
  if (!img) return placeholder;
  
  if (typeof img === 'string') {
    if (!img.trim() || img === 'null') return placeholder;
    return img;
  }
  
  if (typeof img === 'object' && img !== null) {
    if (!img.url || !img.url.trim()) return placeholder;
    return img.url;
  }
  
  return placeholder;
}

// ============================================================================
// STOCK CALCULATIONS
// ============================================================================

/**
 * Get total stock across all variants
 */
export function getTotalStock(product: Product): number {
  if (!product.variants || product.variants.length === 0) {
    return product.stock ?? 0;
  }
  
  return product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

/**
 * Check if product is in stock
 */
export function isInStock(product: Product): boolean {
  return getTotalStock(product) > 0;
}

/**
 * Check if product has low stock
 */
export function isLowStock(product: Product, threshold: number = 5): boolean {
  const stock = getTotalStock(product);
  const minStock = product.minStock ?? threshold;
  return stock > 0 && stock <= minStock;
}

/**
 * Check if product is out of stock
 */
export function isOutOfStock(product: Product): boolean {
  return getTotalStock(product) === 0;
}

/**
 * Get stock status for UI display
 */
export function getStockStatus(product: Product, threshold: number = 5): 'in_stock' | 'low_stock' | 'out_of_stock' {
  const stock = getTotalStock(product);
  const minStock = product.minStock ?? threshold;
  
  if (stock === 0) return 'out_of_stock';
  if (stock <= minStock) return 'low_stock';
  return 'in_stock';
}

// ============================================================================
// RATING & REVIEWS
// ============================================================================

/**
 * Calculate average product rating
 */
export function calculateProductRating(product: Product): number {
  if (!product.reviews?.length) return 0;
  const approvedReviews = product.reviews.filter(r => r.approved);
  if (!approvedReviews.length) return 0;
  return approvedReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / approvedReviews.length;
}

/**
 * Get review count
 */
export function getReviewCount(product: Product): number {
  return product.reviews?.filter(r => r.approved).length ?? 0;
}

/**
 * Format rating for display (e.g., "4.5 (120 reviews)")
 */
export function formatRating(product: Product): string {
  const rating = calculateProductRating(product);
  const count = getReviewCount(product);
  return `${rating.toFixed(1)} (${count} rəy)`;
}

// ============================================================================
// PRODUCT STATUS & BADGES
// ============================================================================

/**
 * Check if product is new (created within 7 days)
 */
export function isNewProduct(product: Product, daysThreshold: number = 7): boolean {
  if (!product?.createdAt) return false;
  try {
    const DAYS_IN_MS = daysThreshold * 24 * 60 * 60 * 1000;
    return Date.now() - new Date(product.createdAt).getTime() < DAYS_IN_MS;
  } catch {
    return false;
  }
}

/**
 * Check if product has active discount
 */
export function hasActiveDiscount(product: Product): boolean {
  if (!product.discountType || !product.discountValue) return false;
  
  if (product.discountStartDate && product.discountEndDate) {
    const now = Date.now();
    const start = new Date(product.discountStartDate).getTime();
    const end = new Date(product.discountEndDate).getTime();
    return now >= start && now <= end;
  }
  
  return true;
}

/**
 * Get product badges for UI display
 */
export function getProductBadges(product: Product): Array<{ label: string; tone: string }> {
  const badges: Array<{ label: string; tone: string }> = [];
  
  if (product.organic || product.statusTags?.includes('organic')) {
    badges.push({ label: 'Organik', tone: 'green' });
  }
  
  if (isNewProduct(product) || product.statusTags?.includes('newArrival')) {
    badges.push({ label: 'Yeni', tone: 'amber' });
  }
  
  if (product.statusTags?.includes('bestValue')) {
    badges.push({ label: 'Ən sərfəli', tone: 'blue' });
  }
  
  if (hasActiveDiscount(product)) {
    badges.push({ label: `-${calculateDiscountPercentage(product)}%`, tone: 'red' });
  }
  
  return badges.slice(0, 3); // Limit to 3 badges
}

// ============================================================================
// PRODUCT SCORING & RECOMMENDATIONS
// ============================================================================

/**
 * Score product for recommendations
 * Considers discount, rating, organic status, user interactions
 */
export function scoreProduct(
  product: Product,
  userViews: string[] = [],
  userWishlist: string[] = [],
  weights: {
    discount: number;
    rating: number;
    organic: number;
    mustTry: number;
    newProduct: number;
    viewCount: number;
    wishlistCount: number;
  } = {
    discount: 2,
    rating: 3,
    organic: 1,
    mustTry: 2,
    newProduct: 1.5,
    viewCount: 0.5,
    wishlistCount: 1,
  }
): number {
  if (!product || product.archived) return 0;
  
  let score = 0;
  
  score += calculateDiscountPercentage(product) * weights.discount;
  score += calculateProductRating(product) * weights.rating;
  
  if (product.organic) score += weights.organic;
  if (product.statusTags?.includes('mustTry')) score += weights.mustTry;
  if (isNewProduct(product)) score += weights.newProduct;
  if (userViews.includes(product.id)) score += weights.viewCount;
  if (userWishlist.includes(product.id)) score += weights.wishlistCount;
  
  return score;
}

// ============================================================================
// PRODUCT FILTERING
// ============================================================================

/**
 * Filter products by region
 */
export function filterProductsByRegion(products: Product[], regionKeywords: readonly string[]): Product[] {
  return products.filter(p => {
    if (p.archived) return false;
    const originRegion = p.originRegion?.toLowerCase() || '';
    const origin = p.origin?.toLowerCase() || '';
    return regionKeywords.some(kw => originRegion.includes(kw) || origin.includes(kw));
  });
}

/**
 * Filter products by tags
 */
export function filterProductsByTags(products: Product[], tags: string[]): Product[] {
  return products.filter(p => {
    if (p.archived) return false;
    return tags.some(tag => p.tags?.includes(tag));
  });
}

/**
 * Filter breakfast products
 */
export function filterBreakfastProducts(products: Product[], breakfastTags: string[] = ['səhər yeməyi', 'breakfast', 'bal', 'süd', 'pendir']): Product[] {
  return products.filter(p => {
    if (p.archived) return false;
    return breakfastTags.some(tag => p.tags?.includes(tag));
  });
}

// ============================================================================
// PRODUCT DISPLAY HELPERS
// ============================================================================

/**
 * Get short benefit text for product cards
 */
export function getShortBenefit(product: Product): string | null {
  if (!product) return null;
  if (product.benefits?.length) return product.benefits[0] || null;
  if (product.usageTips?.length) return product.usageTips[0] || null;
  if (product.originRegion) return `${product.originRegion} kəndindən təbii dad`;
  return null;
}

/**
 * Get product display name
 */
export function getDisplayName(product: Product): string {
  return product.name || 'Naməlum məhsul';
}

/**
 * Get product unit with proper formatting
 */
export function getProductUnit(product: Product): string {
  return product.unit || 'ədəd';
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if product data is valid
 */
export function isValidProduct(product: Product): boolean {
  return !!(
    product &&
    product.id &&
    product.name &&
    product.name.trim().length > 0
  );
}

/**
 * Safe JSON parse helper
 */
export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
