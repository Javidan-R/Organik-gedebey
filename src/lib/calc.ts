import { ProductGrade, Variant } from "@/types/products";
import { Product } from "./store";
import { Order, KPI } from "./types";

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

/* ============================================================
   2. ZAMAN VƏ TƏZƏLİK HESABLAMA (ageInDays, batchAgeInDays, isExpiringSoon)
============================================================ */
/** Normal yaş hesablama */
export function ageInDays(from: Date | string, to: Date | string = new Date()): number {
  const f = new Date(from).getTime();
  const t = new Date(to).getTime();
  // 86400000 = 1000ms * 60s * 60m * 24h
  return Math.max(0, Math.floor((t - f) / 86400000));
}

/** Məhsul partiyasının nə qədər vaxtdır stokda olduğunu (günlərlə) tapır */
export function batchAgeInDays(batchDate: string, to: Date | string = new Date()): number {
  return ageInDays(batchDate, to);
}

/**
 * Partiyanın saxlama müddətinin 75%-ni keçdiyini yoxlayır.
 * (Təhlükəli: Saxlama müddətinin bitməsinə son 25% qalıb.)
 */
export function isExpiringSoon(v: Variant, productShelfLifeDays?: number): boolean {
    const shelfLife = productShelfLifeDays ?? 0;
    if (shelfLife <= 0 || !v.batchDate) return false;
    
    const age = batchAgeInDays(v.batchDate);
    // Əgər partiyanın yaşı ümumi saxlama müddətinin 75%-ni keçibsə
    return age >= (shelfLife * 0.75); 
}

/* ============================================================
   3. ENDİRİM & QİYMƏT LOGİKASI
============================================================ */

export function isDiscountActive(p: Product, at: Date = new Date()): boolean {
  if (!p.discountType || !p.discountValue) return false;
  // Əgər discountStart və discountEnd mövcuddursa, yoxla
  if (p.discountStart && p.discountEnd) {
    const start = new Date(p.discountStart);
    const end = new Date(p.discountEnd);
    return at >= start && at <= end;
  }
  // Yoxdursa, sadəcə dəyər olub-olmadığını yoxla
  return true; 
}

/** Tək qiymət üzərindən yekun qiyməti hesablayır */
export function finalPrice(base: number, type?: "percentage" | "fixed", value?: number): number {
  if (!type || !value) return +base.toFixed(2);
  const result = type === "percentage"
    ? base * (1 - value / 100)
    : Math.max(base - value, 0);
  return +result.toFixed(2);
}

/** Variantın endirimli qiyməti */
export function variantFinalPrice(p: Product, v: Variant, at: Date = new Date()): number {
  const base = v.price ?? 0;
  if (!isDiscountActive(p, at)) return +base.toFixed(2);
  const val = p.discountValue ?? 0;
  return finalPrice(base, p.discountType, val);
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
    return finalPrice(p.price ?? 0, p.discountType, p.discountValue);
  }
  
  // Bütün variantların yekun qiymətini tapır və ən aşağı olanı qaytarır
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

/* ============================================================
   4. STOK & INVENTORY FUNKSİYALARI (Rəng Kodlaması daxil)
============================================================ */
export function productTotalStock(p: Product): number {
  return (p.variants || []).reduce((sum, v) => sum + (v.stock ?? 0), 0);
}

/** Aşağı Stok səviyyəsində olan məhsulları tapır */
// Qeyd: Bu util indi kpis funksiyasında variant səviyyəsində yoxlanılır.
export function lowStockProducts(products: Product[], threshold = 10): Product[] {
  return products.filter((p) => productTotalStock(p) < (p.minStock ?? threshold));
}

/** Stokun vəziyyətinə görə rəng kodlaması (UI üçün) */
export function getStockStatusColor(stock: number, minStock: number): 'green' | 'orange' | 'red' {
    if (stock <= 0) return 'red';
    if (stock <= minStock) return 'orange';
    // Təhlükəli olana yaxınlaşırsa
    if (stock < minStock * 2) return 'orange'; 
    return 'green';
}

