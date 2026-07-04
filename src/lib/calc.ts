// src/lib/calc.ts – TİP UYĞUNSUZLUQLARI VƏ İMPORT XƏTALARI HƏLL EDİLDİ
import { ProductGrade, Variant, Product } from "@/types/products";
import { KPI } from "./types";
import { Order } from "@/types/orders";

// ============================================================
// 1. BASKET PROFİT HESABLAMA
// ============================================================
export function calculateBasketProfit(basket: any, products: any[]) {
  let totalRevenue = 0;
  let totalCost = 0;

  if (basket.products && basket.products.length > 0) {
    for (const bp of basket.products) {
      const product = products.find(p => p.id === bp.productId);
      if (product) {
        const variant = product.variants?.find((v: { id: any; }) => v.id === bp.productVariantId) || product.variants?.[0];
        const price = variant?.price ?? 0;
        const cost = variant?.costPrice ?? 0;
        const qty = parseFloat(bp.quantity) || 1;
        totalRevenue += price * qty;
        totalCost += cost * qty;
      }
    }
  } else {
    const primaryVariant = basket.variants?.[0];
    const price = primaryVariant ? parseFloat(primaryVariant.price) : 0;
    totalRevenue = price;
    totalCost = price * 0.6;
  }

  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return { totalRevenue, totalCost, profit, margin };
}

// ============================================================
// 2. ABC ANALİZİ
// ============================================================
export function abcSplit(items: { id: string; name: string; revenue: number }[]) {
  if (!items.length) return { A: [], B: [], C: [] };

  const total = items.reduce((sum, i) => sum + i.revenue, 0);
  let cumulative = 0;
  const A: typeof items = [];
  const B: typeof items = [];
  const C: typeof items = [];

  for (const item of [...items].sort((a, b) => b.revenue - a.revenue)) {
    cumulative += item.revenue;
    const pct = cumulative / total;
    if (pct <= 0.8) A.push(item);
    else if (pct <= 0.95) B.push(item);
    else C.push(item);
  }
  return { A, B, C };
}

// ============================================================
// 3. YAŞ VƏ TƏZƏLİK HESABLAMA
// ============================================================
export function ageInDays(from: Date | string, to: Date | string = new Date()): number {
  const f = new Date(from).getTime();
  const t = new Date(to).getTime();
  return Math.max(0, Math.floor((t - f) / 86400000));
}

export function batchAgeInDays(batchDate: string, to: Date | string = new Date()): number {
  return ageInDays(batchDate, to);
}

export function isExpiringSoon(v: Variant, productShelfLifeDays?: number): boolean {
  const shelfLife = productShelfLifeDays ?? 0;
  if (shelfLife <= 0 || !v.batchDate) return false;

  const age = batchAgeInDays(v.batchDate);
  return age >= (shelfLife * 0.75);
}

// ============================================================
// 4. ENDİRİM & QİYMƏT LOGİKASI (discountType normalizasiyası ilə)
// ============================================================

/**
 * discountType dəyərini standart "percentage" | "fixed" | undefined formatına çevirir.
 * Backend-dən gələn 'PERCENTAGE', 'FIXED' kimi dəyərləri də idarə edir.
 */
function normalizeDiscountType(type: string | null | undefined): "percentage" | "fixed" | undefined {
  if (!type) return undefined;
  const normalized = type.toLowerCase();
  if (normalized === "percentage") return "percentage";
  if (normalized === "fixed") return "fixed";
  return undefined;
}

/** Endirimin aktiv olub-olmadığını yoxlayır (discountType normalizasiyası ilə) */
export function isDiscountActive(p: Product, at: Date = new Date()): boolean {
  if (!p.discountType || !p.discountValue) return false;

  // discountType normalizasiya
  const type = normalizeDiscountType(p.discountType as string);
  if (!type) return false;

  if (p.discountStart && p.discountEnd) {
    const start = new Date(p.discountStart);
    const end = new Date(p.discountEnd);
    return at >= start && at <= end;
  }
  return true;
}

/**
 * Tək qiymət üzərindən yekun qiyməti hesablayır.
 * discountType normalizasiyası burada da tətbiq olunur.
 */
export function finalPrice(
  base: number,
  type?: string | null,
  value?: number | null
): number {
  const normalizedType = normalizeDiscountType(type);
  if (!normalizedType || !value) return +base.toFixed(2);
  const result = normalizedType === "percentage"
    ? base * (1 - value / 100)
    : Math.max(base - value, 0);
  return +result.toFixed(2);
}

/** Variantın endirimli qiyməti (discountType normalizasiyası ilə) */
export function variantFinalPrice(p: Product, v: Variant, at: Date = new Date()): number {
  const base = v.price ?? 0;
  if (!isDiscountActive(p, at)) return +base.toFixed(2);
  const val = p.discountValue ?? 0;
  return finalPrice(base, p.discountType as string, val);
}

