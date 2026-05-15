import { useState, useEffect, useCallback } from "react"

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // SSR zamanı xəta almamaları üçün state-i funksiya ilə başladırıq (Lazy Initialization)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue
    try {
      const item = window.localStorage.getItem(key)
      if (!item) return initialValue
      // Handle case where localStorage contains "undefined" string
      if (item === "undefined") return initialValue
      return JSON.parse(item)
    } catch (error) {
      console.error("LocalStorage read error:", error)
      return initialValue
    }
  })


  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(next))
          // Digər tab-larda olan state-ləri yeniləmək üçün custom event tetikləyirik
          window.dispatchEvent(new Event("local-storage"))
        }
        return next
      })
    } catch (error) {
      console.error("LocalStorage write error:", error)
    }
  }, [key])

  // Cross-tab synchronization: Eyni sayt açıq olan digər tablarda dəyişiklik olarsa state-i yeniləyir
  useEffect(() => {
    const handleStorageChange = () => {
      const item = window.localStorage.getItem(key)
      if (!item) return
      // Handle case where localStorage contains "undefined" string
      if (item === "undefined") return
      try {
        setStoredValue(JSON.parse(item))
      } catch (error) {
        console.error("LocalStorage sync error:", error)
      }
    }

    window.addEventListener("storage", handleStorageChange) // Digər pəncərələr üçün
    window.addEventListener("local-storage", handleStorageChange) // Eyni pəncərə daxili üçün

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("local-storage", handleStorageChange)
    }
  }, [key])

  return [storedValue, setValue]
}