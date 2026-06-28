// src/components/fresh-today/hooks.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { FreshProductsResponse, UpcomingProductsResponse, Product } from './FreshTodayTypes';

export function useFreshProducts(days: number = 7, limit: number = 20) {
  const [data, setData] = useState<FreshProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const fetchFreshProducts = useCallback(async (currentOffset: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(
        `/api/products/fresh?days=${days}&limit=${limit}&offset=${currentOffset}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch fresh products');
      }

      const result: FreshProductsResponse = await response.json();
      
      setData(prev => {
        if (currentOffset === 0) return result;
        return {
          ...result,
          products: [...(prev?.products || []), ...result.products]
        };
      });
      
      setOffset(currentOffset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [days, limit]);

  const loadMore = useCallback(() => {
    if (!data?.pagination.hasMore || loading) return;
    fetchFreshProducts(offset + limit);
  }, [data?.pagination.hasMore, loading, offset, limit, fetchFreshProducts]);

  const refresh = useCallback(() => {
    setOffset(0);
    fetchFreshProducts(0);
  }, [fetchFreshProducts]);

  useEffect(() => {
    fetchFreshProducts(0);
  }, [fetchFreshProducts]);

  return { data, loading, error, loadMore, refresh, hasMore: data?.pagination.hasMore ?? false };
}

export function useUpcomingProducts(limit: number = 20) {
  const [data, setData] = useState<UpcomingProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/products/upcoming?limit=${limit}`, { cache: 'no-store' });

        if (!response.ok) {
          throw new Error('Failed to fetch upcoming products');
        }

        const result: UpcomingProductsResponse = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchUpcoming();
  }, [limit]);

  return { data, loading, error };
}

export function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initial;
    } catch {
      return initial;
    }
  });

  const setStoredValue = useCallback((newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`[useLocalStorage] Error setting ${key}:`, error);
    }
  }, [key, value]);

  return [value, setStoredValue] as const;
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; icon?: React.ReactNode } | null>(null);

  const showToast = useCallback((message: string, icon?: React.ReactNode, duration: number = 2200) => {
    setToast({ message, icon });
    setTimeout(() => setToast(null), duration);
  }, []);

  return { toast, showToast };
}

export function useFilteredProducts(products: Product[], categories: any[], activeFilter: string) {
  return useMemo(() => {
    if (activeFilter === 'all') return products;
    
    const category = categories.find(c => c.id === activeFilter || c.slug === activeFilter);
    if (!category) return products;
    
    return products.filter(p => p.categoryId === category.id);
  }, [products, categories, activeFilter]);
}

export function useStoryViewer(products: Product[]) {
  const [state, setState] = useState({
    open: false,
    startIndex: 0,
    current: 0,
    progress: 0,
    paused: false
  });

  const openStory = useCallback((index: number) => {
    setState(prev => ({ ...prev, open: true, startIndex: index, current: index, progress: 0, paused: false }));
  }, []);

  const closeStory = useCallback(() => {
    setState(prev => ({ ...prev, open: false, progress: 0 }));
  }, []);

  const nextStory = useCallback(() => {
    setState(prev => {
      if (prev.current < products.length - 1) {
        return { ...prev, current: prev.current + 1, progress: 0 };
      }
      return { ...prev, open: false };
    });
  }, [products.length]);

  const prevStory = useCallback(() => {
    setState(prev => {
      if (prev.current > 0) {
        return { ...prev, current: prev.current - 1, progress: 0 };
      }
      return prev;
    });
  }, []);

  const togglePause = useCallback(() => {
    setState(prev => ({ ...prev, paused: !prev.paused }));
  }, []);

  return { ...state, openStory, closeStory, nextStory, prevStory, togglePause };
}