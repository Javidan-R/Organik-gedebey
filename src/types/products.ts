// ============================================================
// src/types/products.ts  –  TEK HƏQIQƏT MƏNBƏYİ
// Bütün product-a aid tiplər buradadır.
// @/lib/types.ts-dəki UnitType/Variant dublikatları SİLİNMƏLİDİR.
// ============================================================

import type React from 'react';

// ─── Primitiv köməkçi tiplər ────────────────────────────────
export type ID = string;
export type ProductCardViewMode = 'grid' | 'list';

// ─── UnitType (vahid növü) ───────────────────────────────────
// ÖNƏMLİ: @/lib/types.ts-dəki eyni tipini silib bunu re-export edin
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
export type DiscountType = 'percentage' | 'fixed';

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
  | 'bestSeller';

// ─── Şəkil ───────────────────────────────────────────────────
export type ProductImage = {
  id?: string;
  url: string;
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
  value: string;   // Məs: '100 kcal', '5g'
  unit?: string;   // Məs: 'g', 'kcal'
};

// ─── Variant (ÖNƏMLİ: dublikat silinib) ─────────────────────
export type Variant = {
  id: ID;
  productId?: ID;
  label?: string;
  name: string;
  sku?: string;
  /** Satış qiyməti */
  price: number;
  /** Maya dəyəri */
  costPrice: number;
  /** Daşıma daxil ümumi maya dəyəri */
  arrivalCost?: number;
  /** Stok miqdarı */
  stock: number;
  /** Minimum stok həddi */
  minStock?: number;
  /** Məhsulun çəkisi (kq) */
  weight?: number;
  /** Uzunluq (sm) */
  length?: number;
  /** Bu variantın standart/default olub-olmadığı */
  isDefault?: boolean;
  /** Keyfiyyət dərəcəsi */
  grade: ProductGrade;
  /** Partiya/lot tarixi (FIFO üçün) */
  batchDate: string;
  /** Yararlılıq müddəti (gün) */
  shelfLifeDays?: number;
  /** Allergenlər */
  allergens?: string[];
  /** Rəng kodu */
  colorHex?: string;
  /** Qidalanma faktları */
  nutritionalFacts?: NutritionalFact[];
  /** Vahid növü */
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

// ─── Kateqoriya ──────────────────────────────────────────────
export type Category = {
  id: ID;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: ID | null;
  createdAt?: string;
};

// ─── Əsas Product tipi ───────────────────────────────────────
// DÜZƏLİŞLƏR:
//  - basePrice: undefined → number (undefined default dəyər aradan qaldırıldı)
//  - isNewArrival/isFeatured: boolean | undefined → boolean
//  - shortDescription: any → string | null
//  - isNew: string → boolean
//  - category: string → Category | null (DB ilişkisini əks etdirir)
export type Product = {
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
  /** DB-dən gələn əsas qiymət (string deyil, number) */
  basePrice: number;                  // ← DÜZƏLİŞ: undefined → number
  costPrice?: number;
  price?: number;                     // hesablanmış/göstəriş qiyməti
  unit?: UnitType;

  // ── Endirim ─────────────────────────────────────────────
  discountType?: DiscountType;
  discountValue?: number;
  discountStart?: string | null;
  discountEnd?: string | null;
  /** @deprecated discountPercent əvəzinə discountValue istifadə edin */
  discountPercent?: number;
  /** @deprecated discountStartDate əvəzinə discountStart istifadə edin */
  discountStartDate?: string;
  /** @deprecated discountEndDate əvəzinə discountEnd istifadə edin */
  discountEndDate?: string;

  // ── Stok ────────────────────────────────────────────────
  stock: number;
  minStock?: number;
  quantityStep: number;               // min satış addımı (məs: 0.5kq)
  shelfLifeDays?: number;

  // ── Media ────────────────────────────────────────────────
  images: ProductImage[];
  image?: string;                     // əsas şəkil URL (computed)
  video?: string;

  // ── Teqlər ──────────────────────────────────────────────
  tags: string[];

  // ── Status ──────────────────────────────────────────────
  archived: boolean;
  isOrganic: boolean;                 // ← DÜZƏLİŞ: organic? → isOrganic
  isFeatured: boolean;                // ← DÜZƏLİŞ: boolean|undefined → boolean
  isNewArrival: boolean;              // ← DÜZƏLİŞ: boolean|undefined → boolean
  isSeasonal: boolean;                // ← DÜZƏLİŞ: seasonal? → isSeasonal
  /** @deprecated isOrganic istifadə edin */
  organic?: boolean;
  /** @deprecated isSeasonal istifadə edin */
  seasonal?: boolean;
  /** @deprecated isFeatured istifadə edin */
  featured?: boolean;
  /** @deprecated isNewArrival istifadə edin */
  isNew?: boolean;

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
  storageConditions?: string[];       // ← DÜZƏLİŞ: storageNotes → storageConditions
  storageNotes?: string[];            // @deprecated
  allergens?: string[];
  certificates?: string[];
  attributes?: { key: string; value: string }[];

  // ── Variantlar, rəylər, reseptlər ───────────────────────
  variants: Variant[];
  reviews?: Review[];
  recipes?: RecipeItem[];

  // ── Satış statistikası ───────────────────────────────────
  soldCount: number;

  // ── Tarixlər ────────────────────────────────────────────
  createdAt: string;
  updatedAt?: string;

  // ── SEO (köhnə sahələri geri-uyğun saxlayırıq) ──────────
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

export type ProductCreatePayload = Omit<Product,
  'id' | 'createdAt' | 'updatedAt' | 'category' | 'reviews' | 'soldCount'
>;

export type ProductUpdatePayload = Partial<ProductCreatePayload>;

// ─── Zustand store action tipləri ───────────────────────────
export type ProductActions = {
  addProduct:       (p: Product) => void;
  updateProduct:    (id: ID, updates: Partial<Product>) => void;
  deleteProduct:    (id: ID) => Promise<void>;
  archiveProduct:   (id: ID) => Promise<void>;
  unarchiveProduct: (id: ID) => Promise<void>;
};