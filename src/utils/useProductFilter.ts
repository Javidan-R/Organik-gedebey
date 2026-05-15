// src/utils/useProductFilter.ts
// ─────────────────────────────────────────────────────────────────────────────
// ARXİV BUGININ HƏLLİ:
//   Problem: unarchiveProduct() çağrısından sonra `showArchived` state-i
//   hələ `true` qalır. Filter yeniləndikdə məhsul `archived:false` olduğuna
//   görə "arxiv" filterdən çıxır — ekranda görünmür.
//
//   Həll: page.tsx-dəki `handleUnarchiveProduct` funksiyası həm store-u
//   yeniləyir, həm də `showArchived → false` çevirir (aşağıda açıqlanır).
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo } from 'react';
import { Product, ID } from '@/types/products';

export interface FilterState {
  searchTerm:   string;
  categoryId:   ID | '';
  showArchived: boolean;
  stockFilter:  'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
  discountOnly: boolean;
  minPrice:     string;
  maxPrice:     string;
  minRating:    string;
  sortKey:      'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'rating' | 'name_az' | 'stock_asc' | 'stock_desc';
}

export function getStock(p: Product): number {
  if (p.variants?.length) return p.variants.reduce((s, v) => s + (v.stock ?? 0), 0);
  return p.stock ?? 0;
}

export function getMinStockThreshold(p: Product): number {
  return p.minStock ?? 5;
}

export function getLowestPrice(p: Product): number {
  if (p.variants?.length) return Math.min(...p.variants.map(v => v.price ?? p.price ?? 0));
  return p.price ?? 0;
}

export function getAvgRating(p: Product): number {
  if (!p.reviews?.length) return 0;
  return p.reviews.reduce((s: number, r: any) => s + (r.rating ?? 0), 0) / p.reviews.length;
}

export function getIsOnSale(p: Product): boolean {
  const hasDiscount = (p.discountPercent ?? p.discountValue ?? 0) > 0;
  if (!hasDiscount) return false;
  const now   = Date.now();
  const start = p.discountStartDate ? new Date(p.discountStartDate).getTime() : 0;
  const end   = p.discountEndDate   ? new Date(p.discountEndDate).getTime()   : Infinity;
  return now >= start && now <= end;
}

export function useProductFilters(products: Product[], filters: FilterState): Product[] {
  return useMemo(() => {
    let list = [...products];

    // 1. ARXİV FİLTERİ
    // showArchived=true  → YALNIZ p.archived===true olanlar
    // showArchived=false → YALNIZ p.archived!==true olanlar (aktiv)
    list = list.filter(p =>
      filters.showArchived ? p.archived === true : p.archived !== true
    );

    // 2. AXTARIŞ
    const q = filters.searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter(p =>
        p.name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t: string) => t.toLowerCase().includes(q)) ||
        (p.originRegion ?? '').toLowerCase().includes(q)
      );
    }

    // 3. KATEQORİYA
    if (filters.categoryId) list = list.filter(p => p.categoryId === filters.categoryId);

    // 4. STOK
    if (filters.stockFilter !== 'all') {
      list = list.filter(p => {
        const stock = getStock(p);
        const min   = getMinStockThreshold(p);
        if (filters.stockFilter === 'in_stock')     return stock > min;
        if (filters.stockFilter === 'low_stock')    return stock > 0 && stock <= min;
        if (filters.stockFilter === 'out_of_stock') return stock === 0;
        return true;
      });
    }

    // 5. ENDİRİM
    if (filters.discountOnly) list = list.filter(getIsOnSale);

    // 6. QİYMƏT
    const minP = filters.minPrice !== '' ? parseFloat(filters.minPrice) : null;
    const maxP = filters.maxPrice !== '' ? parseFloat(filters.maxPrice) : null;
    if (minP != null && !isNaN(minP)) list = list.filter(p => getLowestPrice(p) >= minP);
    if (maxP != null && !isNaN(maxP)) list = list.filter(p => getLowestPrice(p) <= maxP);

    // 7. REYTİNQ
    const minR = filters.minRating !== '' ? parseFloat(filters.minRating) : null;
    if (minR != null && !isNaN(minR)) list = list.filter(p => getAvgRating(p) >= minR);

    // 8. SORT
    list.sort((a, b) => {
      switch (filters.sortKey) {
        case 'oldest':     return +new Date(a.createdAt ?? 0) - +new Date(b.createdAt ?? 0);
        case 'price_asc':  return getLowestPrice(a) - getLowestPrice(b);
        case 'price_desc': return getLowestPrice(b) - getLowestPrice(a);
        case 'rating':     return getAvgRating(b) - getAvgRating(a);
        case 'name_az':    return (a.name ?? '').localeCompare(b.name ?? '', 'az');
        case 'stock_asc':  return getStock(a) - getStock(b);
        case 'stock_desc': return getStock(b) - getStock(a);
        default:           return +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0);
      }
    });

    return list;
  }, [products, filters]);
}