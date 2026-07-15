// src/hooks/useBaskets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Basket } from '@/types/basket';

const BASKETS_QUERY_KEY = ['baskets'];

// ═══════════════════════════════════════════════════════════
// 1. Public fetch – storefront üçün
// ═══════════════════════════════════════════════════════════

/**
 * Bütün aktiv səbətləri gətir.
 * İstifadə: PremiumBasketsPage, HomePageClient
 */
async function fetchPublicBaskets(params?: {
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<Basket[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set('type', params.type);
  if (params?.limit) searchParams.set('limit', String(params.limit));
  if (params?.offset) searchParams.set('offset', String(params.offset));

  const queryString = searchParams.toString();
  const url = `/api/baskets${queryString ? `?${queryString}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Səbətlər yüklənərkən xəta');
  }
  const data = await res.json();
  return data.baskets || data;
}

export function useBaskets(params?: {
  type?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [...BASKETS_QUERY_KEY, 'public', params],
    queryFn: () => fetchPublicBaskets(params),
    staleTime: 5 * 60 * 1000, // 5 dəqiqə
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

/**
 * Slug ilə tək səbəti gətir.
 * İstifadə: BasketDetailClient (dinamik səhifələr)
 */
async function fetchBasketBySlug(
  slug: string
): Promise<{ basket: Basket }> {
  const res = await fetch(`/api/baskets/by-slug/${slug}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Səbət tapılmadı');
  }
  return res.json();
}

export function useBasketBySlug(slug: string) {
  return useQuery({
    queryKey: [...BASKETS_QUERY_KEY, 'public', 'by-slug', slug],
    queryFn: () => fetchBasketBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 dəqiqə
    retry: 1,
  });
}

/**
 * ID ilə tək səbəti gətir.
 * İstifadə: detail səhifələri (əgər ID ilə gəlinirsə)
 */
async function fetchBasketById(
  id: string
): Promise<{ basket: Basket }> {
  const res = await fetch(`/api/baskets/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Səbət tapılmadı');
  }
  return res.json();
}

export function useBasketById(id: string) {
  return useQuery({
    queryKey: [...BASKETS_QUERY_KEY, 'public', 'by-id', id],
    queryFn: () => fetchBasketById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

// ═══════════════════════════════════════════════════════════
// 2. Admin fetch – credentials + filter
// ═══════════════════════════════════════════════════════════

async function fetchAdminBaskets(filters: {
  searchTerm: string;
  type: string;
  showArchived: boolean;
}): Promise<{ baskets: Basket[]; pagination: any }> {
  const params = new URLSearchParams({
    search: filters.searchTerm,
    type: filters.type,
    showArchived: String(filters.showArchived),
  });
  const res = await fetch(`/api/admin/baskets?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error ||
        err.details?.map((d: any) => d.message).join(', ') ||
        'Səbətlər yüklənərkən xəta'
    );
  }
  return res.json();
}

export function useAdminBaskets(filters: {
  searchTerm: string;
  type: string;
  showArchived: boolean;
}) {
  return useQuery({
    queryKey: [...BASKETS_QUERY_KEY, 'admin', filters],
    queryFn: () => fetchAdminBaskets(filters),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });
}

// ═══════════════════════════════════════════════════════════
// 3. Admin mutations – yaradılma, yenilənmə, silinmə
// ═══════════════════════════════════════════════════════════

async function createBasket(data: Partial<Basket>): Promise<Basket> {
  const res = await fetch('/api/admin/baskets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error ||
        err.details?.map((d: any) => d.message).join(', ') ||
        'Səbət yaradılmadı'
    );
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

async function updateBasket({
  id,
  data,
}: {
  id: string;
  data: Partial<Basket>;
}): Promise<Basket> {
  const res = await fetch(`/api/admin/baskets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error ||
        err.details?.map((d: any) => d.message).join(', ') ||
        'Səbət yenilənmədi'
    );
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
  const res = await fetch(`/api/admin/baskets/${id}/archive`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Arxivləşdirmə alınmadı');
  }
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
  const res = await fetch(`/api/admin/baskets/${id}/unarchive`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Arxivdən çıxarma alınmadı');
  }
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
  const res = await fetch(`/api/admin/baskets/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Silinmə alınmadı');
  }
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