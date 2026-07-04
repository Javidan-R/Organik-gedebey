/**
 * Fresh Today Product Utilities
 * 
 * Helper functions for product data transformation, filtering, 
 * and formatting specific to the Fresh Today feature.
 */

import type { Product } from '@/types/products';
import { finalPrice } from '@/lib/calc';
import { formatCurrency as formatCurrencyUtil } from '@/utils/formatting';

/**
 * Get the first image URL from a product, with fallback
 */
export function safeGetImageUrl(product: Product | null): string {
  if (!product?.images || !Array.isArray(product.images) || product.images.length === 0) {
    return '/placeholder.jpg';
  }
  
  const firstImage = product.images[0];
  if (typeof firstImage === 'string') return firstImage || '/placeholder.jpg';
  if (typeof firstImage === 'object' && firstImage?.url) return firstImage.url || '/placeholder.jpg';
  
  return '/placeholder.jpg';
}

/**
 * Extract the base price from a product
 */
export function getProductBasePrice(product: Product): number {
  if (!product) return 0;
  
  const variantPrice = product.variants?.[0]?.price;
  const productPrice = product.price;
  const basePrice = product.basePrice;
  
  const price = variantPrice ?? productPrice ?? basePrice ?? 0;
  return typeof price === 'string' ? parseFloat(price) : price;
}

/**
 * Calculate discount percentage
 */
export function calculateDiscount(product: Product): number {
  const basePrice = getProductBasePrice(product);
  if (basePrice <= 0) return 0;
  
  const final = finalPrice(basePrice, product.discountType, product.discountValue);
  const discount = Math.round((1 - final / basePrice) * 100);
  return Math.max(0, discount);
}

/**
 * Get current stock level
 */
export function getProductStock(product: Product): number {
  return product.variants?.[0]?.stock ?? product.stock ?? 0;
}

/**
 * Check if product is low on stock
 */
export function isLowStock(product: Product, threshold: number = 5): boolean {
  const stock = getProductStock(product);
  return stock > 0 && stock <= threshold;
}

/**
 * Check if product is out of stock
 */
export function isOutOfStock(product: Product): boolean {
  return getProductStock(product) <= 0;
}

/**
 * Check if product is hot (very low stock)
 */
export function isHotProduct(product: Product, threshold: number = 3): boolean {
  const stock = getProductStock(product);
  return stock > 0 && stock <= threshold;
}

/**
 * Format final product price with discounts applied
 */
export function formatProductPrice(product: Product): string {
  const basePrice = getProductBasePrice(product);
  const final = finalPrice(basePrice, product.discountType, product.discountValue);
  return formatCurrencyUtil(final);
}

/**
 * Format original price before discounts
 */
export function formatOriginalPrice(product: Product): string {
  const basePrice = getProductBasePrice(product);
  return formatCurrencyUtil(basePrice);
}

/**
 * Get product origin/region
 */
export function getProductOrigin(product: Product): string {
  return product.originRegion || product.origin || 'Gədəbəy';
}

/**
 * Check if product is a new arrival
 */
export function isNewArrival(product: Product, days: number = 7): boolean {
  if (!product.createdAt) return false;
  
  if (product.isNewArrival) return true;
  if (product.statusTags?.includes('newArrival')) return true;
  
  const createdDate = new Date(product.createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  
  return diffDays <= days;
}

/**
 * Check if product is upcoming
 */
export function isUpcoming(product: Product): boolean {
  return product.statusTags?.includes('upcoming') || false;
}

/**
 * Generate share text for product (WhatsApp, etc.)
 */
export function generateShareText(product: Product): string {
  const price = formatProductPrice(product);
  const origin = getProductOrigin(product);
  
  return `🌿 *${product.name}*\n\n💰 ${price}\n📍 ${origin}\n\n🛒 Sifarişlər üçün WhatsApp:\nhttps://wa.me/994773676021`;
}

/**
 * Generate WhatsApp message for product order
 */
export function generateWhatsAppMessage(product: Product, quantity: number = 1): string {
  return encodeURIComponent(
    `Salam! ${product.name} - ${quantity} ədəd sifariş etmək istəyirəm 🌿`
  );
}

/**
 * Validate product data integrity
 */
export function validateProduct(product: Product): boolean {
  if (!product.id || !product.name) return false;
  if (!product.images || product.images.length === 0) return false;
  if (!product.variants || product.variants.length === 0) return false;
  return true;
}

/**
 * Sort products by freshness (newest first)
 */
export function sortByFreshness(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}

/**
 * Filter products added within specified days
 */
export function filterFreshProducts(products: Product[], days: number = 7): Product[] {
  const now = Date.now();
  const threshold = now - (days * 24 * 60 * 60 * 1000);
  
  return products.filter(p => {
    if (p.archived) return false;
    if (p.isNewArrival) return true;
    if (p.statusTags?.includes('newArrival')) return true;
    const createdDate = new Date(p.createdAt || 0).getTime();
    return createdDate > threshold;
  });
}

/**
 * Filter products marked as upcoming
 */
export function filterUpcomingProducts(products: Product[]): Product[] {
  return products.filter(p => {
    if (p.archived) return false;
    return p.statusTags?.includes('upcoming') || false;
  });
}
