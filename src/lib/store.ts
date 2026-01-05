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

// =====================
// ID generator
// =====================
export function cryptoId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

// Yeni util: SSR üçün təhlükəsiz ID
export function cryptoIdSafe(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

// =====================
// Slug helper-lər
// =====================

// Azərbaycan əlifbasını normalizə edən slugify
export function slugifyProductSlug(input: string): string {
  if (!input) return 'product';
  const charMap: Record<string, string> = {
    ə: 'e',
    Ə: 'e',
    ö: 'o',
    Ö: 'o',
    ü: 'u',
    Ü: 'u',
    ğ: 'g',
    Ğ: 'g',
    ç: 'c',
    Ç: 'c',
    ş: 's',
    Ş: 's',
    ı: 'i',
    İ: 'i',
  };
  const normalized = input
    .trim()
    .split('')
    .map((ch) => charMap[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // hər şey → tire
    .replace(/^-+|-+$/g, ''); // baş/son tirləri sil
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

// =====================
// Premium Store Event tipi (log üçün)
// =====================
export type StoreEvent = {
  id: string;
  type: 'order' | 'stock' | 'product' | 'system' | 'cart';
  message: string;
  createdAt: string;
  meta?: Record<string, unknown>;
};

// =====================
// App State tipi
// =====================
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

  // Premium event log
  events: StoreEvent[];

  // Hydration flag
  _hasHydrated: boolean;
  markHydrated: () => void;

  // =====================
  // SELECTORS
  // =====================
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

  // PREMIUM SELECTORS (əlavə funksionallıq)
  cartItemCount: () => number; // səbətdə ümumi ədəd
  cartLineCount: () => number; // səbətdə neçə sətir var
  notificationsUnreadCount: () => number;
  lowStockAlerts: (limit?: number) => Product[]; // aşağı stoklu məhsullar
  recentOrders: (limit?: number) => Order[];
  topSellingProducts: (limit?: number) => Product[];
  dailySalesTotal: (isoDate: string) => number;
  resetDailySales: () => void;
  dashboardSummary: () => {
    totalRevenue: number;
    ordersToday: number;
    avgOrderValue: number;
    lowStockCount: number;
    productsOnSaleCount: number;
  };

  // =====================
  // ACTIONS: Categories
  // =====================
  addCategory: (c: Category) => void;
  updateCategory: (c: Category) => void;
  archiveCategory: (id: ID) => void;
  unarchiveCategory: (id: ID) => void;

  // =====================
  // ACTIONS: Products
  // =====================
  addProduct: (p: Product) => void;
  updateProduct: (p: Product) => void;
  deleteProduct: (id: ID) => void;
  archiveProduct: (id: ID) => void;
  unarchiveProduct: (id: ID) => void;
  // ƏLAVƏ EDİLDİ: ProductCard üçün bir toggle funksiyası
  toggleProductArchived: (id: ID, archive: boolean) => void;
  updateProductTags: (id: ID, tags: string[]) => void;
  updateProductAttributes: (id: ID, attributes: Product['attributes']) => void;
  updateProductImageAltText: (id: ID, url: string, alt: string) => void;

  // =====================
  // ACTIONS: Reviews
  // =====================
  submitReview: (r: Review) => void;
  approveReview: (pid: ID, rid: ID) => void;
  deleteReview: (pid: ID, rid: ID) => void;
  unapproveReview: (pid: ID, rid: ID) => void;

  // =====================
  // ACTIONS: Inventory & Finance
  // =====================
  adjustStock: (productId: ID, delta: number, variantId: ID) => void;
  adjustMinStock: (productId: ID, minStock: number) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: ID) => void;

  // =====================
  // UX
  // =====================
  toggleFavorite: (pid: ID) => void;
  isFavorite: (pid: ID) => boolean;
  setLocale: (locale: string) => void;

  // =====================
  // Cart / Orders
  // =====================
  addToCart: (pid: ID, vid?: ID, qty?: number) => void;
  removeFromCart: (pid: ID, vid?: ID) => void;
  // ƏLAVƏ EDİLDİ: Səbətdəki məhsul sayını dəyişdirmək
  updateCartItemQty: (pid: ID, vid: ID | undefined, qty: number) => void;
  // ƏLAVƏ EDİLDİ: Səbətdən elementi tam çıxarmaq (eyni məqsədli, lakin daha aydın adlandırma)
  removeCartItem: (pid: ID, vid: ID | undefined) => void;
  clearCart: () => void;
  placeOrder: (o: Order) => void;
  updateOrderStatus: (id: ID, status: OrderStatus) => void;

  // =====================
  // Coupons
  // =====================
  addCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  updateCoupon: (coupon: Coupon) => void;
  deleteCoupon: (id: ID) => void;

  // =====================
  // Admin config
  // =====================
  updateStorefrontConfig: (
    config: Partial<
      StorefrontConfig & { vatRate: number; contactEmail: string; locale: string }
    >,
  ) => void;

  // Mövcud API-ni saxlayırıq:
  setAdminUIState: (state: Partial<AdminUIState>) => void;

  // ✨ YENİ: AdminSettingsPage-in çağırdığı updateAdminUIState
  updateAdminUIState: (state: Partial<AdminUIState>) => void;

  // =====================
  // Notifications & Events
  // =====================
  notify: (payload: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: ID) => void;
  markAllNotificationsRead: () => void;
  logEvent: (payload: Omit<StoreEvent, 'id' | 'createdAt'> & { createdAt?: string }) => void;

  // =====================
  // Chat
  // =====================
  sendChat: (m: ChatMessage) => void;

  // =====================
  // Analytics
  // =====================
  analytics: () => ReturnType<typeof kpis>;
  kpis: (orders: Order[], products: Product[]) => ReturnType<typeof kpis>;
  finalPrice: (p: Product, v?: Variant) => number;
  variantFinalPrice: (p: Product, v: Variant) => number;
};

const initialStorefrontConfig: AppState['storefrontConfig'] = {
  primaryColor: '#16a34a',
  currency: 'AZN',
  locale: 'az-AZ',
  vatRate: 0.18,
  contactEmail: 'info@organikgedebey.az',
};

const initialAdminUIState: AdminUIState = {
  sidebarOpen: true,
  theme: 'light',
  lastVisited: new Date().toISOString(),
};

// =====================
// STORE
// =====================
export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      storefrontConfig: initialStorefrontConfig,
      categories: initialCategories,
      products: initialProducts,
      orders: initialOrders,
      cart: [],
      favorites: [],
      chat: [],
      notifications: [],
      users: [],
      coupons: [
        {
          id: cryptoId(),
          code: 'SUMMER20',
          discountType: 'percentage',
          value: 20,
          expiresAt: '2025-08-31',
          minCartValue: 50,
          isActive: true,
        },
        {
          id: cryptoId(),
          code: 'FREE5',
          discountType: 'fixed',
          value: 5,
          expiresAt: '2025-12-31',
          isActive: true,
        },
      ],
      expenses: [],
      adminUIState: initialAdminUIState,
      events: [],
      _hasHydrated: false,
      markHydrated: () => set({ _hasHydrated: true }),

      // =====================
      // SELECTORS
      // =====================
      cartTotal: () =>
        get().cart.reduce((sum, item) => {
          const p = get().products.find((x) => x.id === item.productId);
          const v =
            p?.variants?.find((vv) => vv.id === item.variantId) ??
            p?.variants?.[0];
          if (!p || !v) return sum;
          return (
            sum +
            calcVariantFinalPrice(p, v as Variant) * (item.qty || 1)
          );
        }, 0),

      productPriceNow: (p, v) => {
        const base = v?.price ?? p.variants?.[0]?.price ?? p.price ?? 0;
        return calcFinalPrice(base, p.discountType, p.discountValue);
      },

      productRatingAvg: (p) => avgRating(p),

      isDiscountActive: (p) => calcIsDiscountActive(p),

      productTotalStock: (p) => calcProductTotalStock(p),

      // Slug selector – slug normalize olunmuş şəkildə
      productBySlug: (slug) => {
        const target = slugifyProductSlug(slug);
        return (get().products || []).find(
          (p) => p.slug && slugifyProductSlug(p.slug) === target,
        );
      },

      productsByCategorySlug: (slug) => {
        const category = (get().categories || []).find(
          (c) => c.slug === slug,
        );
        if (!category) return [];
        return (get().products || []).filter(
          (p) => p.categoryId === category.id && !p.archived,
        );
      },

      productsOnSale: () =>
        (get().products || []).filter(
          (p) => !p.archived && calcIsDiscountActive(p),
        ),

      productsFeatured: () =>
        (get().products || []).filter(
          (p) => !p.archived && p.featured,
        ),

      productsFilterSearch: (query, categoryId, sort) => {
        const q = query.trim().toLowerCase();
        const list = get().products || [];
        let filtered = list.filter((p) => {
          if (p.archived) return false;
          const inName = p.name.toLowerCase().includes(q);
          const inTags = (p.tags || []).some((t) =>
            t.toLowerCase().includes(q),
          );
          const inDesc = p.description?.toLowerCase().includes(q); // FIX: description null ola bilər
          return !q || inName || inTags || inDesc;
        });
        if (categoryId) {
          filtered = filtered.filter((p) => p.categoryId === categoryId);
        }
        if (sort) {
          const sorted = [...filtered];
          switch (sort) {
            case 'price_asc':
              sorted.sort(
                (a, b) =>
                  productDisplayPrice(a) - productDisplayPrice(b),
              );
              break;
            case 'price_desc':
              sorted.sort(
                (a, b) =>
                  productDisplayPrice(b) - productDisplayPrice(a),
              );
              break;
            case 'rating':
              sorted.sort((a, b) => avgRating(b) - avgRating(a));
              break;
            case 'newest':
              sorted.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              );
              break;
          }
          return sorted;
        }
        return filtered;
      },

      couponIsValid: (code, total) => {
        const now = new Date();
        const coupon = get()
          .coupons.filter((c) => c.isActive)
          .find(
            (c) =>
              c.code.toLowerCase() === code.trim().toLowerCase(),
          );
        if (!coupon) return undefined;
        if (new Date(coupon.expiresAt) < now) return undefined;
        if (coupon.minCartValue && total < coupon.minCartValue) {
          return undefined;
        }
        return coupon;
      },

      // =====================
      // PREMIUM SELECTORS
      // =====================
      cartItemCount: () =>
        get().cart.reduce((sum, item) => sum + (item.qty || 0), 0),

      cartLineCount: () => get().cart.length,

      notificationsUnreadCount: () =>
        get().notifications.filter((n) => !n.read).length,

      lowStockAlerts: (limit = 10) => {
        const prods = get().products || [];
        return lowStockProducts(prods).slice(0, limit);
      },

      recentOrders: (limit = 10) =>
        [...(get().orders || [])].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        ).slice(0, limit),

      topSellingProducts: (limit = 10) => {
        const totals = new Map<ID, number>();
        (get().orders || []).forEach((o) => {
          o.items.forEach((i) => {
            totals.set(i.productId, (totals.get(i.productId) || 0) + i.qty);
          });
        });
        return [...(get().products || [])]
          .map((p) => ({
            product: p,
            qty: totals.get(p.id) || 0,
          }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, limit)
          .map((x) => x.product);
      },

      dailySalesTotal: (isoDate) => {
        const target = new Date(isoDate).toDateString();
        return (get().orders || [])
          .filter(
            (o) => new Date(o.createdAt).toDateString() === target,
          )
          .reduce((sum, o) => sum + (o.total ?? 0), 0);
      },
      resetDailySales: () => set(() => ({
  cart: [],
  orders: [],
  dailyStats: {
    totalSales: 0,
    totalProfit: 0,
    totalCustomers: 0,
    itemsSold: {}
  }
})),

      dashboardSummary: () => {
        const orders = get().orders || [];
        const todayStr = new Date().toDateString();
        let totalRevenue = 0;
        let ordersToday = 0;
        let revenueToday = 0;
        orders.forEach((o) => {
          const total = o.total ?? 0;
          totalRevenue += total;
          if (new Date(o.createdAt).toDateString() === todayStr) {
            ordersToday += 1;
            revenueToday += total;
          }
        });
        const avgOrderValue = orders.length
          ? totalRevenue / orders.length
          : 0;
        const lowStockCount =
          get().lowStockAlerts(9999).length || 0;
        const productsOnSaleCount =
          get().productsOnSale().length || 0;

        return {
          totalRevenue,
          ordersToday,
          avgOrderValue,
          lowStockCount,
          productsOnSaleCount,
        };
      },

      // =====================
      // Categories
      // =====================
      addCategory: (c) =>
        set((s) => ({ categories: [c, ...(s.categories || [])] })),

      updateCategory: (c) =>
        set((s) => ({
          categories: (s.categories || []).map((x) =>
            x.id === c.id ? { ...x, ...c } : x,
          ),
        })),

      archiveCategory: (id) =>
        set((s) => ({
          categories: (s.categories || []).map((c) =>
            c.id === id ? { ...c, archived: true } : c,
          ),
        })),

      unarchiveCategory: (id) =>
        set((s) => ({
          categories: (s.categories || []).map((c) =>
            c.id === id ? { ...c, archived: false } : c,
          ),
        })),

      // =====================
      // Products
      // =====================
      addProduct: (p) =>
        set((s) => {
          const price = p.price ?? p.variants?.[0]?.price ?? 0;
          const existing = s.products || [];
          const baseSlugSource =
            (p.slug && p.slug.trim()) || p.name || '';
          const rawSlug = slugifyProductSlug(baseSlugSource);
          const uniqueSlug = ensureUniqueSlug(
            rawSlug,
            existing,
            p.id as ID,
          );
          const normalized: Product = {
            ...p,
            slug: uniqueSlug,
            price,
            reviews: p.reviews ?? [],
            // FIX: default dəyərləri təmin etmək
            minStock: p.minStock ?? 5,
            createdAt: p.createdAt ?? new Date().toISOString(),
          };
          return { products: [normalized, ...existing] };
        }),

      updateProduct: (p) =>
        set((s) => {
          const existing = s.products || [];
          return {
            products: existing.map((x) => {
              if (x.id !== p.id) return x;
              const merged: Product = {
                ...(x as Product),
                ...(p as Product),
              };
              const baseSlugSource =
                (merged.slug && merged.slug.trim()) ||
                p.slug?.trim() ||
                merged.name ||
                x.name ||
                '';
              const rawSlug = slugifyProductSlug(baseSlugSource);
              merged.slug = ensureUniqueSlug(
                rawSlug,
                existing,
                merged.id as ID,
              );
              if (merged.price == null) {
                merged.price =
                  merged.variants?.[0]?.price ??
                  x.variants?.[0]?.price ??
                  0; // FIX: default qiymət
              }
              // FIX: Tarix və review-lərin itməsinin qarşısını almaq
              merged.createdAt = merged.createdAt ?? x.createdAt;
              merged.reviews = merged.reviews ?? x.reviews ?? [];

              return merged;
            }),
          };
        }),

      deleteProduct: (id) =>
        set((s) => ({
          products: (s.products || []).filter((x) => x.id !== id),
        })),

      archiveProduct: (id) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === id ? { ...p, archived: true } : p,
          ),
        })),

      unarchiveProduct: (id) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === id ? { ...p, archived: false } : p,
          ),
        })),

      // ƏLAVƏ EDİLDİ: Arxiv statusunu dəyişdirmək üçün universal funksiya
      toggleProductArchived: (id, archive) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === id ? { ...p, archived: archive } : p,
          ),
        })),

      updateProductTags: (id, tags) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === id ? { ...p, tags } : p,
          ),
        })),

      updateProductAttributes: (id, attributes) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === id ? { ...p, attributes } : p,
          ),
        })),

      updateProductImageAltText: (id, url, alt) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === id
              ? {
                  ...p,
                  images: (p.images || []).map((img) => {
                    if (typeof img === 'string') return img;
                    if (img.url === url) return { ...img, alt };
                    return img;
                  }),
                }
              : p,
          ),
        })),

      // =====================
      // Reviews
      // =====================
      submitReview: (r) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === r.productId
              ? { ...p, reviews: [...(p.reviews || []), r] }
              : p,
          ),
          notifications: [
            {
              id: cryptoId(),
              type: 'review',
              refId: r.id,
              text: `Yeni rəy gözləyir: ${r.name}`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...s.notifications,
          ],
        })),

      approveReview: (pid, rid) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === pid
              ? {
                  ...p,
                  reviews: (p.reviews || []).map((r) =>
                    r.id === rid ? { ...r, approved: true } : r,
                  ),
                }
              : p,
          ),
        })),

      unapproveReview: (pid, rid) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === pid
              ? {
                  ...p,
                  reviews: (p.reviews || []).map((r) =>
                    r.id === rid ? { ...r, approved: false } : r,
                  ),
                }
              : p,
          ),
        })),

      deleteReview: (pid, rid) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === pid
              ? {
                  ...p,
                  reviews: (p.reviews || []).filter(
                    (r) => r.id !== rid,
                  ),
                }
              : p,
          ),
        })),

      // =====================
      // Inventory & Finance
      // =====================
      adjustStock: (productId, delta, variantId) => {
        if (!variantId) return;
        set((s) => ({
          products: (s.products || []).map((p) => {
            if (p.id !== productId) return p;
            const variants = (p.variants || []).map((v) =>
              v.id === variantId
                ? {
                    ...v,
                    stock: Math.max(
                      0,
                      Number(v.stock || 0) + delta,
                    ),
                  }
                : v,
            );
            return { ...p, variants };
          }),
        }));
      },

      adjustMinStock: (productId, minStock) =>
        set((s) => ({
          products: (s.products || []).map((p) =>
            p.id === productId
              ? { ...p, minStock: Math.max(0, minStock) }
              : p,
          ),
        })),

      addExpense: (expense) =>
        set((s) => ({
          expenses: [{ ...expense, id: cryptoId() }, ...s.expenses],
        })),

      removeExpense: (id) =>
        set((s) => ({
          expenses: s.expenses.filter((e) => e.id !== id),
        })),

      // =====================
      // UX
      // =====================
      toggleFavorite: (pid) =>
        set((s) => ({
          favorites: s.favorites.includes(pid)
            ? s.favorites.filter((x) => x !== pid)
            : [pid, ...s.favorites],
        })),

      isFavorite: (pid) => get().favorites.includes(pid),

      setLocale: (locale) =>
        set((s) => ({
          storefrontConfig: { ...s.storefrontConfig, locale },
        })),


