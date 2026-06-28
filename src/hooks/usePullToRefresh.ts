import { useState, useRef, useEffect } from "react"


export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const startY = useRef(0)

  useEffect(() => {
    const onStart = (e: TouchEvent) => { if (window.scrollY === 0) startY.current = e.touches[0].clientY }
    const onMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY.current > 0 && e.touches[0].clientY - startY.current > 80 && !isRefreshing) {
        setIsRefreshing(true)
        onRefresh().finally(() => { setIsRefreshing(false); startY.current = 0 })
      }
    }
    const onEnd = () => { startY.current = 0 }
    document.addEventListener('touchstart', onStart)
    document.addEventListener('touchmove', onMove)
    document.addEventListener('touchend', onEnd)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [isRefreshing, onRefresh])

  return isRefreshing
}