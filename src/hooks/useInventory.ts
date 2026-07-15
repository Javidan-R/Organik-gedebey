// src/hooks/useInventory.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/fetch-admin';

export type InventoryItem = {
  productId: string;
  productName: string;
  slug: string;
  categoryName: string | null;
  totalStock: number;
  minStock: number;
  status: 'ok' | 'low' | 'critical';
  lowBy: number;
  ageDays: number;
  tags: string[];
  isOrganic: boolean;
  isSeasonal: boolean;
  variants: Array<{
    id: string;
    name: string;
    stock: number;
    minStock: number;
  }>;
};

export function useInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ['admin-inventory'],
    queryFn: () => adminFetch('/api/admin/inventory'),
    staleTime: 30_000, // 30 saniyə
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { productId: string; variantId?: string; delta: number }) =>
      adminFetch('/api/admin/inventory/adjust', {
        method: 'POST',
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
    },
  });
}