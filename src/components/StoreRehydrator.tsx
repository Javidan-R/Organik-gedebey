// components/StoreRehydrator.tsx
// useApp.persist.rehydrate() üçün ayrı client component.
// Root layout 'use client' ola bilmədiyi üçün buraya köçürüldü.
'use client'

import { useEffect } from 'react'
import { useApp } from '@/lib/store'

export function StoreRehydrator() {
  useEffect(() => {
    useApp.persist.rehydrate()
  }, [])

  return null // UI yoxdur, yalnız yan effekt
}