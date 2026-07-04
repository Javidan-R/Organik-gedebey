// src/hooks/useOrders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/fetch-admin';

export function useOrders(filters?: {
  page?: number; limit?: number; status?: string; search?: string;
  dateFrom?: string; dateTo?: string;
}) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.limit) params.set('limit', filters.limit.toString());
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);
      return adminFetch(`/api/orders?${params}`);
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminFetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: { status },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}