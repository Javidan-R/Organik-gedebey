import { useState, useRef, useCallback, useEffect } from "react"

export function useCountdownTimer(): [number | null, (sec: number | null) => string] {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const calcSecondsLeft = useCallback((): number => {
    const now = new Date()
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
  }, [])
 
  const formatTimer = useCallback((sec: number | null): string => {
    if (sec === null || sec < 0) return '—'
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return [h, m, s].map(u => String(u).padStart(2, '0')).join(':')
  }, [])

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTimeout(() => setSecondsLeft(calcSecondsLeft()), 0)
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => (prev === null || prev <= 0) ? 0 : prev - 1)
    }, 1000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [calcSecondsLeft])

  return [secondsLeft, formatTimer]
}
