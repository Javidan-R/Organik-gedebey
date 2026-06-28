// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ─────────────────────────────────────────────
// GET: bütün məhsullar
// ─────────────────────────────────────────────
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Məhsullar yüklənmədi')
      return res.json()
      // { products: Product[], pagination: {...} }
    },
  })
}

// ─────────────────────────────────────────────
// GET: bütün kateqoriyalar
// ─────────────────────────────────────────────
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Kateqoriyalar yüklənmədi')
      return res.json()
      // { categories: Category[] }
    },
  })
}

// ─────────────────────────────────────────────
// MUTATION: arxivə göndər  (əvvəl: s.archiveProduct)
// ─────────────────────────────────────────────
export function useArchiveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}/archive`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Arxivlənmədi')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

// ─────────────────────────────────────────────
// MUTATION: arxivdən çıxar  (əvvəl: s.unarchiveProduct)
// ─────────────────────────────────────────────
export function useUnarchiveProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}/unarchive`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Arxivdən çıxarılmadı')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

// ─────────────────────────────────────────────
// MUTATION: məhsul yarat
// ─────────────────────────────────────────────
export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (product: any) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Məhsul yaradılmadı')
      }
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

// ─────────────────────────────────────────────
// MUTATION: məhsul yenilə
// ─────────────────────────────────────────────
export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Yenilənmədi')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}