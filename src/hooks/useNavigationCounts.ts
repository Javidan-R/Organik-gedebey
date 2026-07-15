// src/hooks/useNavigationCounts.ts
import { useState, useEffect, useCallback } from 'react';

export interface NavigationCounts {
  pendingOrders: number;
  lowStockProducts: number;
  unreadMessages: number;
  activeUsers: number;
}

export function useNavigationCounts(): NavigationCounts {
  const [counts, setCounts] = useState<NavigationCounts>({
    pendingOrders: 0,
    lowStockProducts: 0,
    unreadMessages: 0,
    activeUsers: 0,
  });

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/navigation-counts', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch {
      // counts remain 0 on failure
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const id = setInterval(fetchCounts, 30_000);
    return () => clearInterval(id);
  }, [fetchCounts]);

  return counts;
}