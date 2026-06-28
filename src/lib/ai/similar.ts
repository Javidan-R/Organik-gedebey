// lib/ai/similar.ts
import type { Product } from '../types'

export function similarProducts(products: Product[], current: Product, limit=6) {
  const bag = new Set<string>([
    ...(current.tags || []).map(x=>x.toLowerCase()),
    ...(current.name||'').toLowerCase().split(/\W+/),
    ...(current.description||'').toLowerCase().split(/\W+/)
  ].filter(Boolean))

  const score = (p: Product) => {
    if (p.id === current.id || p.archived) return -1
    let s = 0
    if (p.categoryId === current.categoryId) s += 3
    const tags = new Set((p.tags||[]).map(x=>x.toLowerCase()))
    s += [...tags].filter(t => bag.has(t)).length * 2
    const words = (p.name + ' ' + (p.description||'')).toLowerCase().split(/\W+/)
    s += words.filter(w => bag.has(w)).length * 0.2
    return s
  }

  return products.slice().sort((a,b)=>score(b)-score(a)).filter(x=>score(x)>=0).slice(0,limit)
}
