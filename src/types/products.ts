// src/types/products.ts
// ============================================================
// BÜTÜN PRODUCT-A AİD TİPLƏR TEK HƏQIQƏT MƏNBƏYİ
// ============================================================

import type React from 'react';

// ─── Primitiv köməkçi tiplər ────────────────────────────────
export type ID = string;
export type ProductCardViewMode = 'grid' | 'list';

// ─── UnitType (vahid növü) ───────────────────────────────────
export type UnitType =
  | 'ədəd'
  | 'kq'
  | 'qram'
  | 'litr'
  | 'ml'
  | 'qutu'
  | 'paket'
  | 'balon'
  | 'meşov';

// ─── Endirim növü ────────────────────────────────────────────
export type DiscountType = 'percentage' | 'fixed' | 'PERCENTAGE' | 'FIXED' | null; 

// ─── Məhsulun keyfiyyət dərəcəsi ─────────────────────────────
export type ProductGrade = 'A' | 'B' | 'C' | 'Unsorted';

// ─── Məhsulun status teqləri ─────────────────────────────────
export type ProductStatus =
  | 'featured'
  | 'newArrival'
  | 'seasonal'
  | 'organic'
  | 'bestValue'
  | 'limitedEdition'
  | 'mustTry'
  | 'ecoFriendly'
  | 'locallySourced'
  | 'upcoming'
  | 'bestSeller'
  | 'flashDeal'
  | 'fresh';

// ─── Şəkil ───────────────────────────────────────────────────
export type ProductImage = {
  id?: string;
  url: string;
  src?: string;
  alt?: string;
  displayOrder?: number;
  source?: 'upload' | 'url';
};

// ─── Qidalanma faktı ─────────────────────────────────────────
export type NutritionalFact = {
  key:
    | 'calories'
    | 'protein'
    | 'fat'
    | 'carbs'
    | 'fiber'
    | 'sugar'
    | 'salt'
    | string;
  value: string;
  unit?: string;
};

// ─── Variant ─────────────────────────────────────────────────
export type Variant = {
  id: ID;
  productId?: ID;
  label?: string;
  name: string;
  sku?: string;
  price: number;
  costPrice: number;
  arrivalCost?: number;
  stock: number;
  minStock?: number;
  weight?: number;
  length?: number;
  isDefault?: boolean;
  grade: ProductGrade;
  batchDate: string; // ISO string
  shelfLifeDays?: number;
  allergens?: string[];
  colorHex?: string;
  nutritionalFacts?: NutritionalFact[];
  unit?: UnitType;
  createdAt: string;
  updatedAt?: string;
};

// ─── Rəy ─────────────────────────────────────────────────────
export type Review = {
  id: ID;
  productId: ID;
  name: string;
  text: string;
  rating: number;
  approved: boolean;
  createdAt: string;
};

// ─── Resept ──────────────────────────────────────────────────
export type RecipeItem = {
  id: string;
  name: string;
  time: string;
  difficulty: 'Asan' | 'Orta' | 'Çətin';
  emoji: string;
  ingredients: string[];
  steps: string[];
  servings: number;
};
export type Category = {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: ID | null;
  color?: string;
  createdAt?: string;
  archived?: boolean;   // burada null yoxdur
  featured?: boolean;
  _count?: {
    products?: number;
  };
};