/** Təzəliyə görə rəng kodlaması (UI üçün) */
export function getFreshnessColor(p: Product, v: Variant): 'green' | 'yellow' | 'red' {
    const shelfLife = p.shelfLifeDays ?? 0;
    // Saxlama müddəti yoxdursa və ya batchDate yoxdursa, yaşıl (təhlükəsiz)
    if (shelfLife <= 0 || !v.batchDate) return 'green'; 
    
    const age = batchAgeInDays(v.batchDate);
    const remainingDays = shelfLife - age;
    
    if (remainingDays <= 0) return 'red'; // Vaxtı keçib
    // Son 25% qalanda xəbərdarlıq (Yellow Zone)
    if (remainingDays <= shelfLife * 0.25) return 'yellow'; 
    
    return 'green';
}


/* ============================================================
   5. RƏY VƏ REYTİNQ HESABLAMASI
============================================================ */
export function avgRating(p: Product): number {
  const reviews = (p.reviews || []).filter((r) => r.approved);
  return reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
}

export function topRatedProducts(products: Product[], count = 5): Product[] {
  return [...products]
    .sort((a, b) => avgRating(b) - avgRating(a))
    .slice(0, count);
}

/* ============================================================
   6. SİFARİŞLƏRİ GÜNƏ GÖRƏ QRUPLA
============================================================ */
export function bucketByDay(orders: Order[]): Record<string, Order[]> {
  return orders.reduce<Record<string, Order[]>>((acc, o) => {
    const day = o.createdAt.split("T")[0];
    if (!acc[day]) acc[day] = [];
    acc[day].push(o);
    return acc;
  }, {});
}


/* ============================================================
   7. ORQANİK FAİZİ
============================================================ */
/** Ümumi məhsul sayına görə “təbiilik faizi” */
export function organicRatio(products: Product[]): number {
  if (!products.length) return 0;
  // Organic məhsul status tag-ı ilə yoxlanır
  const organicCount = products.filter((p) => p.statusTags?.includes('organic')).length; 
  return +(organicCount / products.length * 100).toFixed(1);
}

/* ============================================================
   8. KPI-lar — genişləndirilmiş (Admin Dashboard üçün) (SON VERSİYA)
============================================================ */
export function kpis(orders: Order[], products: Product[]): KPI {
  
  // --- A. Sifariş Əsaslı Maliyyə Hesablamaları ---
  const revenue = orders.reduce(
    (sum, o) => sum + o.items.reduce((acc, it) => acc + it.priceAtOrder * it.qty, 0),
    0
  );

  // Satılmış Malların Maya Dəyəri (COGS)
  const cost = orders.reduce(
    (sum, o) =>
      sum +
      o.items.reduce(
        // costAtOrder sahəsi types.ts-də təmin edilib
        (acc, it) => acc + (it.costAtOrder ?? 0) * it.qty, 
        0
      ),
    0
  );

  const profit = +(revenue - cost).toFixed(2);
  
  // --- B. Stok Əsaslı Maliyyə & Freshness Hesablamaları ---
  let totalStockCost = 0;
  let potentialRevenue = 0;
  let expiredSoon = 0; 
  let lowStockCount = 0; 

  for (const p of products) {
    // Məhsulun variantları yoxdursa, onu tək bir variant kimi işləmək üçün placeholder.
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
        
        // isExpiringSoon funksiyası burada istifadə olunur (2. bölmə)
        if (p.shelfLifeDays && v.batchDate && isExpiringSoon(v, p.shelfLifeDays)) {
            expiredSoon++;
        }
    }
  }

  const potentialProfit = +(potentialRevenue - totalStockCost).toFixed(2);
  
  // --- C. Ümumi Statistika ---
  const totalProducts = products.length;
  const totalOrders = orders.length;

  const pending = orders.filter((o) => o.status === "pending").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  const avgRatingAll = products.length
    ? products.reduce((sum, p) => sum + avgRating(p), 0) / products.length
    : 0;

  const activeDiscounts = products.filter((p) => isDiscountActive(p)).length;
  const topRated = topRatedProducts(products, 5);

  // DİQQƏT: Artıq KPI tipinə uyğun olaraq nested obyektlər qaytarılır
  return {
    totalProducts,
    totalOrders,
    
    ordersByStatus: { pending, delivered, cancelled },
    
    totals: { 
      revenue: +revenue.toFixed(2), 
      cost: +cost.toFixed(2), 
      profit
    },
    
    avgRating: +avgRatingAll.toFixed(2),
    lowStock: lowStockCount, 
    activeDiscounts,
    topRated, // Array qaytarır

    // Yeni Maliyyə Metrikaları
    totalStockCost: +totalStockCost.toFixed(2),
    potentialRevenue: +potentialRevenue.toFixed(2),
    potentialProfit: potentialProfit,
    expiredSoon,
  };
}

