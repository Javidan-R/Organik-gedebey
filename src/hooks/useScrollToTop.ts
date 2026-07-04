import { useState, useEffect, useCallback } from "react"

// NEW: Scroll to top hook
export function useScrollToTop(): [boolean, () => void] {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [])
  return [visible, scrollToTop]
} 