// ─── Əsas Product tipi ───────────────────────────────────────
export type Product = {
  metaKeywords?: string[];
  isVegan?: boolean;
  isGlutenFree?: boolean;
  // ── İdentifikasiya ──────────────────────────────────────
  id: ID;
  name: string;
  slug: string;

  // ── Təsvir ──────────────────────────────────────────────
  description: string;
  shortDescription?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: string[];

  // ── Kateqoriya ──────────────────────────────────────────
  categoryId: ID;
  category?: Category | null;

  // ── Qiymət ──────────────────────────────────────────────
  basePrice: number;
  costPrice?: number;
  price?: number;
  unit?: UnitType;

  // ── Endirim ─────────────────────────────────────────────
discountType?: 'percentage' | 'fixed' | 'PERCENTAGE' | 'FIXED' | null; 
 discountValue?: number;
  discountStart?: string | null;
  discountEnd?: string | null;
  discountPercent?: number; // @deprecated
  discountStartDate?: string; // @deprecated
  discountEndDate?: string; // @deprecated

  // ── Stok ────────────────────────────────────────────────
  stock: number;
  minStock?: number;
  quantityStep: number;
  shelfLifeDays?: number;

  // ── Media ────────────────────────────────────────────────
  images: ProductImage[];
  image?: string;
  video?: string;

  // ── Teqlər ──────────────────────────────────────────────
  tags: string[];

  // ── Status ──────────────────────────────────────────────
  archived: boolean;
  isOrganic: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isSeasonal: boolean; // ✅ ƏLAVƏ EDİLDİ
  organic?: boolean; // @deprecated
  seasonal?: boolean; // @deprecated
  featured?: boolean; // @deprecated
  isNew?: boolean; // @deprecated
  isUpcoming?: boolean;
  isFresh?: boolean;
  flashDeal?: boolean;
  flashDealStart?: string;
  flashDealEnd?: string;
  statusTags?: ProductStatus[];

  // ── Keyfiyyət ────────────────────────────────────────────
  grade?: ProductGrade;
  originRegion?: string | null;
  origin?: string | null;
  weight?: number;

  // ── Ətraflı məlumatlar ──────────────────────────────────
  nutritionalFacts?: NutritionalFact[];
  benefits?: string[];
  usageTips?: string[];
  storageConditions?: string[];
  storageNotes?: string[]; // @deprecated
  allergens?: string[];
  certificates?: string[];
  attributes?: Record<string, any>; // və ya daha dəqiq tip

  // ── Variantlar, rəylər, reseptlər ───────────────────────
  variants: Variant[];
  reviews?: Review[];
  recipes?: RecipeItem[];

  // ── Satış statistikası ───────────────────────────────────
  soldCount: number; // ✅ ƏLAVƏ EDİLDİ

  // ── Tarixlər ────────────────────────────────────────────
  createdAt: string;
  updatedAt?: string;

  // ── SEO ──────────────────────────────────────────────────
  seoTitle?: string;
  seoDescription?: string;
};

// ─── Səbət elementi ──────────────────────────────────────────
export type CartItem = {
  productId: ID;
  variantId?: ID;
  qty: number;
};

// ─── ProductCard props ───────────────────────────────────────
export type ProductCardProps = {
  p: Product;
  categoryMap: Record<ID, string>;
  setEditingProduct: (p: Product | null) => void;
  archiveProduct: (id: ID) => void;
  unarchiveProduct: (id: ID) => void;
  deleteProduct: (id: ID) => void;
  viewMode?: ProductCardViewMode;
};

// ─── ProductEditModal props ──────────────────────────────────
export type ProductEditModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: Product | null;
};

// ─── Tab açarları ────────────────────────────────────────────
export type TabKey =
  | 'basic'
  | 'stock'
  | 'media'
  | 'labels'
  | 'discount'
  | 'benefits'
  | 'tips'
  | 'nutrition'
  | 'reviews'
  | 'settings'
  | 'seo';

// ─── Stat kartı ──────────────────────────────────────────────
export type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'slate' | 'green' | 'red' | 'amber' | 'purple';
  helperText?: string;
  isHighValue?: boolean;
};

// ─── Skeleton ────────────────────────────────────────────────
export type SkeletonProps = {
  viewMode: ProductCardViewMode;
};

// ─── API cavab tipləri ───────────────────────────────────────
export type ProductsApiResponse = {
  products: Product[];
  pagination: {
    total: number;
    page?: number;
    limit?: number;
  };
};

export type SingleProductApiResponse = {
  product: Product;
};

export type ProductCreatePayload = Omit<
  Product,
  'id' | 'createdAt' | 'updatedAt' | 'category' | 'reviews' | 'soldCount'
>;

export type ProductUpdatePayload = Partial<ProductCreatePayload>;

// ─── Zustand store action tipləri ───────────────────────────
export type ProductActions = {
  addProduct: (p: Product) => void;
  updateProduct: (id: ID, updates: Partial<Product>) => void;
  deleteProduct: (id: ID) => Promise<void>;
  archiveProduct: (id: ID) => Promise<void>;
  unarchiveProduct: (id: ID) => Promise<void>;
};