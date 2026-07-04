import { COMPARE_STORAGE_KEY, MAX_COMPARE_ITEMS } from "@/const"
import { useCallback } from "react"
import { useLocalStorage } from "./useLocalStorage"
 
// NEW: Compare hook
export function useCompare(): [string[], (id: string) => void, (id: string) => void, (id: string) => boolean, () => void] {
  const [compareList, setCompareList] = useLocalStorage<string[]>(COMPARE_STORAGE_KEY, [])
  const addToCompare = useCallback((id: string) => {
    setCompareList(prev => prev.length < MAX_COMPARE_ITEMS ? [...new Set([...prev, id])] : prev)
  }, [setCompareList])
  const removeFromCompare = useCallback((id: string) => setCompareList(prev => prev.filter(cid => cid !== id)), [setCompareList])
  const isInCompare = useCallback((id: string) => compareList.includes(id), [compareList])
  const clearCompare = useCallback(() => setCompareList([]), [setCompareList])
  return [compareList, addToCompare, removeFromCompare, isInCompare, clearCompare]
}
