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