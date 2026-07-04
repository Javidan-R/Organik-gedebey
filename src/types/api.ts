/**
 * API Type Definitions
 * 
 * Centralized type definitions for API requests, responses,
 * and common data structures used across the application.
 */

// ============================================
// COMMON TYPES
// ============================================
 
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'COURIER' | 'WAREHOUSE_STAFF' | 'MANAGER' | 'ADMIN' | 'SUPERADMIN';
  avatarUrl?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  isBlocked: boolean;
  totalOrders: number;
  totalSpent: number;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  phone?: string;
  firstName: string;
  lastName: string;
  role?: User['role'];
}

export interface UserUpdateInput {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  role?: User['role'];
}

// ============================================
// PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: string;
  unit: string;
  categoryId?: string;
  archived: boolean;
  images: ProductImage[];
  variants: ProductVariant[];
  tags: ProductTag[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  displayOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: string;
  stock: number;
  attributes: Record<string, string>;
}

export interface ProductTag {
  id: string;
  productId: string;
  name: string;
}

export interface ProductCreateInput {
  name: string;
  slug?: string;
  description?: string;
  basePrice: string;
  unit?: string;
  categoryId?: string;
  images?: string[];
  variants?: Omit<ProductVariant, 'id' | 'productId'>[];
  tags?: string[];
}

// ============================================
// CATEGORY TYPES
// ============================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  description?: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCreateInput {
  name: string;
  slug?: string;
  imageUrl?: string;
  description?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

// ============================================
// ADDRESS TYPES
// ============================================

export interface Address {
  id: string;
  userId: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressCreateInput {
  type: Address['type'];
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postalCode?: string;
  isDefault?: boolean;
}

// ============================================
// BASKET TYPES
// ============================================

export interface Basket {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  type: 'weekly' | 'seasonal' | 'custom';
  servings: number | null;
  unit: string;
  origin: string | null;
  freshness: string | null;
  nutrition: string[];
  basePrice: string;
  discountPrice: string | null;
  stock: number;
  bestseller: boolean;
  trending: boolean;
  new: boolean;
  lowStock: boolean;
  archived: boolean;
  images: BasketMedia[];
  variants: BasketVariant[];
  contents: BasketContent[];
  extras: BasketExtra[];
  createdAt: string;
  updatedAt: string;
}

export interface BasketMedia {
  id: string;
  basketId: string;
  url: string;
  displayOrder: number;
}

export interface BasketVariant {
  id: string;
  basketId: string;
  name: string;
  price: string;
  stock: number;
}

export interface BasketContent {
  id: string;
  basketId: string;
  productId: string;
  productName: string;
  quantity: number;
}

export interface BasketExtra {
  id: string;
  basketId: string;
  basketVariantId: string;
  productId: string;
  productName: string;
  quantity: number;
}

// ============================================
// FINANCE TYPES
// ============================================

export interface FinanceSupplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  paymentTermDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'pos' | 'wallet';
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancePurchase {
  id: string;
  date: string;
  supplierId: string;
  productId?: string;
  variantId?: string;
  qty: number;
  unitCost: string;
  accountId?: string;
  paid: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancePayment {
  id: string;
  date: string;
  supplierId: string;
  accountId: string;
  amount: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinanceLedger {
  id: string;
  date: string;
  accountId: string;
  type: 'in' | 'out';
  amount: string;
  refKind?: string;
  refId?: string;
  memo?: string;
  createdAt: string;
}

// ============================================
// WHATSAPP TYPES
// ============================================

export interface WhatsAppMessage {
  id: string;
  phone: string;
  direction: 'INBOUND' | 'OUTBOUND';
  messageType: 'text' | 'image' | 'document';
  content?: string;
  mediaUrl?: string;
  mediaContentType?: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  messageSid?: string;
  createdAt: string;
  updatedAt: string;
}
