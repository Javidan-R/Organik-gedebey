import { DAYS_7_IN_MS, MAX_BADGES, PRODUCT_SCORING_WEIGHTS, BREAKFAST_TAGS } from "@/const"
import { finalPrice } from "@/lib/calc"
import { ProductBadge } from "@/types/home"
import { Product } from "@/types/products"
import { formatCurrency as formatCurrencyUtil } from "@/utils/formatting"

export function getProductBasePrice(product: Product): number {
  if (!product) return 0
  return product.variants?.[0]?.price ?? product.price ?? 0
}

export function getFirstImageUrl(product: Product): string {
  const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EŞəkil yoxdur%3C/text%3E%3C/svg%3E';
  if (!product?.images || !Array.isArray(product.images) || product.images.length === 0) {
    return placeholder
  }
  const firstImage = product.images[0]
  if (typeof firstImage === 'string') return firstImage || placeholder
  if (typeof firstImage === 'object' && firstImage?.url) return firstImage.url || placeholder
  return placeholder
}

export function isNewProduct(product: Product): boolean {
  if (!product?.createdAt) return false
  try {
    return Date.now() - new Date(product.createdAt).getTime() < DAYS_7_IN_MS
  } catch {
    return false
  }
}

export function buildProductBadges(product: Product): ProductBadge[] {
  if (!product) return []
  const badges: ProductBadge[] = []
  if (product.organic || product.statusTags?.includes('organic')) badges.push({ label: 'Organik', tone: 'green' })
  if (isNewProduct(product) || product.statusTags?.includes('newArrival')) badges.push({ label: 'Yeni', tone: 'amber' })
  if (product.statusTags?.includes('bestValue')) badges.push({ label: 'Ən sərfəli', tone: 'blue' })
  return badges.slice(0, MAX_BADGES)
}

export function getShortBenefit(product: Product): string | null {
  if (!product) return null
  if (product.benefits?.length) return product.benefits[0]
  if (product.usageTips?.length) return product.usageTips[0]
  if (product.originRegion) return `${product.originRegion} kəndindən təbii dad`
  return null
}

// Re-export from centralized utils for backward compatibility
export const formatCurrency = formatCurrencyUtil;

export function calculateProductRating(product: Product): number {
  if (!product.reviews?.length) return 0
  return product.reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / product.reviews.length
}

export function calculateDiscountPercentage(product: Product): number {
  const basePrice = getProductBasePrice(product)
  if (basePrice <= 0) return 0
  const discountedPrice = finalPrice(basePrice, product.discountType, product.discountValue)
  return Math.max(0, ((basePrice - discountedPrice) / basePrice) * 100)
}

 export function scoreProduct(product: Product, userViews: string[] = [], userWishlist: string[] = []): number {
  if (!product || product.archived) return 0
  let score = 0
  score += calculateDiscountPercentage(product) * PRODUCT_SCORING_WEIGHTS.DISCOUNT
  score += calculateProductRating(product) * PRODUCT_SCORING_WEIGHTS.RATING
  if (product.organic) score += PRODUCT_SCORING_WEIGHTS.ORGANIC
  if (product.statusTags?.includes('mustTry')) score += PRODUCT_SCORING_WEIGHTS.MUST_TRY
  if (isNewProduct(product)) score += PRODUCT_SCORING_WEIGHTS.NEW_PRODUCT
  if (userViews.includes(product.id)) score += PRODUCT_SCORING_WEIGHTS.VIEW_COUNT
  if (userWishlist.includes(product.id)) score += PRODUCT_SCORING_WEIGHTS.WISHLIST_COUNT
  return score
}

export function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try { return JSON.parse(value) as T } catch { return fallback }
}

export function filterProductsByRegion(products: Product[], regionKeywords: readonly string[]): Product[] {
  return products.filter(p => {
    if (p.archived) return false
    const originRegion = p.originRegion?.toLowerCase() || ''
    const origin = p.origin?.toLowerCase() || ''
    return regionKeywords.some(kw => originRegion.includes(kw) || origin.includes(kw))
  })
}

export function filterBreakfastProducts(products: Product[]): Product[] {
  return products.filter(p => {
    if (p.archived) return false
    return BREAKFAST_TAGS.some(tag => p.tags?.includes(tag))
  })
}