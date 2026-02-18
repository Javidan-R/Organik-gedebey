// lib/db/temp-store.ts
// ⚡ Database qurulana qədər işləyən müvəqqəti server-side store
// Next.js prosesi eyni qaldıqda data saxlanılır
// Server restart olduqda sıfırlanır - bu normaldir (dev üçün)

import type { Product } from '@/types/products'
import type { Order } from '@/types/orders'

// ─── PRODUCTS ────────────────────────────────────────────
let _products: Product[] = []

export const tempProducts = {
  getAll: () => _products,
  getById: (id: string) => _products.find(p => p.id === id),
  add: (p: Product) => {
    _products = [p, ..._products]
    return p
  },
  update: (p: Product) => {
    _products = _products.map(x => x.id === p.id ? p : x)
    return p
  },
  archive: (id: string) => {
    _products = _products.map(x => x.id === id ? { ...x, archived: true } : x)
  },
  unarchive: (id: string) => {
    _products = _products.map(x => x.id === id ? { ...x, archived: false } : x)
  },
  delete: (id: string) => {
    _products = _products.filter(x => x.id !== id)
  },
}

// ─── CATEGORIES ──────────────────────────────────────────
type Category = { id: string; name: string; slug: string; archived?: boolean; description?: string; image?: string }
let _categories: Category[] = []

export const tempCategories = {
  getAll: () => _categories,
  add: (c: Category) => {
    _categories = [c, ..._categories]
    return c
  },
  update: (c: Category) => {
    _categories = _categories.map(x => x.id === c.id ? c : x)
    return c
  },
  delete: (id: string) => {
    _categories = _categories.filter(x => x.id !== id)
  },
}

// ─── ORDERS ──────────────────────────────────────────────
let _orders: Order[] = []

export const tempOrders = {
  getAll: () => _orders,
  getById: (id: string) => _orders.find(o => o.id === id),
  add: (o: Order) => {
    _orders = [o, ..._orders]
    return o
  },
  update: (o: Partial<Order> & { id: string }) => {
    _orders = _orders.map(x => x.id === o.id ? { ...x, ...o } : x)
  },
  updateStatus: (id: string, status: Order['status']) => {
    _orders = _orders.map(x => x.id === id ? { ...x, status } : x)
  },
}

// ─── EXPENSES ────────────────────────────────────────────
type Expense = { id: string; amount: number; date: string; category: string; description?: string }
let _expenses: Expense[] = []

export const tempExpenses = {
  getAll: () => _expenses,
  add: (e: Expense) => {
    _expenses = [e, ..._expenses]
    return e
  },
  delete: (id: string) => {
    _expenses = _expenses.filter(x => x.id !== id)
  },
}