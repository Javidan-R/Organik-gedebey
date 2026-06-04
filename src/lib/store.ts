// src/lib/store.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Variant,
  Review,
  Category,
  CartItem,
  ChatMessage,
  Notification,
  StorefrontConfig,
  ID,
  User,
  Coupon,
  Expense,
  AdminUIState,
} from './types';
import {
  finalPrice as calcFinalPrice,
  variantFinalPrice as calcVariantFinalPrice,
  kpis,
  isDiscountActive as calcIsDiscountActive,
  productTotalStock as calcProductTotalStock,
  minPrice,
  avgRating,
  productDisplayPrice,
  abcSplit,
  priceTrend,
  lowStockProducts,
} from './calc';
import {
  initialProducts,
  initialOrders,
  initialCategories,
} from '@/data/mock';
import { Product } from '@/types/products';
import { Order, OrderStatus } from '@/types/orders';

// ═══════════════════════════════════════════════════════════════════════════
// API BRIDGE — Server ilə sinxronizasiya (fire-and-forget)
// ═══════════════════════════════════════════════════════════════════════════
function apiBridge(method: string, url: string, body?: unknown) {
  if (typeof window === 'undefined') return;
  fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).catch(err => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[API Bridge] ${method} ${url} failed:`, err.message);
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// ID Generator
// ═══════════════════════════════════════════════════════════════════════════
export function cryptoId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function cryptoIdSafe(): string {
  return cryptoId();
}

// ═══════════════════════════════════════════════════════════════════════════
// Slug Helpers
// ═══════════════════════════════════════════════════════════════════════════
export function slugifyProductSlug(input: string): string {
  if (!input) return 'product';
  const charMap: Record<string, string> = {
    ə: 'e', Ə: 'e', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u',
    ğ: 'g', Ğ: 'g', ç: 'c', Ç: 'c', ş: 's', Ş: 's',
    ı: 'i', İ: 'i',
  };
  const normalized = input
    .trim()
    .split('')
    .map((ch) => charMap[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'product';
}

function ensureUniqueSlug(
  baseSlug: string,
  products: Product[],
  selfId?: ID,
): string {
  const base = baseSlug || 'product';
  let slug = base;
  let counter = 2;
  while (
    products.some(
      (p) => p.slug === slug && (selfId ? p.id !== selfId : true),
    )
  ) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

// ═══════════════════════════════════════════════════════════════════════════
// Store Event Type
// ═══════════════════════════════════════════════════════════════════════════
export type StoreEvent = {
  id: string;
  type: 'order' | 'stock' | 'product' | 'system' | 'cart';
  message: string;
  createdAt: string;
  meta?: Record<string, unknown>;
};

// ═══════════════════════════════════════════════════════════════════════════
// App State Type — FULL TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════
export type AppState = {
  storefrontConfig: StorefrontConfig & {
    locale: string;
    vatRate: number;
    contactEmail: string;
  };
  categories: Category[];
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  favorites: ID[];
  chat: ChatMessage[];
  notifications: Notification[];
  users: User[];
  coupons: Coupon[];
  expenses: Expense[];
  adminUIState: AdminUIState;
  events: StoreEvent[];
  _hasHydrated: boolean;
  markHydrated: () => void;

  // ═══ SERVER DATA SYNC ═══
  setProducts: (products: Product[]) => void;
  setCategories: (categories: Category[]) => void;
  setOrders: (orders: Order[]) => void;

  // ═══ REAL-TIME SYNC (YENİ) ═══
  startRealtimeSync: () => void;
  stopRealtimeSync: () => void;

  // ═══ GRANULAR SELECTORS (performans üçün) ═══
  getProductById: (id: ID) => Product | undefined;
  getProductIds: () => ID[];
  getProductName: (id: ID) => string;
  getProductPrice: (id: ID, variantId?: ID) => number;
  getProductStock: (id: ID, variantId?: ID) => number;
  getProductRating: (id: ID) => number;

  // ═══ SELECTORS ═══
  cartTotal: () => number;
  productPriceNow: (p: Product, v?: Variant) => number;
  productRatingAvg: (p: Product) => number;
  isDiscountActive: (p: Product) => boolean;
  productTotalStock: (p: Product) => number;
  productBySlug: (slug: string) => Product | undefined;
  productsByCategorySlug: (slug: string) => Product[];
  productsOnSale: () => Product[];
  productsFeatured: () => Product[];
  productsFilterSearch: (
    query: string,
    categoryId?: ID,
    sort?: 'price_asc' | 'price_desc' | 'rating' | 'newest',
  ) => Product[];
  couponIsValid: (code: string, total: number) => Coupon | undefined;
  cartItemCount: () => number;
  cartLineCount: () => number;
  notificationsUnreadCount: () => number;
  lowStockAlerts: (limit?: number) => Product[];
  recentOrders: (limit?: number) => Order[];
  topSellingProducts: (limit?: number) => Product[];
  dailySalesTotal: (isoDate: string) => number;
  dashboardSummary: () => {
    totalRevenue: number;
    ordersToday: number;
    avgOrderValue: number;
    lowStockCount: number;
    productsOnSaleCount: number;
  };

  // ═══ ACTIONS: Categories ═══
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  deleteCategory: (id: ID) => void;
  archiveCategory: (id: ID) => void;
  unarchiveCategory: (id: ID) => void;

  // ═══ ACTIONS: Products ═══
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: ID) => void;
  archiveProduct: (id: ID) => void;
  unarchiveProduct: (id: ID) => void;
  toggleProductArchived: (id: ID, archive: boolean) => void;
  updateProductTags: (id: ID, tags: string[]) => void;
  updateProductAttributes: (id: ID, attributes: Product['attributes']) => void;
  updateProductImageAltText: (id: ID, url: string, alt: string) => void;

  // ═══ ACTIONS: Reviews ═══
  submitReview: (r: Review) => void;
  approveReview: (pid: ID, rid: ID) => void;
  deleteReview: (pid: ID, rid: ID) => void;
  unapproveReview: (pid: ID, rid: ID) => void;

  // ═══ ACTIONS: Inventory & Finance ═══
  adjustStock: (productId: ID, delta: number, variantId?: ID) => void;
  adjustMinStock: (productId: ID, minStock: number) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: ID) => void;

  // ═══ UX ═══
  toggleFavorite: (pid: ID) => void;
  isFavorite: (pid: ID) => boolean;
  setLocale: (locale: string) => void;

  // ═══ Cart / Orders ═══
  addToCart: (pid: ID, vid?: ID, qty?: number) => void;
  removeFromCart: (pid: ID, vid?: ID) => void;
  updateCartItemQty: (pid: ID, vid: ID | undefined, qty: number) => void;
  removeCartItem: (pid: ID, vid: ID | undefined) => void;
  clearCart: () => void;
  placeOrder: (o: Order) => void;
  updateOrderStatus: (id: ID, status: OrderStatus) => void;
  cancelOrder: (id: ID, reason?: string) => void;
  assignDelivery: (orderId: ID, courierId: ID) => void;

  // ═══ Coupons ═══
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: ID) => void;

  // ═══ Admin config ═══
  updateStorefrontConfig: (
    config: Partial<
      StorefrontConfig & { vatRate: number; contactEmail: string; locale: string }
    >,
  ) => void;
  setAdminUIState: (state: Partial<AdminUIState>) => void;
  updateAdminUIState: (state: Partial<AdminUIState>) => void;

  // ═══ Notifications & Events ═══
  notify: (payload: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: ID) => void;
  markAllNotificationsRead: () => void;
  logEvent: (payload: Omit<StoreEvent, 'id' | 'createdAt'> & { createdAt?: string }) => void;

  // ═══ Chat ═══
  sendChat: (m: ChatMessage) => void;

  // ═══ Analytics ═══
  analytics: () => ReturnType<typeof kpis>;
  kpis: (orders: Order[], products: Product[]) => ReturnType<typeof kpis>;
  finalPrice: (p: Product, v?: Variant) => number;
  variantFinalPrice: (p: Product, v: Variant) => number;
};

// ═══════════════════════════════════════════════════════════════════════════
// WebSocket / SSE Dəyişənləri (store xaricində)
// ═══════════════════════════════════════════════════════════════════════════
let eventSource: EventSource | null = null;
let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Initial Config
// ═══════════════════════════════════════════════════════════════════════════
const initialStorefrontConfig: AppState['storefrontConfig'] = {
  primaryColor: '#16a34a',
  currency: 'AZN',
  locale: 'az-AZ',
  vatRate: 0.18,
  contactEmail: 'info@organikgedebey.az',
  contactPhone: '+994773676021',
};

const initialAdminUIState: AdminUIState = {
  sidebarOpen: true,
  theme: 'light',
  lastVisited: new Date().toISOString(),
};

// ═══════════════════════════════════════════════════════════════════════════
// STORE — MAIN STORE IMPLEMENTATION (Realtime Sync əlavə edildi)
// ═══════════════════════════════════════════════════════════════════════════
export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      // ═══ INITIAL STATE ═══
      storefrontConfig: initialStorefrontConfig,
      categories: initialCategories,
      products: initialProducts.map(p => ({ ...p, archived: p.archived ?? false })),
      orders: initialOrders,
      cart: [],
      favorites: [],
      chat: [],
      notifications: [],
      users: [],
      coupons: [],
      expenses: [],
      adminUIState: initialAdminUIState,
      events: [],
      _hasHydrated: false,
      markHydrated: () => set({ _hasHydrated: true }),

      // ═══ SERVER DATA SYNC (basePrice normallaşdırması ilə) ═══
      setProducts: (products) => {
        const normalized = products.map(p => ({
          ...p,
          basePrice: typeof p.basePrice === 'string' ? parseFloat(p.basePrice) : (p.basePrice ?? 0),
          archived: p.archived ?? false,
        }));
        set({ products: normalized });
      },
      setCategories: (categories) => set({ categories }),
      setOrders: (orders) => set({ orders }),

      // ═══ REAL-TIME SYNC (SSE / WebSocket) ═══
      startRealtimeSync: () => {
        if (typeof window === 'undefined') return;
        // Əvvəlki bağlantını təmizlə
        get().stopRealtimeSync();

        const useWebSocket = process.env.NEXT_PUBLIC_REALTIME_USE_WS === 'true';
        const sseUrl = process.env.NEXT_PUBLIC_SSE_URL || '/api/sse';
        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

        if (useWebSocket) {
          ws = new WebSocket(wsUrl);
          ws.onopen = () => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[WS] Realtime bağlantı quruldu');
            }
            ws?.send(JSON.stringify({ type: 'request-full-sync' }));
          };
          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              switch (data.type) {
                case 'full-sync':
                  if (data.products) get().setProducts(data.products);
                  if (data.categories) get().setCategories(data.categories);
                  if (data.orders) get().setOrders(data.orders);
                  break;
                case 'product-updated':
                  get().updateProduct(data.product);
                  break;
                case 'product-created':
                  get().addProduct(data.product);
                  break;
                case 'product-deleted':
                  get().deleteProduct(data.id);
                  break;
                case 'stock-changed':
                  get().adjustStock(data.productId, data.delta, data.variantId);
                  break;
                case 'order-status-changed':
                  get().updateOrderStatus(data.id, data.status);
                  break;
                case 'category-updated':
                  get().updateCategory(data.category);
                  break;
                default:
                  if (process.env.NODE_ENV === 'development') {
                    console.warn('[WS] Unknown message type:', data.type);
                  }
              }
            } catch (err) {
              console.error('[WS] Mesaj parse xətası:', err);
            }
          };
          ws.onerror = (err) => {
            console.error('[WS] Xəta:', err);
            ws?.close();
            ws = null;
            clearReconnectTimer();
            reconnectTimer = setTimeout(() => get().startRealtimeSync(), 5000);
          };
          ws.onclose = () => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[WS] Bağlantı bağlandı, yenidən cəhd ediləcək...');
            }
            ws = null;
            clearReconnectTimer();
            reconnectTimer = setTimeout(() => get().startRealtimeSync(), 5000);
          };
        } else {
          eventSource = new EventSource(sseUrl);
          eventSource.onopen = () => {
            if (process.env.NODE_ENV === 'development') {
              console.log('[SSE] Realtime bağlantı quruldu');
            }
          };
          eventSource.onerror = (err) => {
            console.error('[SSE] Xəta:', err);
            eventSource?.close();
            eventSource = null;
            clearReconnectTimer();
            reconnectTimer = setTimeout(() => get().startRealtimeSync(), 5000);
          };
          eventSource.addEventListener('full-sync', (e: MessageEvent) => {
            try {
              const { products, categories, orders } = JSON.parse(e.data);
              if (products) get().setProducts(products);
              if (categories) get().setCategories(categories);
              if (orders) get().setOrders(orders);
            } catch (err) {
              console.error('[SSE] full-sync parse xətası:', err);
            }
          });
          eventSource.addEventListener('product-updated', (e: MessageEvent) => {
            try {
              get().updateProduct(JSON.parse(e.data));
            } catch (err) {
              console.error('[SSE] product-updated xətası:', err);
            }
          });
          eventSource.addEventListener('product-created', (e: MessageEvent) => {
            try {
              get().addProduct(JSON.parse(e.data));
            } catch (err) {
              console.error('[SSE] product-created xətası:', err);
            }
          });
          eventSource.addEventListener('product-deleted', (e: MessageEvent) => {
            try {
              const { id } = JSON.parse(e.data);
              get().deleteProduct(id);
            } catch (err) {
              console.error('[SSE] product-deleted xətası:', err);
            }
          });
          eventSource.addEventListener('stock-changed', (e: MessageEvent) => {
            try {
              const { productId, delta, variantId } = JSON.parse(e.data);
              get().adjustStock(productId, delta, variantId);
            } catch (err) {
              console.error('[SSE] stock-changed xətası:', err);
            }
          });
          eventSource.addEventListener('order-status-changed', (e: MessageEvent) => {
            try {
              const { id, status } = JSON.parse(e.data);
              get().updateOrderStatus(id, status);
            } catch (err) {
              console.error('[SSE] order-status-changed xətası:', err);
            }
          });
          eventSource.addEventListener('category-updated', (e: MessageEvent) => {
            try {
              get().updateCategory(JSON.parse(e.data));
            } catch (err) {
              console.error('[SSE] category-updated xətası:', err);
            }
          });
        }
      },
      stopRealtimeSync: () => {
        clearReconnectTimer();
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (ws) {
          ws.close();
          ws = null;
        }
      },

      // ═══ GRANULAR SELECTORS (performans üçün) ═══
      getProductById: (id) => get().products.find(p => p.id === id),
      getProductIds: () => get().products.map(p => p.id),
      getProductName: (id) => get().products.find(p => p.id === id)?.name ?? '',
      getProductPrice: (id, variantId) => {
        const p = get().products.find(p => p.id === id);
        if (!p) return 0;
        const v = variantId ? p.variants?.find(vv => vv.id === variantId) : p.variants?.[0];
        return get().productPriceNow(p, v);
      },
      getProductStock: (id, variantId) => {
        const p = get().products.find(p => p.id === id);
        if (!p) return 0;
        if (variantId) return p.variants?.find(v => v.id === variantId)?.stock ?? 0;
        return get().productTotalStock(p);
      },
      getProductRating: (id) => {
        const p = get().products.find(p => p.id === id);
        return p ? get().productRatingAvg(p) : 0;
      },

      // ═══ SELECTORS ═══
      cartTotal: () =>
        get().cart.reduce((sum, item) => {
          const p = get().products.find((x) => x.id === item.productId);
          const v = item.variantId
            ? p?.variants?.find((vv) => vv.id === item.variantId)
            : p?.variants?.[0];
          if (!p || (!v && p.variants?.length)) return sum;
          const basePrice = v?.price ?? p.price ?? 0;
          const final = calcFinalPrice(basePrice, p.discountType, p.discountValue);
          return sum + final * (item.qty || 1);
        }, 0),

      productPriceNow: (p, v) => {
        const base = v?.price ?? p.variants?.[0]?.price ?? p.price ?? 0;
        return calcFinalPrice(base, p.discountType, p.discountValue);
      },

      productRatingAvg: (p) => avgRating(p),
      isDiscountActive: (p) => calcIsDiscountActive(p),
      productTotalStock: (p) => calcProductTotalStock(p),

      productBySlug: (slug) => {
        const target = slugifyProductSlug(slug);
        return get().products.find(p => p.slug && slugifyProductSlug(p.slug) === target);
      },

      productsByCategorySlug: (slug) => {
        const category = get().categories.find(c => c.slug === slug);
        if (!category) return [];
        return get().products.filter(p => p.categoryId === category.id && !p.archived);
      },

      productsOnSale: () => get().products.filter(p => !p.archived && calcIsDiscountActive(p)),

      productsFeatured: () => get().products.filter(p => !p.archived && (p.isFeatured || p.featured)),

      productsFilterSearch: (query, categoryId, sort) => {
        const q = query.trim().toLowerCase();
        const list = get().products;
        let filtered = list.filter(p => {
          if (p.archived) return false;
          const inName = p.name.toLowerCase().includes(q);
          const inTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
          const inDesc = p.description?.toLowerCase().includes(q);
          return !q || inName || inTags || inDesc;
        });
        if (categoryId) filtered = filtered.filter(p => p.categoryId === categoryId);
        if (sort) {
          const sorted = [...filtered];
          switch (sort) {
            case 'price_asc': sorted.sort((a, b) => productDisplayPrice(a) - productDisplayPrice(b)); break;
            case 'price_desc': sorted.sort((a, b) => productDisplayPrice(b) - productDisplayPrice(a)); break;
            case 'rating': sorted.sort((a, b) => avgRating(b) - avgRating(a)); break;
            case 'newest': sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
          }
          return sorted;
        }
        return filtered;
      },

      couponIsValid: (code, total) => {
        const now = new Date();
        const coupon = get().coupons.filter(c => c.isActive).find(c => c.code.toLowerCase() === code.trim().toLowerCase());
        if (!coupon) return undefined;
        if (new Date(coupon.expiresAt) < now) return undefined;
        if (coupon.minCartValue && total < coupon.minCartValue) return undefined;
        return coupon;
      },

      cartItemCount: () => get().cart.reduce((sum, item) => sum + (item.qty || 0), 0),
      cartLineCount: () => get().cart.length,
      notificationsUnreadCount: () => get().notifications.filter(n => !n.read).length,

      lowStockAlerts: (limit = 10) => lowStockProducts(get().products).slice(0, limit),

      recentOrders: (limit = 10) =>
        [...get().orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit),

      topSellingProducts: (limit = 10) => {
        const totals = new Map<ID, number>();
        for (const o of get().orders) {
          for (const i of o.items) {
            totals.set(i.productId, (totals.get(i.productId) || 0) + i.qty);
          }
        }
        return [...get().products]
          .map(p => ({ product: p, qty: totals.get(p.id) || 0 }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, limit)
          .map(x => x.product);
      },

      dailySalesTotal: (isoDate) => {
        const target = new Date(isoDate).toDateString();
        return get().orders.filter(o => new Date(o.createdAt).toDateString() === target).reduce((sum, o) => sum + (o.total ?? 0), 0);
      },

      dashboardSummary: () => {
        const orders = get().orders;
        const todayStr = new Date().toDateString();
        let totalRevenue = 0, ordersToday = 0;
        for (const o of orders) {
          totalRevenue += o.total ?? 0;
          if (new Date(o.createdAt).toDateString() === todayStr) ordersToday++;
        }
        const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
        const lowStockCount = get().lowStockAlerts().length;
        const productsOnSaleCount = get().productsOnSale().length;
        return { totalRevenue, ordersToday, avgOrderValue, lowStockCount, productsOnSaleCount };
      },

      // ═══ CATEGORIES ═══
      addCategory: (c) => { apiBridge('POST', '/api/categories', c); set(s => ({ categories: [c, ...s.categories] })); },
      updateCategory: (c) => { apiBridge('PATCH', `/api/categories/${c.id}`, c); set(s => ({ categories: s.categories.map(x => x.id === c.id ? { ...x, ...c } : x) })); },
      deleteCategory: (id) => { apiBridge('DELETE', `/api/categories/${id}`); set(s => ({ categories: s.categories.filter(x => x.id !== id) })); },
      archiveCategory: (id) => set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, archived: true } : c) })),
      unarchiveCategory: (id) => set(s => ({ categories: s.categories.map(c => c.id === id ? { ...c, archived: false } : c) })),

      // ═══ PRODUCTS (basePrice normallaşdırmalı) ═══
      addProduct: (p) => set(s => {
        const price = p.price ?? p.variants?.[0]?.price ?? 0;
        const existing = s.products;
        const rawSlug = slugifyProductSlug(p.slug || p.name);
        const uniqueSlug = ensureUniqueSlug(rawSlug, existing, p.id);
        const normalized: Product = {
          ...p,
          slug: uniqueSlug,
          price,
          basePrice: typeof p.basePrice === 'string' ? parseFloat(p.basePrice) : (p.basePrice ?? price),
          reviews: p.reviews ?? [],
          minStock: p.minStock ?? 5,
          createdAt: p.createdAt ?? new Date().toISOString(),
          archived: p.archived ?? false,
        };
        apiBridge('POST', '/api/products', normalized);
        return { products: [normalized, ...existing] };
      }),

      updateProduct: (p) => set(s => {
        const existing = s.products;
        const updated = existing.map(x => {
          if (x.id !== p.id) return x;
          const merged = { ...x, ...p };
          const rawSlug = slugifyProductSlug(merged.slug || merged.name);
          merged.slug = ensureUniqueSlug(rawSlug, existing, merged.id);
          if (merged.price == null) merged.price = merged.variants?.[0]?.price ?? x.variants?.[0]?.price ?? 0;
          merged.basePrice = typeof merged.basePrice === 'string' ? parseFloat(merged.basePrice) : (merged.basePrice ?? merged.price);
          merged.archived = merged.archived ?? false;
          return merged;
        });
        const mergedProduct = updated.find(x => x.id === p.id);
        if (mergedProduct) apiBridge('PATCH', `/api/products/${p.id}`, mergedProduct);
        return { products: updated };
      }),

      deleteProduct: (id) => { apiBridge('DELETE', `/api/products/${id}`); set(s => ({ products: s.products.filter(x => x.id !== id) })); },
      archiveProduct: (id) => { apiBridge('PATCH', `/api/products/${id}/archive`); set(s => ({ products: s.products.map(p => p.id === id ? { ...p, archived: true } : p) })); },
      unarchiveProduct: (id) => { apiBridge('PATCH', `/api/products/${id}/unarchive`); set(s => ({ products: s.products.map(p => p.id === id ? { ...p, archived: false } : p) })); },
      toggleProductArchived: (id, archive) => { const action = archive ? 'archive' : 'unarchive'; apiBridge('PATCH', `/api/products/${id}/${action}`); set(s => ({ products: s.products.map(p => p.id === id ? { ...p, archived: archive } : p) })); },
      updateProductTags: (id, tags) => set(s => ({ products: s.products.map(p => p.id === id ? { ...p, tags } : p) })),
      updateProductAttributes: (id, attributes) => set(s => ({ products: s.products.map(p => p.id === id ? { ...p, attributes } : p) })),
      updateProductImageAltText: (id, url, alt) => set(s => ({ products: s.products.map(p => p.id === id ? { ...p, images: p.images.map(img => img.url === url ? { ...img, alt } : img) } : p) })),

      // ═══ REVIEWS ═══
      submitReview: (r) => set(s => ({
        products: s.products.map(p => p.id === r.productId ? { ...p, reviews: [...(p.reviews || []), r] } : p),
        notifications: [{ id: cryptoId(), type: 'review', refId: r.id, text: `Yeni rəy gözləyir: ${r.name}`, createdAt: new Date().toISOString(), read: false }, ...s.notifications],
      })),
      approveReview: (pid, rid) => set(s => ({ products: s.products.map(p => p.id === pid ? { ...p, reviews: p.reviews.map(r => r.id === rid ? { ...r, approved: true } : r) } : p) })),
      unapproveReview: (pid, rid) => set(s => ({ products: s.products.map(p => p.id === pid ? { ...p, reviews: p.reviews.map(r => r.id === rid ? { ...r, approved: false } : r) } : p) })),
      deleteReview: (pid, rid) => set(s => ({ products: s.products.map(p => p.id === pid ? { ...p, reviews: p.reviews.filter(r => r.id !== rid) } : p) })),

      // ═══ INVENTORY & FINANCE ═══
      adjustStock: (productId, delta, variantId) => set(s => ({
        products: s.products.map(p => {
          if (p.id !== productId) return p;
          if (!variantId && p.variants?.length) return p;
          if (variantId) return { ...p, variants: p.variants.map(v => v.id === variantId ? { ...v, stock: Math.max(0, Number(v.stock || 0) + delta) } : v) };
          return { ...p, stock: Math.max(0, Number(p.stock || 0) + delta) };
        }),
      })),
      adjustMinStock: (productId, minStock) => set(s => ({ products: s.products.map(p => p.id === productId ? { ...p, minStock: Math.max(0, minStock) } : p) })),
      addExpense: (expense) => { const full = { ...expense, id: cryptoId() }; apiBridge('POST', '/api/expenses', full); set(s => ({ expenses: [full, ...s.expenses] })); },
      removeExpense: (id) => { apiBridge('DELETE', `/api/expenses/${id}`); set(s => ({ expenses: s.expenses.filter(e => e.id !== id) })); },

      // ═══ UX ═══
      toggleFavorite: (pid) => set(s => ({ favorites: s.favorites.includes(pid) ? s.favorites.filter(x => x !== pid) : [pid, ...s.favorites] })),
      isFavorite: (pid) => get().favorites.includes(pid),
      setLocale: (locale) => set(s => ({ storefrontConfig: { ...s.storefrontConfig, locale } })),

      // ═══ CART / ORDERS ═══
      addToCart: (pid, vid, qty) => set(s => {
        const product = s.products.find(p => p.id === pid);
        if (!product) return s;
        const qtyToAdd = qty ?? (product.quantityStep ?? 1);
        let variantId = vid;
        if (!variantId && product.variants?.length) variantId = product.variants[0].id;
        const exist = s.cart.find(c => c.productId === pid && c.variantId === variantId);
        if (exist) return { cart: s.cart.map(c => c === exist ? { ...c, qty: (c.qty || 0) + qtyToAdd } : c) };
        return { cart: [{ productId: pid, variantId, qty: qtyToAdd }, ...s.cart] };
      }),
      updateCartItemQty: (pid, vid, qty) => set(s => {
        const item = s.cart.find(c => c.productId === pid && c.variantId === vid);
        if (!item) return s;
        if (qty <= 0) return { cart: s.cart.filter(c => c !== item) };
        return { cart: s.cart.map(c => c === item ? { ...c, qty } : c) };
      }),
      removeCartItem: (pid, vid) => set(s => ({ cart: s.cart.filter(c => !(c.productId === pid && c.variantId === vid)) })),
      removeFromCart: (pid, vid) => get().removeCartItem(pid, vid),
      clearCart: () => set({ cart: [] }),
      placeOrder: (o) => set(s => {
        const items = o.items.map(it => ({ ...it, costAtOrder: it.costAtOrder ?? it.priceAtOrder * 0.6 }));
        const products = s.products.map(p => {
          const lineItems = items.filter(i => i.productId === p.id);
          if (!lineItems.length) return p;
          return { ...p, variants: p.variants.map(v => {
            const li = lineItems.find(i => i.variantId === v.id);
            if (!li) return v;
            return { ...v, stock: Math.max(0, Number(v.stock || 0) - li.qty) };
          }) };
        });
        const orderSaved = { ...o, items };
        apiBridge('POST', '/api/orders', orderSaved);
        return { products, orders: [orderSaved, ...s.orders], notifications: [{ id: cryptoId(), type: 'order', refId: o.id, text: `Yeni sifariş (${items.length} sətir)`, createdAt: new Date().toISOString(), read: false }, ...s.notifications], cart: [] };
      }),
      updateOrderStatus: (id, status) => { apiBridge('PATCH', `/api/orders/${id}`, { status }); set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status } : o) })); },
      cancelOrder: (id, reason) => { apiBridge('PATCH', `/api/orders/${id}`, { status: 'cancelled', cancelReason: reason }); set(s => ({ orders: s.orders.map(o => o.id === id ? { ...o, status: 'cancelled' as OrderStatus, cancelReason: reason } : o) })); },
      assignDelivery: (orderId, courierId) => { apiBridge('PATCH', `/api/orders/${orderId}`, { courierId, status: 'delivering' }); set(s => ({ orders: s.orders.map(o => o.id === orderId ? { ...o, courierId, status: 'delivering' as OrderStatus } : o) })); },

      // ═══ COUPONS ═══
      addCoupon: (coupon) => set(s => ({ coupons: [{ ...coupon, id: cryptoId(), isActive: true } as Coupon, ...s.coupons] })),
      updateCoupon: (coupon) => set(s => ({ coupons: s.coupons.map(c => c.id === coupon.id ? coupon : c) })),
      deleteCoupon: (id) => set(s => ({ coupons: s.coupons.filter(c => c.id !== id) })),

      // ═══ ADMIN CONFIG ═══
      updateStorefrontConfig: (config) => set(s => ({ storefrontConfig: { ...s.storefrontConfig, ...config } })),
      setAdminUIState: (state) => set(s => ({ adminUIState: { ...s.adminUIState, ...state, lastVisited: new Date().toISOString() } })),
      updateAdminUIState: (state) => set(s => ({ adminUIState: { ...s.adminUIState, ...state, lastVisited: new Date().toISOString() } })),

      // ═══ NOTIFICATIONS & EVENTS ═══
      notify: (payload) => set(s => ({ notifications: [{ id: cryptoId(), createdAt: new Date().toISOString(), read: false, ...payload }, ...s.notifications] })),
      markNotificationRead: (id) => set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) })),
      markAllNotificationsRead: () => set(s => ({ notifications: s.notifications.map(n => n.read ? n : { ...n, read: true }) })),
      logEvent: (payload) => set(s => ({ events: [{ id: cryptoId(), createdAt: payload.createdAt ?? new Date().toISOString(), ...payload }, ...s.events].slice(0, 100) })),

      // ═══ CHAT ═══
      sendChat: (m) => set(s => ({ chat: [...s.chat, m], notifications: [{ id: cryptoId(), type: 'chat', refId: m.id, text: `Chat: ${m.text.slice(0, 28)}…`, createdAt: new Date().toISOString(), read: false }, ...s.notifications] })),

      // ═══ ANALYTICS ═══
      analytics: () => kpis(get().orders, get().products),
      kpis: (orders, products) => kpis(orders, products),
      finalPrice: (p, v) => {
        const base = v?.price ?? p.variants?.[0]?.price ?? p.price ?? 0;
        return calcFinalPrice(base, p.discountType, p.discountValue);
      },
      variantFinalPrice: (p, v) => calcVariantFinalPrice(p, v),
    }),
    {
      name: 'organik-gedebey-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? window.localStorage : undefined)),
      onRehydrateStorage: () => (state, error) => {
        if (!error && state && typeof state.markHydrated === 'function') {
          state.markHydrated();
          if (process.env.NODE_ENV === 'development') console.log('[Store] Hydrated with', state.products?.length, 'products');
        }
      },
      partialize: (s) => ({
        products: s.products,
        categories: s.categories,
        orders: s.orders,
        cart: s.cart,
        favorites: s.favorites,
        users: s.users,
        coupons: s.coupons,
        expenses: s.expenses,
        storefrontConfig: s.storefrontConfig,
        adminUIState: s.adminUIState,
      }),
    },
  ),
);

// ═══════════════════════════════════════════════════════════════════════════
// Hydration Hook
// ═══════════════════════════════════════════════════════════════════════════
export const useHasHydrated = () => useApp((state) => state._hasHydrated);

// ═══════════════════════════════════════════════════════════════════════════
// Utility Exports
// ═══════════════════════════════════════════════════════════════════════════
export {
  calcFinalPrice as finalPrice,
  calcVariantFinalPrice as variantFinalPrice,
  kpis,
  calcIsDiscountActive as isDiscountActive,
  calcProductTotalStock as productTotalStock,
  minPrice,
  avgRating,
  productDisplayPrice,
  abcSplit,
  priceTrend,
  lowStockProducts,
};

export type {
  Product,
  Variant,
  Review,
  Order,
  Category,
  CartItem,
  Notification,
  ChatMessage,
  OrderStatus,
  Coupon,
  Expense,
  AdminUIState,
  User,
  StorefrontConfig,
  ID,
};