// types/basket.ts

// ── DB-level sub-types (from Drizzle relations) ────────────────────────────────
export interface BasketContentItem {
  id: string;
  content: string;
  displayOrder: number;
}
 
export interface BasketExtraItem {
  id: string;
  extra: string;
  displayOrder: number;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  altText?: string;
  displayOrder: number;
}

// ── Variant as returned from DB ────────────────────────────────────────────────
export interface BasketVariant {
  id: string;
  basketId?: string;
  variant: 'econom' | 'standard' | 'premium';
  price: string;           // Drizzle decimal → string
  originalPrice?: string;
  stock: number;
  gift?: string | null;
  contents: BasketContentItem[];
  extras: BasketExtraItem[];
  createdAt?: string;
  updatedAt?: string;
}

// ── Basket as returned from DB ─────────────────────────────────────────────────
export interface Basket {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  categoryId?: string;
  category?: Category;
  type: 'gence' | 'gedebey' | 'sheki' | 'lenkaran' | 'ramazan' | 'custom';
  servings?: string;
  unit?: string;
  origin?: string;
  freshness?: string;
  nutrition?: string[];
  bestseller?: boolean;
  trending?: boolean;
  new?: boolean;
  lowStock?: boolean;
  stock?: number;
  discount?: number;
  highlights?: string[];
  displayOrder?: number;
  isActive?: boolean;
  archived?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  viewCount?: number;
  soldCount?: number;
  averageRating?: string;
  reviewCount?: number;
  favoriteCount?: number;
  seasonalStart?: string;
  seasonalEnd?: string;
  isSeasonal?: boolean;
  createdAt: string;
  updatedAt: string;
  media?: MediaItem[];
  variants?: BasketVariant[];
  favorites?: BasketFavorite[];
  reviews?: BasketReview[];
  products?: BasketProductComposition[];
}

// ── Filter state for admin page ────────────────────────────────────────────────
export interface FilterState {
  searchTerm: string;
  type: string;
  showArchived: boolean;
  stockFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  discountOnly: boolean;
  sortKey: 'newest' | 'price_asc' | 'price_desc' | 'name';
}

// ── Internal form variant (edit modal) ────────────────────────────────────────
// Flat strings — normalised from DB objects on load, serialised back on save
export interface FormVariant {
  _key: string;         // local-only stable key (not sent to server)
  id?: string;          // present when editing existing
  variant: 'econom' | 'standard' | 'premium';
  price: string;
  originalPrice: string;
  stock: number;
  gift: string;
  contents: string[];   // plain strings (what the API expects on write)
  extras: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Extract plain string from either a DB content object or a raw string */
export const getContentString = (c: BasketContentItem | string): string =>
  typeof c === 'string' ? c : c.content;

export const getExtraString = (e: BasketExtraItem | string): string =>
  typeof e === 'string' ? e : e.extra;

/** Normalise a DB BasketVariant into a FormVariant for the edit modal */
export const toFormVariant = (v: BasketVariant): FormVariant => ({
  _key: v.id ?? crypto.randomUUID(),
  id: v.id,
  variant: v.variant,
  price: String(v.price ?? '0'),
  originalPrice: String(v.originalPrice ?? ''),
  stock: v.stock ?? 0,
  gift: v.gift ?? '',
  contents: (v.contents ?? []).map(getContentString),
  extras: (v.extras ?? []).map(getExtraString),
});

export const emptyFormVariant = (): FormVariant => ({
  _key: crypto.randomUUID(),
  variant: 'standard',
  price: '',
  originalPrice: '',
  stock: 0,
  gift: '',
  contents: [],
  extras: [],
});

/** Variant price as a number (safe parse) */
export const variantPrice = (v: BasketVariant | FormVariant): number =>
  parseFloat(String(v.price)) || 0;

// ── Basket Favorite ───────────────────────────────────────────────────────────
export interface BasketFavorite {
  id: string;
  userId: string;
  basketId: string;
  createdAt: string;
  basket?: Basket;
}

// ── Basket Review ─────────────────────────────────────────────────────────────
export interface BasketReview {
  id: string;
  basketId: string;
  userId: string;
  orderId?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  basket?: Basket;
}

// ── Basket Analytics ─────────────────────────────────────────────────────────
export interface BasketAnalytics {
  id: string;
  basketId: string;
  userId?: string;
  sessionId?: string;
  eventType: 'view' | 'click' | 'add_to_cart' | 'purchase';
  metadata?: Record<string, any>;
  createdAt: string;
}

// ── Basket Product Composition ───────────────────────────────────────────────
export interface BasketProductComposition {
  id: string;
  basketId: string;
  basketVariantId?: string;
  productId: string;
  productVariantId?: string;
  quantity: string;
  unit?: string;
  displayOrder: number;
  createdAt: string;
  product?: Product;
  productVariant?: ProductVariant;
}

// ── Category (imported from categories) ───────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  parentId?: string;
  displayOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  archived?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Product (imported from products) ───────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  categoryId?: string;
  basePrice: string;
  costPrice?: string;
  unit?: string;
  grade?: 'A' | 'B' | 'C' | 'UNSORTED';
  minStock?: number;
  originRegion?: string;
  supplier?: string;
  shelfLifeDays?: number;
  isOrganic?: boolean;
  isGlutenFree?: boolean;
  isVegan?: boolean;
  archived?: boolean;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ── Product Variant (imported from products) ───────────────────────────────────
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  basePrice: string;
  costPrice?: string;
  arrivalCost?: string;
  stock: number;
  minStock?: number;
  unit?: string;
  grade?: 'A' | 'B' | 'C' | 'UNSORTED';
  batchDate?: string;
  batchNumber?: string;
  expiryDate?: string;
  weight?: string;
  dimensions?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}