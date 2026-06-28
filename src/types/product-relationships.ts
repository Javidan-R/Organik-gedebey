// ============================================================
// src/types/product-relationships.ts
// Product Relationships - Orders, Baskets, Users, Categories
// ============================================================

import type { ID } from './products';

// ─── Product-Order Relationship ───────────────────────────────
export type ProductOrderRelation = {
  productId: ID;
  orderId: ID;
  orderNumber: string;
  orderDate: string;
  quantity: number;
  priceAtPurchase: string;
  variantId?: ID;
  variantName?: string;
  customerName: string;
  customerEmail?: string;
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
};

// ─── Product-Basket Relationship ───────────────────────────────
export type ProductBasketRelation = {
  productId: ID;
  basketId: ID;
  basketName: string;
  basketType: 'gence' | 'gedebey' | 'sheki' | 'lenkaran' | 'ramazan' | 'custom';
  basketSlug: string;
  isAvailable: boolean;
  basketPrice: string;
  basketDiscount?: number;
  basketStock: number;
};

// ─── Product-User Relationship ─────────────────────────────────
export type ProductUserRelation = {
  productId: ID;
  userId: ID;
  userName: string;
  userEmail?: string;
  relationType: 'wishlist' | 'favorite' | 'recently_viewed' | 'purchased';
  relationDate: string;
  quantity?: number;
};

// ─── Product-Category Hierarchy ───────────────────────────────
export type ProductCategoryHierarchy = {
  productId: ID;
  categoryId: ID;
  categoryName: string;
  categorySlug: string;
  categoryPath: string[]; // ['Meyvə', 'Tərəvəz', 'Yarpaq']
  parentCategoryId?: ID;
  parentCategoryName?: string;
  subcategories: {
    id: ID;
    name: string;
    slug: string;
    productCount: number;
  }[];
};

// ─── Product Analytics ─────────────────────────────────────────
export type ProductAnalytics = {
  productId: ID;
  productName: string;
  // Sales metrics
  totalOrders: number;
  totalQuantitySold: number;
  totalRevenue: string;
  averageOrderValue: string;
  // View metrics
  viewCount: number;
  uniqueViews: number;
  conversionRate: number;
  // Rating metrics
  averageRating: number;
  totalReviews: number;
  approvedReviews: number;
  pendingReviews: number;
  // Stock metrics
  totalStock: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  // Time-based metrics
  salesLast7Days: number;
  salesLast30Days: number;
  salesLast90Days: number;
  // Trend
  salesTrend: 'up' | 'down' | 'stable';
  popularityRank: number;
};

// ─── Product Inventory Status ─────────────────────────────────
export type ProductInventoryStatus = {
  productId: ID;
  productName: string;
  variants: {
    variantId: ID;
    variantName: string;
    sku?: string;
    stock: number;
    minStock: number;
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    lastRestockDate?: string;
    nextRestockDate?: string;
  }[];
  overallStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  totalStock: number;
  needsRestock: boolean;
};

// ─── Product Compatibility ─────────────────────────────────────
export type ProductCompatibility = {
  productId: ID;
  productName: string;
  compatibleWith: {
    baskets: ProductBasketRelation[];
    categories: ProductCategoryHierarchy[];
    relatedProducts: {
      productId: ID;
      productName: string;
      relation: 'cross_sell' | 'up_sell' | 'complementary';
      confidence: number;
    }[];
  };
  incompatibleWith: {
    products: ID[];
    categories: ID[];
  }[];
};

// ─── Product Recommendations ───────────────────────────────────
export type ProductRecommendation = {
  productId: ID;
  productName: string;
  reason: 'frequently_bought_together' | 'similar_products' | 'trending' | 'new_arrival' | 'discounted';
  confidence: number;
  score: number;
  basedOn?: {
    userId?: ID;
    orderId?: ID;
    categoryId?: ID;
  };
};

// ─── Product Search Result ─────────────────────────────────────
export type ProductSearchResult = {
  productId: ID;
  productName: string;
  slug: string;
  category: {
    id: ID;
    name: string;
    slug: string;
  };
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  rating: number;
  reviewCount: number;
  stock: number;
  isOrganic: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  relevanceScore: number;
  matchFields: string[]; // ['name', 'description', 'tags']
};

// ─── Product Bulk Operation ────────────────────────────────────
export type ProductBulkOperation = {
  operation: 'update_price' | 'update_stock' | 'archive' | 'unarchive' | 'delete' | 'update_category';
  productIds: ID[];
  data: {
    price?: number;
    stock?: number;
    categoryId?: ID;
    archived?: boolean;
  };
  reason?: string;
};

// ─── Product Export ───────────────────────────────────────────
export type ProductExport = {
  format: 'csv' | 'xlsx' | 'json';
  filters: {
    categoryIds?: ID[];
    dateFrom?: string;
    dateTo?: string;
    includeArchived?: boolean;
  };
  fields: string[];
};

// ─── Product Import ───────────────────────────────────────────
export type ProductImport = {
  format: 'csv' | 'xlsx' | 'json';
  data: any[];
  options: {
    skipDuplicates: boolean;
    updateExisting: boolean;
    validateOnly: boolean;
  };
};

// ─── Product Activity Log ──────────────────────────────────────
export type ProductActivityLog = {
  id: ID;
  productId: ID;
  productName: string;
  action: 'created' | 'updated' | 'deleted' | 'archived' | 'restored' | 'price_changed' | 'stock_changed';
  performedBy: {
    userId: ID;
    userName: string;
    userRole: string;
  };
  changes: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
};
