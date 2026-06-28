import { WISHLIST_STORAGE_KEY } from "@/const"
import { useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"

export function useWishlist(): [string[], (id: string) => void, (id: string) => void, (id: string) => boolean] {
  const [wishlist, setWishlist] = useLocalStorage<string[]>(WISHLIST_STORAGE_KEY, [])
  const addToWishlist = useCallback((id: string) => setWishlist(prev => [...new Set([...prev, id])]), [setWishlist])
  const removeFromWishlist = useCallback((id: string) => setWishlist(prev => prev.filter(pid => pid !== id)), [setWishlist])
  const isInWishlist = useCallback((id: string) => wishlist.includes(id), [wishlist])
  return [wishlist, addToWishlist, removeFromWishlist, isInWishlist]
}