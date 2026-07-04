// src/hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApp } from '@/lib/store';
import type { Product } from '@/types/products';
import { ID } from '@/lib/types';
import { useEffect } from 'react';

const PRODUCTS_QUERY_KEY = ['products'];

// ─── Helpers ────────────────────────────────────────────────────
export function sanitizeNulls<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (val === null || val === undefined) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
      result[key] = sanitizeNulls(val);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

// ─── FETCH ALL (Admin endpoint-i) ───────────────────────────────
async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('/api/admin/products', { cache: 'no-store' });
  if (!res.ok) throw new Error('Məhsullar yüklənərkən xəta');
  const data = await res.json();
  return data.products || data;
}

export function useProducts() {
  const setProducts = useApp((state) => state.setProducts);
  const query = useQuery({
    queryKey: PRODUCTS_QUERY_KEY,
    queryFn: fetchProducts,
  });

  useEffect(() => {
    if (query.data) setProducts(query.data);
  }, [query.data, setProducts]);

  return query;
}

// ─── FETCH SINGLE ──────────────────────────────────────────────
async function fetchProduct(id: ID): Promise<Product> {
  const res = await fetch(`/api/admin/products/${id}`);
  if (!res.ok) throw new Error('Məhsul tapılmadı');
  return res.json();
}

export function useProduct(id: ID) {
  return useQuery({
    queryKey: [...PRODUCTS_QUERY_KEY, id],
    queryFn: () => fetchProduct(id),
    enabled: !!id,
  });
}

// ─── CREATE ────────────────────────────────────────────────────
async function createProduct(product: Product): Promise<Product> {
  const cleanPayload = sanitizeNulls(product);
  const res = await fetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanPayload),
  });

  const responseBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    let errorMsg = responseBody.error || 'Məhsul yaradılmadı';
    if (responseBody.details) {
      const details = responseBody.details
        .map((d: any) => `${d.path}: ${d.message}`)
        .join('; ');
      errorMsg += ` (${details})`;
    }
    throw new Error(errorMsg);
  }
  return responseBody.product;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const addProduct = useApp((state) => state.addProduct);
  return useMutation({
    mutationFn: createProduct,
    onSuccess: (newProduct) => {
      addProduct(newProduct);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

// ─── UPDATE ────────────────────────────────────────────────────
async function updateProduct({
  id,
  data,
}: {
  id: ID;
  data: Partial<Product>;
}): Promise<Product> {
  const cleanPayload = sanitizeNulls(data);
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanPayload),
  });

  const responseBody = await res.json().catch(() => ({}));
  if (!res.ok) {
    let errorMsg = responseBody.error || 'Məhsul yenilənmədi';
    if (responseBody.details) {
      const details = responseBody.details
        .map((d: any) => `${d.path}: ${d.message}`)
        .join('; ');
      errorMsg += ` (${details})`;
    }
    throw new Error(errorMsg);
  }
  return responseBody.product;
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const updateProductStore = useApp((state) => state.updateProduct);
  return useMutation({
    mutationFn: updateProduct,
    onSuccess: (updated) => {
      updateProductStore(updated);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({
        queryKey: [...PRODUCTS_QUERY_KEY, updated.id],
      });
    },
  });
}

// ─── ARCHIVE / UNARCHIVE ──────────────────────────────────────
async function archiveProduct(id: ID): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}/archive`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Arxivləşdirmə alınmadı');
}
export function useArchiveProduct() {
  const queryClient = useQueryClient();
  const archive = useApp((state) => state.archiveProduct);
  return useMutation({
    mutationFn: archiveProduct,
    onSuccess: (_, id) => {
      archive(id);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

async function unarchiveProduct(id: ID): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}/unarchive`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Arxivdən çıxarma alınmadı');
}
export function useUnarchiveProduct() {
  const queryClient = useQueryClient();
  const unarchive = useApp((state) => state.unarchiveProduct);
  return useMutation({
    mutationFn: unarchiveProduct,
    onSuccess: (_, id) => {
      unarchive(id);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}

// ─── DELETE ────────────────────────────────────────────────────
async function deleteProduct(id: ID): Promise<void> {
  const res = await fetch(`/api/admin/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Silinmə alınmadı');
}
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const deleteLocal = useApp((state) => state.deleteProduct);
  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_, id) => {
      deleteLocal(id);
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
  });
}