// ...
      // =====================
      // Cart / Orders
      // =====================
      
      addToCart: (pid, vid, qty) => // qty-nin default dəyərini ( = 1) funksiyadan çıxarırıq
        set((s) => {
          const product = s.products.find((p) => p.id === pid);
          
          // Məhsulun minimum satıla bilən addım dəyərini tap (Əgər yoxdursa 1)
          const defaultStep = product?.quantityStep ?? 1;

          // Əlavə ediləcək YEKUN miqdarı təyin et: ötürülən qty və ya defaultStep
          // Qeyd: qty-nin default dəyəri funksiya imzasından çıxarıldı, ona görə burada ?? istifadə edilir.
          const quantityToAdd = qty ?? defaultStep; 

          // Variant ID-nin yoxlanılması və tapılması sadələşdirildi
          const variantId = vid ?? product?.variants?.[0]?.id;
          
          // Məhsul mövcud deyilsə və ya variantı yoxdursa, state-i qaytar
          if (!product || !variantId || quantityToAdd <= 0) return s;

          const exist = s.cart.find(
            (c) => c.productId === pid && c.variantId === variantId,
          );

          if (exist) {
            return {
              cart: s.cart.map((c) =>
                c === exist
                  ? { ...c, qty: (c.qty || 0) + quantityToAdd } // qty-i quantityToAdd ilə əvəz etdik
                  : c,
              ),
            };
          }
          
          // Yeni məhsulu əlavə et
          return {
            cart: [{ productId: pid, variantId, qty: quantityToAdd }, ...s.cart],
          };
        }),
