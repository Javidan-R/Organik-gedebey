// src/types/category.ts

import type { ID } from './products';

/**
 * Kateqoriya – vahid tip tərifi.
 * Bütün layihə bu tipdən istifadə edir.
 */
export interface Category {
  id: ID;
  name: string;
  slug: string;
  description?: string | null;
  // Şəkil sahələri
  imageUrl?: string | null;
  imageId?: string | null;
  imageAlt?: string | null;
  // Görünüş
  color?: string | null;
  icon?: string | null;
  // Təşkilat
  parentId?: ID | null;
  displayOrder?: number;
  // Vəziyyət
  isFeatured?: boolean;
  isActive?: boolean;
  archived?: boolean;
  // SEO
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  // Tarixlər
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: ID | null;
  updatedBy?: ID | null;
  // Hesablama sahələri (frontend üçün)
  _count?: {
    products?: number;
  };
  productsCount?: number;
  // Alt kateqoriyalar (tree üçün)
  children?: Category[];
  // Frontend alias (imageUrl üçün)
  image?: string | null;
  featured?: boolean;
}

/**
 * Kateqoriya yaratmaq üçün input tipi
 */
export type CategoryCreateInput = Omit<
  Category,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy' | '_count' | 'productsCount' | 'children'
> & {
  imageFile?: File; // Şəkil faylı (upload üçün)
};

/**
 * Kateqoriya yeniləmək üçün input tipi
 */
export type CategoryUpdateInput = Partial<CategoryCreateInput> & {
  id: ID;
};

/**
 * Kateqoriya filtrləri üçün tip
 */
export type CategoryFilters = {
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  archived?: boolean;
  parentId?: ID | null;
  limit?: number;
  offset?: number;
};

/**
 * Kateqoriya ağacı (tree) üçün tip
 */
export type CategoryTree = Category & {
  children: CategoryTree[];
};