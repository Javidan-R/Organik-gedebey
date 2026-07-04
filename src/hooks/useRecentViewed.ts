import { RECENT_PRODUCTS_STORAGE_KEY, MAX_DISPLAYED_ITEMS } from "@/const"
import { Product } from "@/types/products"
import { useMemo, useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"

export function useRecentViewed(products: Product[]): [Product[], (id: string) => void] {
  const [recentIds, setRecentIds] = useLocalStorage<string[]>(RECENT_PRODUCTS_STORAGE_KEY, [])

  const recentProducts = useMemo(() =>
    recentIds
      .map(id => products.find(p => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, MAX_DISPLAYED_ITEMS),
    [products, recentIds]
  )

  const addToRecent = useCallback((id: string) => {
    setRecentIds(prev => [id, ...prev.filter(pid => pid !== id)].slice(0, 20))
  }, [setRecentIds])

  return [recentProducts, addToRecent]
} 

// // src/hooks/useRecentlyViewed.ts
// 'use client';

// import { useState, useCallback } from 'react';

// export function useRecentlyViewed() {
//   // ✅ useState initializer funksiyasında localStorage-dan oxu
//   const [recent, setRecent] = useState<string[]>(() => {
//     try {
//       const stored = localStorage.getItem('recently_viewed');
//       return stored ? JSON.parse(stored) : [];
//     } catch {
//       return [];
//     }
//   });

//   const add = useCallback((id: string) => {
//     setRecent((prev) => {
//       const filtered = prev.filter((p) => p !== id);
//       const updated = [id, ...filtered].slice(0, 10);
//       try {
//         localStorage.setItem('recently_viewed', JSON.stringify(updated));
//       } catch {}
//       return updated;
//     });
//   }, []);

//   return { recent, add };
// }