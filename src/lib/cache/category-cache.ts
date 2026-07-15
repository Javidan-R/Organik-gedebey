// src/lib/cache/category-cache.ts
// Bütün fetch çağırışlarına `credentials: 'include'` əlavə edildi

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category, CategoryTree } from '@/types/category';

const CACHE_KEYS = {
  categories: ['categories'],
  tree: ['categories', 'tree'],
  single: (id: string) => ['categories', id],
};

/**
 * Admin panelində kateqoriyaları çəkmək üçün React Query hook-u
 * Stale-while-revalidate strategiyası ilə
 */
export function useCategories(options?: { isActive?: boolean; archived?: boolean }) {
  return useQuery({
    queryKey: [...CACHE_KEYS.categories, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.isActive !== undefined) params.set('isActive', String(options.isActive));
      if (options?.archived !== undefined) params.set('archived', String(options.archived));
      params.set('limit', '100');

      const res = await fetch(`/api/admin/categories?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      return data.items as Category[];
    },
    staleTime: 1000 * 60 * 5, // 5 dəqiqə
    gcTime: 1000 * 60 * 30, // 30 dəqiqə
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

/**
 * Kateqoriya ağacını (tree) çəkmək üçün React Query hook-u
 */
export function useCategoryTree(options?: { includeArchived?: boolean }) {
  return useQuery({
    queryKey: [...CACHE_KEYS.tree, options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.includeArchived) params.set('includeArchived', 'true');

      const res = await fetch(`/api/admin/categories/tree?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch category tree');
      const data = await res.json();
      return data.tree as CategoryTree[];
    },
    staleTime: 1000 * 60 * 10, // 10 dəqiqə
    gcTime: 1000 * 60 * 60, // 1 saat
    refetchOnWindowFocus: false,
  });
}

/**
 * Tək kateqoriyanı cache-ləyir
 */
export function useCategory(id: string) {
  return useQuery({
    queryKey: CACHE_KEYS.single(id),
    queryFn: async () => {
      const res = await fetch(`/api/admin/categories/${id}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch category');
      return res.json() as Promise<Category>;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!id,
  });
}

/**
 * Kateqoriya cache-ni invalid etmək üçün hook
 */
export function useInvalidateCategories() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.categories });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.tree });
  };
}