/** Məhsulun ümumi qiymət diapazonu (BASE Price) */
export function priceRange(p: Product): { min: number; max: number } {
  const prices = (p.variants || []).map((v) => v.price);
  if (!prices.length) return { min: p.price ?? 0, max: p.price ?? 0 };
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max };
}

/** Məhsulun mağaza vitrinində göstəriləcək qiyməti (Ən aşağı endirimli qiymət) */
export function productDisplayPrice(p: Product, at: Date = new Date()): number {
  if (!p.variants || p.variants.length === 0) {
    return finalPrice(p.price ?? 0, p.discountType as string, p.discountValue);
  }

  const prices = p.variants.map(v => variantFinalPrice(p, v, at));
  return Math.min(...prices);
}

/** Məhsulun ən aşağı BAŞLANĞIC (endirimdən əvvəlki) qiyməti */
export function minPrice(p: Product): number {
  if (!p.variants || p.variants.length === 0) {
    return p.price ?? 0;
  }
  const prices = p.variants.map(v => v.price ?? 0);
  return Math.min(...prices);
}

// ============================================================
// 5. STOK & INVENTORY FUNKSİYALARI
// ============================================================
export function productTotalStock(p: Product): number {
  return (p.variants || []).reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

export function lowStockProducts(products: Product[], threshold = 10): Product[] {
  return products.filter((p) => productTotalStock(p) < (p.minStock ?? threshold));
}

export function getStockStatusColor(stock: number, minStock: number): 'green' | 'orange' | 'red' {
  if (stock <= 0) return 'red';
  if (stock <= minStock) return 'orange';
  if (stock < minStock * 2) return 'orange';
  return 'green';
}

export function getFreshnessColor(p: Product, v: Variant): 'green' | 'yellow' | 'red' {
  const shelfLife = p.shelfLifeDays ?? 0;
  if (shelfLife <= 0 || !v.batchDate) return 'green';

  const age = batchAgeInDays(v.batchDate);
  const remainingDays = shelfLife - age;

  if (remainingDays <= 0) return 'red';
  if (remainingDays <= shelfLife * 0.25) return 'yellow';

  return 'green';
}

// ============================================================
// 6. RƏY VƏ REYTİNQ HESABLAMASI
// ============================================================
export function avgRating(p: Product): number {
  const reviews = (p.reviews || []).filter((r) => r.approved);
  return reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
    : 0;
}

export function topRatedProducts(products: Product[], count = 5): Product[] {
  return [...products]
    .sort((a, b) => avgRating(b) - avgRating(a))
    .slice(0, count);
}

// ============================================================
// 7. SİFARİŞLƏRİ GÜNƏ GÖRƏ QRUPLA
// ============================================================
export function bucketByDay(orders: Order[]): Record<string, Order[]> {
  const map = new Map<string, Order[]>();
  for (const o of orders) {
    const day = new Date(o.createdAt).toISOString().split("T")[0];
    if (!day) continue;
    if (!map.has(day)) {
      map.set(day, []);
    }
    const existing = map.get(day);
    if (existing) {
      existing.push(o);
    }
  }
  return Object.fromEntries(map);
}

// ============================================================
// 8. ORQANİK FAİZİ
// ============================================================
export function organicRatio(products: Product[]): number {
  if (!products.length) return 0;
  const organicCount = products.filter((p) => p.statusTags?.includes('organic')).length;
  return +(organicCount / products.length * 100).toFixed(1);
}

// ============================================================
// 9. KPI-lar
// ============================================================
export function kpis(orders: Order[], products: Product[]): KPI {
  const revenue: number = orders.reduce(
    (sum: number, o: Order) => sum + Number(o.total ?? 0),
    0
  );

  const cost = 0;
  const profit = +(revenue - cost).toFixed(2);

  let totalStockCost = 0;
  let potentialRevenue = 0;
  let expiredSoon = 0;
  let lowStockCount = 0;

  for (const p of products) {
    const variants = p.variants?.length ? p.variants : [{
      id: p.id,
      name: p.name,
      price: p.price ?? 0,
      costPrice: p.costPrice ?? 0,
      stock: p.variants?.[0]?.stock ?? 0,
      minStock: p.variants?.[0]?.minStock ?? 0,
      batchDate: p.variants?.[0]?.batchDate ?? p.createdAt,
      grade: 'Unsorted' as ProductGrade,
    } as Variant];

    for (const v of variants) {
      const itemCost = v.costPrice ?? p.costPrice ?? 0;
      const itemPrice = v.price ?? p.price ?? 0;
      const stockQty = v.stock ?? 0;
      const minStockQty = v.minStock ?? 0;

      totalStockCost += itemCost * stockQty;
      potentialRevenue += itemPrice * stockQty;

      if (stockQty > 0 && stockQty <= minStockQty) {
        lowStockCount++;
      }

      if (p.shelfLifeDays && v.batchDate && isExpiringSoon(v, p.shelfLifeDays)) {
        expiredSoon++;
      }
    }
  }

  const potentialProfit = +(potentialRevenue - totalStockCost).toFixed(2);
  const totalProducts = products.length;
  const totalOrders = orders.length;

  const pending = orders.filter((o) => o.status === "PENDING").length;
  const delivered = orders.filter((o) => o.status === "DELIVERED").length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;

  const avgRatingAll = products.length
    ? products.reduce((sum, p) => sum + avgRating(p), 0) / products.length
    : 0;

  const activeDiscounts = products.filter((p) => isDiscountActive(p)).length;
  const topRated = topRatedProducts(products, 5);

  return {
    totalProducts,
    totalOrders,
    ordersByStatus: { pending, delivered, cancelled },
    totals: {
      revenue: +revenue.toFixed(2),
      cost: +cost.toFixed(2),
      profit,
    },
    avgRating: +avgRatingAll.toFixed(2),
    lowStock: lowStockCount,
    activeDiscounts,
    topRated,
    totalStockCost: +totalStockCost.toFixed(2),
    potentialRevenue: +potentialRevenue.toFixed(2),
    potentialProfit: potentialProfit,
    expiredSoon,
  };
}

// ============================================================
// 10. ƏLAVƏ ANALİTİK FUNKSİYALAR
// ============================================================
export const DELIVERY_RATES = [
  { min: 0, max: 10, pct: 25 },
  { min: 10, max: 30, pct: 20 },
  { min: 30, max: 50, pct: 15 },
  { min: 50, max: 100, pct: 10 },
  { min: 100, max: Infinity, pct: 5 },
];

export function calculateDeliveryFee(total: number) {
  for (const rate of DELIVERY_RATES) {
    if (total >= rate.min && total < rate.max) return +(total * (rate.pct / 100)).toFixed(2);
  }
  return +(total * 0.05).toFixed(2);
}

export function getDeliveryPercentage(total: number) {
  for (const rate of DELIVERY_RATES) {
    if (total >= rate.min && total < rate.max) return rate.pct;
  }
  return 5;
}

export function priceTrend(p: Product): "increasing" | "decreasing" | "stable" {
  if (!p.variants || p.variants.length < 2) return "stable";
  const diffs = p.variants.map((v, i, arr) =>
    i === 0 ? 0 : (v.price ?? 0) - ((arr[i - 1]?.price) ?? 0)
  );
  const avgDiff = diffs.reduce((s, d) => s + d, 0) / (diffs.length || 1);
  if (avgDiff > 0.5) return "increasing";
  if (avgDiff < -0.5) return "decreasing";
  return "stable";
}

export function avgDiscount(products: Product[]): number {
  const active = products.filter((p) => isDiscountActive(p));
  if (!active.length) return 0;
  const total = active.reduce(
    (sum, p) => sum + (normalizeDiscountType(p.discountType as string) === 'percentage' ? (p.discountValue ?? 0) : 0),
    0
  );
  return +(total / active.length).toFixed(1);
}

export function salesByRegion(_products: Product[], _orders: Order[]) {
  return [];
}

export function monthlyRevenue(orders: Order[]) {
  const map = new Map<string, number>();
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 7);
    const amount = Number(o.total ?? 0);
    map.set(key, (map.get(key) ?? 0) + amount);
  }
  return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
}

export function topSellingProducts(_products: Product[], _orders: Order[]) {
  return [];
}

export function advancedMetrics(products: Product[], orders: Order[]) {
  const base = kpis(orders, products);
  const organic = organicRatio(products);
  const avgDisc = avgDiscount(products);
  const monthly = monthlyRevenue(orders);
  const regions = salesByRegion(products, orders);
  const topSelling = topSellingProducts(products, orders);
  return {
    ...base.ordersByStatus,
    ...base.totals,
    totalProducts: base.totalProducts,
    totalOrders: base.totalOrders,
    totalStockCost: base.totalStockCost,
    potentialRevenue: base.potentialRevenue,
    potentialProfit: base.potentialProfit,
    avgRating: base.avgRating,
    lowStock: base.lowStock,
    expiredSoon: base.expiredSoon,
    activeDiscounts: base.activeDiscounts,
    organicRatio: organic,
    avgDiscount: avgDisc,
    monthlyRevenue: monthly,
    salesByRegion: regions,
    topSelling: topSelling,
  };
}