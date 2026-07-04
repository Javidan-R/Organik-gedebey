// src/hooks/useBaskets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Basket } from '@/types/basket';

const BASKETS_QUERY_KEY = ['baskets'];

// ─── Public fetch – istifadəçi tərəfində ────────────────────────────────
async function fetchBaskets(): Promise<Basket[]> {
  const res = await fetch('/api/baskets');
  if (!res.ok) throw new Error('Səbətlər yüklənərkən xəta');
  const data = await res.json();
  return data.baskets || data;
}

export function useBaskets() {
  return useQuery({
    queryKey: BASKETS_QUERY_KEY,
    queryFn: fetchBaskets,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useBasketBySlug(slug: string) {
  return useQuery({
    queryKey: [...BASKETS_QUERY_KEY, slug],
    queryFn: async () => {
      const res = await fetch(`/api/baskets/${slug}`);
      if (!res.ok) throw new Error('Səbət tapılmadı');
      return res.json();
    },
    enabled: !!slug,
  });
}

// ─── Admin mutations ──────────────────────────────────────────────────────
async function createBasket(data: Partial<Basket>): Promise<Basket> {
  const res = await fetch('/api/admin/baskets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Səbət yaradılmadı');
  }
  return res.json();
}

export function useCreateBasket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBasket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASKETS_QUERY_KEY });
    },
  });
}

async function updateBasket({ id, data }: { id: string; data: Partial<Basket> }): Promise<Basket> {
  const res = await fetch(`/api/admin/baskets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Səbət yenilənmədi');
  }
  return res.json();
}

export function useUpdateBasket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBasket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASKETS_QUERY_KEY });
    },
  });
}

async function archiveBasket(id: string): Promise<void> {
  const res = await fetch(`/api/admin/baskets/${id}/archive`, { method: 'POST' });
  if (!res.ok) throw new Error('Arxivləşdirmə alınmadı');
}

export function useArchiveBasket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveBasket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASKETS_QUERY_KEY });
    },
  });
}

async function unarchiveBasket(id: string): Promise<void> {
  const res = await fetch(`/api/admin/baskets/${id}/unarchive`, { method: 'POST' });
  if (!res.ok) throw new Error('Arxivdən çıxarma alınmadı');
}

export function useUnarchiveBasket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unarchiveBasket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASKETS_QUERY_KEY });
    },
  });
}

async function deleteBasket(id: string): Promise<void> {
  const res = await fetch(`/api/admin/baskets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Silinmə alınmadı');
}

export function useDeleteBasket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBasket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BASKETS_QUERY_KEY });
    },
  });
}