/* ============================================================
   9. ƏLAVƏ ANALİTİK FUNKSİYALAR
============================================================ */

/** Məhsulun qiymət artımı / azalma trendləri (Bu funksiya dəyişməz qalır, amma diqqətli olun: variantların tarixçəsini yoxlamır) */
export function priceTrend(p: Product): "increasing" | "decreasing" | "stable" {
  // Qeyd: Bu, sadəcə variantların sırasına baxır, real tarixçəyə deyil.
  if (!p.variants || p.variants.length < 2) return "stable";
  const diffs = p.variants.map((v, i, arr) =>
    i === 0 ? 0 : v.price - arr[i - 1].price
  );
  const avgDiff = diffs.reduce((s, d) => s + d, 0) / (diffs.length || 1);
  if (avgDiff > 0.5) return "increasing";
  if (avgDiff < -0.5) return "decreasing";
  return "stable";
}

/** Aktiv endirimdə olan məhsulların orta endirim faizi */
export function avgDiscount(products: Product[]): number {
  const active = products.filter((p) => isDiscountActive(p))
  if (!active.length) return 0;
  const total = active.reduce(
    (sum, p) => sum + (p.discountType === 'percentage' ? (p.discountValue ?? 0) : 0),
    0
  );
  return +(total / active.length).toFixed(1);
}

/** Satışların region üzrə qruplaşdırılması */
export function salesByRegion(products: Product[], orders: Order[]) {
  const regionMap: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod?.originRegion) continue; // originRegion sahəsinin Product-da olduğunu güman edirik
      regionMap[prod.originRegion] = (regionMap[prod.originRegion] || 0) + item.qty;
    }
  }
  return Object.entries(regionMap).map(([region, qty]) => ({ region, qty }));
}

/** Aylıq gəlir bölünməsi (monthly breakdown) */
export function monthlyRevenue(orders: Order[]) {
  const map = new Map<string, number>();
  for (const o of orders) {
    const key = o.createdAt.slice(0, 7); // YYYY-MM
    const amount = o.items.reduce((s, it) => s + it.priceAtOrder * it.qty, 0);
    map.set(key, (map.get(key) ?? 0) + amount);
  }
  return Array.from(map.entries()).map(([month, revenue]) => ({ month, revenue }));
}

/** Top 5 ən çox satılan məhsul */
export function topSellingProducts(products: Product[], orders: Order[]) {
  const map = new Map<string, number>();
  for (const o of orders) {
    for (const it of o.items) {
      map.set(it.productId, (map.get(it.productId) ?? 0) + it.qty);
    }
  }
  const ranked = Array.from(map.entries())
    .map(([productId, qty]) => ({
      id: productId,
      name: products.find((p) => p.id === productId)?.name ?? "Naməlum",
      qty,
    }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  return ranked;
}

/** “Smart KPI Overview” — bütün hesabatların birləşdirilmiş strukturu */
export function advancedMetrics(products: Product[], orders: Order[]) {
  const base = kpis(orders, products);
  const organic = organicRatio(products);
  const avgDisc = avgDiscount(products);
  const monthly = monthlyRevenue(orders);
  const regions = salesByRegion(products, orders);
  const topSellers = topSellingProducts(products, orders);

  return {
    ...base.ordersByStatus,
    ...base.totals,
    // Yeni Maliyyə
    totalStockCost: base.totalStockCost,
    potentialRevenue: base.potentialRevenue,
    potentialProfit: base.potentialProfit,
    // Keyfiyyət/Stok
    avgRating: base.avgRating,
    lowStock: base.lowStock,
    expiredSoon: base.expiredSoon, // Yeni əlavə
    activeDiscounts: base.activeDiscounts,
    organicRatio: organic,
    avgDiscount: avgDisc,
    // Trendlər
    monthlyRevenue: monthly,
    salesByRegion: regions,
    topSelling: topSellers,
    // Digər
    totalProducts: base.totalProducts,
    totalOrders: base.totalOrders,
  };
}