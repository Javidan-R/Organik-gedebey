// src/lib/analytics-selectors.ts
import { format, parseISO, startOfDay, isValid } from 'date-fns'
import { productDisplayPrice } from '@/lib/calc'
import type { Product } from '@/lib/types' // ...changed code...

/** Minimum lazım olan tiplər (sənin real tiplərin daha geniş ola bilər) */
type OrderItem = { productId: string; qty: number; priceAtOrder: number }
type Order = { createdAt?: string; items: OrderItem[] }
// ...existing code...
// removed local Product type; using imported Product instead
// ...existing code...

/** Tarixi təhlükəsiz şəkildə gün açarına çevirir (yyyy-MM-dd) */
const safeDayKey = (isoMaybe?: string) => {
  // isoMaybe yoxdursa və ya parseISO uğursuzdursa, bugünkü günü götür
  const parsed = isoMaybe ? parseISO(isoMaybe) : new Date()
  const day = isValid(parsed) ? startOfDay(parsed) : startOfDay(new Date())
  return format(day, 'yyyy-MM-dd')
}

/** Günlər üzrə satış və sifariş sayı seriyası */
export const buildTimeSeries = (orders: Order[]): { date: string; revenue: number; count: number }[] => {
  const m = new Map<string, { date: string; revenue: number; count: number }>()
  for (const o of orders) {
    const d = safeDayKey(o.createdAt)
    const rev = o.items.reduce(
      (s, it) => s + Number(it.priceAtOrder || 0) * Number(it.qty || 0),
      0
    )
    if (!m.has(d)) m.set(d, { date: d, revenue: 0, count: 0 })
    const row = m.get(d)!
    row.revenue += rev
    row.count += 1
  }
  return Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date))
}

/** Gəlirə görə Top N məhsul */
export const buildTopProducts = (
  orders: Order[],
  products: Product[],
  top = 10
): { name: string; value: number }[] => {
  const map = new Map<string, number>()
  for (const o of orders)
    for (const it of o.items) {
      const key = it.productId
      map.set(key, (map.get(key) || 0) + it.priceAtOrder * it.qty)
    }

  return Array.from(map.entries())
    .map(([pid, v]) => ({
      name: products.find((p) => p.id === pid)?.name || '—',
      value: +v.toFixed(2),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, top)
}

/** Vitrində göstərilən qiymət interval paylanması */
export const buildPriceBands = (
  products: Product[]
): { name: string; value: number }[] => {
  const bands = [0, 5, 10, 15, 25, 50, 100]
  const bucket = (v: number) => {
    for (let i = 0; i < bands.length - 1; i++)
      if (v >= bands[i] && v < bands[i + 1]) return `${bands[i]}-${bands[i + 1]}`
    return `>${bands[bands.length - 1]}`
  }

  const m = new Map<string, number>()
  for (const p of products) {
    const price = Number(productDisplayPrice(p) || 0)
    const key = bucket(price)
    m.set(key, (m.get(key) || 0) + 1)
  }

  return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => {
    const getMin = (s: string) => {
      if (s.startsWith('>')) return Number(s.slice(1))
      return Number(s.split('-')[0])
    }
    return getMin(a.name) - getMin(b.name)
  })
}

// ...other analytics selectors...