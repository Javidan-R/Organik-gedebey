// src/utils/useProductFilter.ts
import { useMemo } from 'react';
import { Product } from '@/types/products';
import { productDisplayPrice, avgRating, isDiscountActive, productTotalStock } from '@/lib/calc';

export interface FilterState {
  searchTerm: string;
  categoryId: string | '';
  showArchived: boolean;
  stockFilter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  discountOnly: boolean;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  sortKey: 'newest' | 'price_asc' | 'price_desc' | 'rating';
}

export function useProductFilters(products: Product[], filters: FilterState): Product[] {
  return useMemo(() => {
    let list = products;

    // 1. Archived filter
    if (!filters.showArchived) {
      list = list.filter((p) => !p.archived);
    }

    // 2. Search
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(term)) ||
          (p.slug || '').toLowerCase().includes(term) ||
          (p.description || '').toLowerCase().includes(term)
      );
    }

    // 3. Category
    if (filters.categoryId) {
      list = list.filter((p) => p.categoryId === filters.categoryId);
    }

    // 4. Price range
    const min = parseFloat(filters.minPrice);
    const max = parseFloat(filters.maxPrice);
    if (!isNaN(min) && min > 0) {
      list = list.filter((p) => productDisplayPrice(p) >= min);
    }
    if (!isNaN(max) && max > 0) {
      list = list.filter((p) => productDisplayPrice(p) <= max);
    }

    // 5. Stock
    if (filters.stockFilter === 'in_stock') {
      list = list.filter((p) => productTotalStock(p) > 0);
    } else if (filters.stockFilter === 'low_stock') {
      list = list.filter((p) => {
        const stock = productTotalStock(p);
        return stock > 0 && stock <= (p.minStock ?? 5);
      });
    } else if (filters.stockFilter === 'out_of_stock') {
      list = list.filter((p) => productTotalStock(p) === 0);
    }

    // 6. Discount only
    if (filters.discountOnly) {
      list = list.filter((p) => isDiscountActive(p));
    }

    // 7. Min rating
    const minRating = parseFloat(filters.minRating);
    if (!isNaN(minRating) && minRating > 0) {
      list = list.filter((p) => avgRating(p) >= minRating);
    }

    // 8. Sort
    const sorted = [...list];
    switch (filters.sortKey) {
      case 'newest':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price_asc':
        sorted.sort((a, b) => productDisplayPrice(a) - productDisplayPrice(b));
        break;
      case 'price_desc':
        sorted.sort((a, b) => productDisplayPrice(b) - productDisplayPrice(a));
        break;
      case 'rating':
        sorted.sort((a, b) => avgRating(b) - avgRating(a));
        break;
      default:
        break;
    }

    return sorted;
  }, [products, filters]);
}