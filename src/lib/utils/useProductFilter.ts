// src/app/admin/products/useProductFilters.ts
'use client';

import { useMemo } from 'react';
import type { Product, ID } from '@/lib/types';
import { productDisplayPrice, productTotalStock, avgRating } from '@/lib/calc';

export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'rating';

export type FilterState = {
  searchTerm: string;
  categoryId: ID | '';
  showArchived: boolean;
  stockFilter: StockFilter;
  discountOnly: boolean;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sortKey: SortKey;
};

export function useProductFilters(
  products: Product[],
  filters: FilterState,
) {
  const {
    searchTerm,
    categoryId,
    showArchived,
    stockFilter,
    discountOnly,
    minPrice,
    maxPrice,
    minRating,
    sortKey,
  } = filters;

  const filtered = useMemo(() => {
    if (!products || products.length === 0) return [];

    const q = searchTerm.trim().toLowerCase();
    const hasQuery = q.length > 0;

    const minPriceNum = minPrice ? parseFloat(minPrice.replace(',', '.')) : undefined;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice.replace(',', '.')) : undefined;
    const minRatingNum = minRating ? parseFloat(minRating.replace(',', '.')) : undefined;

    const list = products.filter((p) => {
      // Archived
      if (p.archived !== showArchived) return false;

      // Category
      if (categoryId && p.categoryId !== categoryId) return false;

      // Search – name, tags, slug, description
      if (hasQuery) {
        const inName = p.name.toLowerCase().includes(q);
        const inSlug = (p.slug || '').toLowerCase().includes(q);
        const inTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        const inDesc = (p.description || '').toLowerCase().includes(q);
        if (!inName && !inSlug && !inTags && !inDesc) return false;
      }

      const price = productDisplayPrice(p);
      const stock = productTotalStock(p);
      const rating = avgRating(p);

      // Price range
      if (typeof minPriceNum === 'number' && !Number.isNaN(minPriceNum)) {
        if (price < minPriceNum) return false;
      }
      if (typeof maxPriceNum === 'number' && !Number.isNaN(maxPriceNum)) {
        if (price > maxPriceNum) return false;
      }

      // Rating
      if (typeof minRatingNum === 'number' && !Number.isNaN(minRatingNum)) {
        if (rating < minRatingNum) return false;
      }

      // Discount only
      if (discountOnly) {
        const hasDiscount =
          p.discountType !== undefined &&
          p.discountValue !== undefined &&
          p.discountValue > 0;
        if (!hasDiscount) return false;
      }

      // Stock filter
      const lowStockThreshold = p.minStock ?? 5;
      if (stockFilter === 'out_of_stock' && stock > 0) return false;
      if (stockFilter === 'in_stock' && stock <= 0) return false;
      if (stockFilter === 'low_stock' && !(stock > 0 && stock <= lowStockThreshold)) {
        return false;
      }

      return true;
    });

    const sorted = [...list];

    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'price_asc':
          return productDisplayPrice(a) - productDisplayPrice(b);
        case 'price_desc':
          return productDisplayPrice(b) - productDisplayPrice(a);
        case 'rating':
          return avgRating(b) - avgRating(a);
        case 'newest':
        default:
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
      }
    });

    return sorted;
  }, [
    products,
    searchTerm,
    categoryId,
    showArchived,
    stockFilter,
    discountOnly,
    minPrice,
    maxPrice,
    minRating,
    sortKey,
  ]);

  return filtered;
}