// ...


// ...
      // ƏLAVƏ EDİLDİ: Səbətdəki məhsul sayını dəyişdirmək
      updateCartItemQty: (pid, vid, qty) =>
        set((s) => {
          // Axtarılacaq elementi bir dəfə tapırıq
          const existingItem = s.cart.find(
            (c) => c.productId === pid && c.variantId === vid,
          );
          
          if (!existingItem) return s; // Əgər element yoxdursa, heç nə etmə

          if (qty <= 0) {
            // Əgər say 0 və ya daha azdırsa, elementi səbətdən çıxar (filter istifadə edilir)
            return {
              cart: s.cart.filter(c => c !== existingItem), // Tapılmış elementi çıxarmaq
            };
          }
          
          // Sayı yenilə
          return {
            cart: s.cart.map((c) =>
              c === existingItem
                ? { ...c, qty } // Sayı birbaşa yenilə
                : c,
            ),
          };
        }),
// ...

      // Bu funksiya əslində 'removeFromCart' ilə eynidir, lakin adı daha aydındır
      removeFromCart: (pid, vid) => get().removeCartItem(pid, vid),

      removeCartItem: (pid, vid) =>
        set((s) => ({
          cart: s.cart.filter(
            (c) =>
              !(
                c.productId === pid &&
                (!vid || c.variantId === vid)
              ),
          ),
        })),

      clearCart: () => set({ cart: [] }),

      placeOrder: (o) =>
        set((s) => {
          const items = o.items.map((it) => ({
            ...it,
            costAtOrder:
              it.costAtOrder ?? it.priceAtOrder * 0.6,
          }));
          const products = (s.products || []).map((p) => {
            const lineItems = items.filter(
              (i) => i.productId === p.id,
            );
            if (!lineItems.length) return p;
            return {
              ...p,
              variants: (p.variants || []).map((v) => {
                const li = lineItems.find(
                  (i) => i.variantId === v.id,
                );
                if (!li) return v;
                return {
                  ...v,
                  stock: Math.max(
                    0,
                    Number(v.stock || 0) - li.qty,
                  ),
                };
              }),
            };
          });
          const orderSaved: Order = { ...o, items };
          return {
            products,
            orders: [orderSaved, ...s.orders],
            notifications: [
              {
                id: cryptoId(),
                type: 'order',
                refId: o.id,
                text: `Yeni sifariş (${items.length} sətir)`,
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...s.notifications,
            ],
            cart: [],
          };
        }),

      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, status } : o,
          ),
        })),

      // =====================
      // Coupons
      // =====================
      addCoupon: (coupon) =>
        set((s) => ({
          coupons: [
            { ...coupon, id: cryptoId(), isActive: true } as Coupon,
            ...s.coupons,
          ],
        })),

      updateCoupon: (coupon) =>
        set((s) => ({
          coupons: s.coupons.map((c) =>
            c.id === coupon.id ? coupon : c,
          ),
        })),

      deleteCoupon: (id) =>
        set((s) => ({
          coupons: s.coupons.filter((c) => c.id !== id),
        })),

      // =====================
      // Admin config
      // =====================
      updateStorefrontConfig: (config) =>
        set((s) => ({
          storefrontConfig: {
            ...s.storefrontConfig,
            ...config,
          },
        })),

      // Köhnə API (Admin Layout və s üçün)
      setAdminUIState: (state) =>
        set((s) => ({
          adminUIState: {
            ...s.adminUIState,
            ...state,
            lastVisited: new Date().toISOString(),
          },
        })),

      // YENİ: AdminSettingsPage üçün daha aydın ad (amma eyni işi görür)
      updateAdminUIState: (state) =>
        set((s) => ({
          adminUIState: {
            ...s.adminUIState,
            ...state,
            lastVisited: new Date().toISOString(),
          },
        })),

      // =====================
      // Notifications & Events
      // =====================
      notify: (payload) =>
        set((s) => ({
          notifications: [
            {
              id: cryptoId(),
              createdAt: new Date().toISOString(),
              read: false,
              ...payload,
            },
            ...s.notifications,
          ],
        })),

      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        })),

      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.read ? n : { ...n, read: true },
          ),
        })),

      logEvent: (payload) =>
        set((s) => {
          const event: StoreEvent = {
            id: cryptoId(),
            createdAt: payload.createdAt ?? new Date().toISOString(),
            ...payload,
          };
          const next = [event, ...s.events];
          // Son 100 event saxlayırıq
          return { events: next.slice(0, 100) };
        }),

      // =====================
      // Chat
      // =====================
      sendChat: (m) =>
        set((s) => ({
          chat: [...s.chat, m],
          notifications: [
            {
              id: cryptoId(),
              type: 'chat',
              refId: m.id,
              text: `Chat: ${m.text.slice(0, 28)}…`,
              createdAt: new Date().toISOString(),
              read: false,
            },
            ...s.notifications,
          ],
        })),

      // =====================
      // Analytics helpers
      // =====================
      analytics: () => kpis(get().orders, get().products || []),

      kpis: (orders, products) => kpis(orders, products),

      finalPrice: (p, v) => {
        const base = v?.price ?? p.variants?.[0]?.price ?? p.price ?? 0;
        return calcFinalPrice(base, p.discountType, p.discountValue);
      },

      variantFinalPrice: (p, v) => calcVariantFinalPrice(p, v),
    }),
    {
      name: 'organik-gedebey-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? window.localStorage
          : undefined,
      ),
      // Hydration bitəndə _hasHydrated = true
      onRehydrateStorage: () => (state, error) => {
        if (!error && state && typeof state.markHydrated === 'function') {
          state.markHydrated();
        }
      },
    },
  ),
);

// Hydration hook
export const useHasHydrated = () =>
  useApp((state) => state._hasHydrated);

// Utility exportlar
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
