// src/hooks/useCategories.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useApp } from '@/lib/store';
import type { Category, ID } from '@/lib/types';

const CATEGORIES_QUERY_KEY = ['categories'];

// ─── FETCH ALL (PUBLIC - storefront üçün) ─────────────────────────
async function fetchCategories(): Promise<Category[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Kateqoriyalar yüklənərkən xəta');
  }
  const data = await res.json();
  return data.categories || data;
}

// ─── FETCH ALL (ADMIN - bütün kateqoriyalar üçün) ─────────────────
async function fetchAdminCategories(): Promise<Category[]> {
  const res = await fetch('/api/admin/categories', {
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Kateqoriyalar yüklənərkən xəta');
  }
  const data = await res.json();
  return data.categories || data;
}

export function useAdminCategories() {
  const setCategories = useApp((state) => state.setCategories);

  const query = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchAdminCategories,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (query.data) {
      setCategories(query.data);
    }
  }, [query.data, setCategories]);

  return query;
}

export function useCategories() {
  const setCategories = useApp((state) => state.setCategories);

  const query = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    // ❌ SİLİNDİ: onSuccess — TanStack Query v5-də useQuery-nin
    // onSuccess callback-i tamamilə silinib, sükutla ignore olunurdu.
    // Bu, kateqoriyaların store-a HEÇ VAXT yazılmamasının səbəbi idi.
  });

  // ✅ ƏVƏZİNDƏ: useEffect ilə store-u sinxronlaşdırırıq
  // (useProducts.ts-dəki düzgün pattern ilə eyni)
  useEffect(() => {
    if (query.data) {
      setCategories(query.data);
    }
  }, [query.data, setCategories]);

  return query;
}

// ─── FETCH SINGLE ──────────────────────────────────────────────
async function fetchCategory(id: ID): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`);
  if (!res.ok) throw new Error('Kateqoriya tapılmadı');
  return res.json();
}

export function useCategory(id: ID) {
  return useQuery({
    queryKey: [...CATEGORIES_QUERY_KEY, id],
    queryFn: () => fetchCategory(id),
    enabled: !!id,
  });
}

// ─── CREATE ────────────────────────────────────────────────────
async function createCategory(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
  const res = await fetch('/api/admin/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Kateqoriya yaradılmadı');
  }
  const result = await res.json();
  return result.category;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const addCategory = useApp((state) => state.addCategory);

  return useMutation({
    mutationFn: createCategory,
    onSuccess: (newCategory) => {
      addCategory(newCategory);
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

// ─── UPDATE ────────────────────────────────────────────────────
async function updateCategory({ id, data }: { id: ID; data: Partial<Category> }): Promise<Category> {
  const res = await fetch(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Kateqoriya yenilənmədi');
  }
  const result = await res.json();
  return result.category;
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const updateCategoryStore = useApp((state) => state.updateCategory);

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: (updated) => {
      updateCategoryStore(updated);
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...CATEGORIES_QUERY_KEY, updated.id] });
    },
  });
}

// ─── ARCHIVE ────────────────────────────────────────────────────
async function archiveCategory(id: ID): Promise<void> {
  const res = await fetch(`/api/admin/categories/${id}/archive`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Arxivləşdirmə alınmadı');
}

export function useArchiveCategory() {
  const queryClient = useQueryClient();
  const archiveCategoryStore = useApp((state) => state.archiveCategory);

  return useMutation({
    mutationFn: archiveCategory,
    onSuccess: (_, id) => {
      archiveCategoryStore(id);
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

// ─── UNARCHIVE ──────────────────────────────────────────────────
async function unarchiveCategory(id: ID): Promise<void> {
  const res = await fetch(`/api/admin/categories/${id}/unarchive`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Arxivdən çıxarma alınmadı');
}

export function useUnarchiveCategory() {
  const queryClient = useQueryClient();
  const unarchiveCategoryStore = useApp((state) => state.unarchiveCategory);

  return useMutation({
    mutationFn: unarchiveCategory,
    onSuccess: (_, id) => {
      unarchiveCategoryStore(id);
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

// ─── DELETE (HARD DELETE) ──────────────────────────────────────
async function deleteCategory(id: ID): Promise<void> {
  const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Silinmə alınmadı');
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const deleteCategoryStore = useApp((state) => state.deleteCategory);

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: (_, id) => {
      deleteCategoryStore(id);
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

// ─── BULK OPERATIONS ──────────────────────────────────────────
async function bulkArchiveCategories(ids: ID[]): Promise<void> {
  const res = await fetch('/api/admin/categories/bulk/archive', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Toplu arxivləşdirmə alınmadı');
}

export function useBulkArchiveCategories() {
  const queryClient = useQueryClient();
  const archiveCategoryStore = useApp((state) => state.archiveCategory);

  return useMutation({
    mutationFn: bulkArchiveCategories,
    onSuccess: (_, ids) => {
      ids.forEach((id) => archiveCategoryStore(id));
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

async function bulkDeleteCategories(ids: ID[]): Promise<void> {
  const res = await fetch('/api/admin/categories/bulk/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
  if (!res.ok) throw new Error('Toplu silinmə alınmadı');
}

export function useBulkDeleteCategories() {
  const queryClient = useQueryClient();
  const deleteCategoryStore = useApp((state) => state.deleteCategory);

  return useMutation({
    mutationFn: bulkDeleteCategories,
    onSuccess: (_, ids) => {
      ids.forEach((id) => deleteCategoryStore(id));
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });
}

// ─── CACHE HELPERS (Dİqqət: bunlar hook deyil, komponent daxilində çağırılmalıdır) ──
export function useInvalidateCategoriesCache() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
}

export function useCategoriesCache() {
  const queryClient = useQueryClient();
  return () => queryClient.getQueryData<Category[]>(CATEGORIES_QUERY_KEY);
}