import dayjs from 'dayjs'
import { Order, Product } from '@/lib/types'
import { variantFinalPrice, productTotalStock } from '@/lib/calc'

type Grouping = 'day' | 'week' | 'month'
const fmt = (d: string, g: Grouping) =>
  g === 'day' ? dayjs(d).format('YYYY-MM-DD') :
  g === 'week' ? dayjs(d).startOf('week').format('YYYY-[W]WW') :
  dayjs(d).format('YYYY-MM')

/** 1) Gəlir seriyası (time-series) */
export const revenueSeries = (orders: Order[], products: Product[], g: Grouping = 'day') => {
  const map = new Map<string, number>()
  for (const o of orders) {
    const key = fmt(o.createdAt, g)
    const sum = o.items.reduce((s, it) => s + (it.priceAtOrder * it.qty), 0)
    map.set(key, (map.get(key) || 0) + sum)
  }
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date, revenue]) => ({ date, revenue }))
}

/** 2) Sifariş sayı seriyası (time-series) */
export const ordersCountSeries = (orders: Order[], g: Grouping = 'day') => {
  const map = new Map<string, number>()
  for (const o of orders) {
    const key = fmt(o.createdAt, g)
    map.set(key, (map.get(key) || 0) + 1)
  }
  return [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }))
}

/** 3) Status breakdown */
export const orderStatusMix = (orders: Order[]) => {
  const buckets = { pending: 0, delivered: 0, cancelled: 0 }
  orders.forEach(o => (buckets as any)[o.status]++)
  return [
    { name: 'Gözləyir', value: buckets.pending },
    { name: 'Çatdırılıb', value: buckets.delivered },
    { name: 'Ləğv', value: buckets.cancelled },
  ]
}

/** 4) Kateqoriya satış payı (AZN cəmi) */
export const categoryRevenueMix = (orders: Order[], products: Product[], categories: {id:string; name:string}[]) => {
  const catMap = new Map<string, number>()
  for (const o of orders) {
    for (const it of o.items) {
      const p = products.find(x => x.id === it.productId)
      if (!p) continue
      const catId = p.categoryId
      catMap.set(catId, (catMap.get(catId) || 0) + it.priceAtOrder * it.qty)
    }
  }
  return categories.map(c => ({ name: c.name, value: +(catMap.get(c.id) || 0).toFixed(2) }))
    .sort((a,b)=>b.value-a.value)
}

/** 5) Top məhsullar (AZN) */
export const topProductsByRevenue = (orders: Order[], products: Product[], limit = 10) => {
  const map = new Map<string, number>()
  for (const o of orders) {
    for (const it of o.items) {
      map.set(it.productId, (map.get(it.productId) || 0) + it.priceAtOrder * it.qty)
    }
  }
  const rows = [...map.entries()].map(([pid, rev]) => {
    const name = products.find(p => p.id === pid)?.name || '—'
    return { name, revenue: +rev.toFixed(2) }
  })
  return rows.sort((a,b)=>b.revenue-a.revenue).slice(0, limit)
}

/** 6) Stok sağlamlığı (Aşağı stok / Normal) */
export const stockHealth = (products: Product[]) => {
  let low = 0, ok = 0
  for (const p of products) {
    const total = productTotalStock(p)
    const min = p.minStock ?? 0
    total <= min ? low++ : ok++
  }
  return [
    { name: 'Aşağı stok', value: low },
    { name: 'Normal', value: ok },
  ]
}



/** 8) Orijin payı (Gədəbəy / Gəncə / Digər) — sifariş cəminə görə */
export const originMix = (orders: Order[], products: Product[]) => {
  const buckets = new Map<string, number>()
  for (const o of orders) {
    for (const it of o.items) {
      const p = products.find(x => x.id === it.productId)
      if (!p) continue
      buckets.set(p.origin, (buckets.get(p.origin) || 0) + it.priceAtOrder * it.qty)
    }
  }
  return [...buckets.entries()].map(([name, value]) => ({ name, value: +value.toFixed(2) }))
}

/** 9) Orta sifariş dəyəri (AOV) time-series */
export const aovSeries = (orders: Order[], g: Grouping = 'day') => {
  const sumMap = new Map<string, number>()
  const cntMap = new Map<string, number>()
  for (const o of orders) {
    const k = fmt(o.createdAt, g)
    const total = o.items.reduce((s, it) => s + it.priceAtOrder * it.qty, 0)
    sumMap.set(k, (sumMap.get(k) || 0) + total)
    cntMap.set(k, (cntMap.get(k) || 0) + 1)
  }
  return [...sumMap.keys()].sort().map(k => ({
    date: k,
    aov: +((sumMap.get(k)! / cntMap.get(k)!).toFixed(2))
  }))
}

/** 10) Səbət konversiyası / kanal payı (whatsapp vs system) */
export const channelMix = (orders: Order[]) => {
  let sys = 0, wa = 0
  for (const o of orders) {
    if (o.channel === 'whatsapp') wa++
    else sys++
  }
  return [
    { name: 'System', value: sys },
    { name: 'WhatsApp', value: wa },
  ]
}

/** 11) “Bu gün / Dünən / Bu ay” xülasə */
export const quickSummary = (orders: Order[]) => {
  const today = dayjs().format('YYYY-MM-DD')
  const yesterday = dayjs().subtract(1,'day').format('YYYY-MM-DD')
  const thisMonth = dayjs().format('YYYY-MM')

  const sumBy = (pred: (o: Order)=>boolean) =>
    orders.filter(pred).reduce((s, o) => s + o.items.reduce((x,it)=>x+it.priceAtOrder*it.qty,0),0)

  return {
    today: +sumBy(o => dayjs(o.createdAt).format('YYYY-MM-DD') === today).toFixed(2),
    yesterday: +sumBy(o => dayjs(o.createdAt).format('YYYY-MM-DD') === yesterday).toFixed(2),
    month: +sumBy(o => dayjs(o.createdAt).format('YYYY-MM') === thisMonth).toFixed(2),
  }
}