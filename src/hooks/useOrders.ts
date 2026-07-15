// src/hooks/use-orders.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFetch } from '@/lib/fetch-admin';
import { useEffect, useRef } from 'react';

const ORDERS_QUERY_KEY = ['orders'];

export function useOrders(filters?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  const query = useQuery({
    queryKey: [ORDERS_QUERY_KEY, filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.page) params.set('page', filters.page.toString());
      if (filters?.limit) params.set('limit', filters.limit.toString());
      if (filters?.status) params.set('status', filters.status);
      if (filters?.search) params.set('search', filters.search);
      if (filters?.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.set('dateTo', filters.dateTo);
      const queryString = params.toString();
      const url = `/api/orders${queryString ? `?${queryString}` : ''}`;
      return adminFetch<{
        orders: any[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(url);
    },
    staleTime: 1000 * 10,
    refetchOnWindowFocus: true,
    refetchInterval: 1000 * 30,
  });

  // Real‑time SSE (əvvəlki kod olduğu kimi saxlanıla bilər, lakin hazırda ehtiyac yoxdursa silə bilərsiniz)
  useEffect(() => {
    // SSE bağlantısı (əgər istifadə ediləcəksə buraya əlavə oluna bilər)
    return () => {
      eventSourceRef.current?.close();
    };
  }, [queryClient]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
  };

  return { ...query, refresh };
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, cancellationReason }: { id: string; status: string; cancellationReason?: string }) =>
      adminFetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        body: { status, cancellationReason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to update order status:', error);
    },
  });
}