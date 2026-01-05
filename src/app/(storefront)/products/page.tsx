// src/app/products/page.tsx
'use client';

import { useMemo, useState, useEffect } from 'react';

import {
  Search,
  SlidersHorizontal,
  BadgePercent,
  X,
  Package,
  Leaf,
  Zap,
  AlertTriangle,
  LayoutGrid,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useApp } from '@/lib/store';

// --- Utility: store-dakı reytinq helper-i səliqəli çağırmaq üçün ---
const getRatingAvg = (p: any) => useApp.getState().productRatingAvg(p);

// --- Animasiya variantları ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// --- Kiçik util: AZN formatı ---
const formatAzN = (n: number) =>
  `${n.toFixed(2).replace('.', ',')} ₼`;

// --- Reusable Filter Toggle Component ---
const FilterToggle = ({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: any;
  label: string;
  checked: boolean;
  onChange: (c: boolean) => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs md:text-sm font-medium transition duration-200 min-w-max
      ${
        checked
          ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-300/50'
          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
      }
    `}
  >
    <Icon className="h-4 w-4 md:h-5 md:w-5" />
    <span>{label}</span>
  </motion.button>
);

export default function ProductsPage() {
  const {
    products,
    categories,
    toggleFavorite,
    isFavorite,
    productPriceNow,
    isDiscountActive,
  } = useApp();

  // --- Local filter state-lər ---
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | string>('all');
  const [inStock, setInStock] = useState(false);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [organic, setOrganic] = useState(false);
  const [seasonal, setSeasonal] = useState(false);
  const [sort, setSort] = useState<
    'recent' | 'price_asc' | 'price_desc' | 'popular' | 'rating'
  >('recent');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- URL query sync (SEO və share üçün) ---
  useEffect(() => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (cat !== 'all') u.set('cat', cat);
    if (inStock) u.set('stock', '1');
    if (onlyDiscount) u.set('sale', '1');
    if (organic) u.set('org', '1');
    if (seasonal) u.set('ssn', '1');
    if (sort !== 'recent') u.set('sort', sort);

    const qs = u.toString();
    if (typeof window !== 'undefined') {
      window.history.replaceState(
        null,
        '',
        qs ? `?${qs}` : window.location.pathname,
      );
    }
  }, [q, cat, inStock, onlyDiscount, organic, seasonal, sort]);

  // --- Filtr + sort tətbiqi ---
  const items = useMemo(() => {
    let list = products
      .filter((p) => !p.archived)
      .filter((p) =>
        p.name.toLowerCase().includes(q.trim().toLowerCase()),
      )
      .filter((p) => (cat === 'all' ? true : p.categoryId === cat));

    if (inStock) {
      list = list.filter(
        (p) => useApp.getState().productTotalStock(p) > 0,
      );
    }
    if (onlyDiscount) {
      list = list.filter((p) => isDiscountActive(p));
    }
    if (organic) {
      list = list.filter((p) => p.organic);
    }
    if (seasonal) {
      list = list.filter((p) => p.seasonal);
    }

    // Sort
    if (sort === 'price_asc') {
      list.sort(
        (a, b) => productPriceNow(a) - productPriceNow(b),
      );
    } else if (sort === 'price_desc') {
      list.sort(
        (a, b) => productPriceNow(b) - productPriceNow(a),
      );
    } else if (sort === 'popular') {
      // featured + reytinq kombosu – “məsləhət görülənlər”
      list.sort((a, b) => {
        const fa = +(a.featured || false);
        const fb = +(b.featured || false);
        const ra = getRatingAvg(a) || 0;
        const rb = getRatingAvg(b) || 0;
        return fb - fa || rb - ra;
      });
    } else if (sort === 'rating') {
      list.sort((a, b) => getRatingAvg(b) - getRatingAvg(a));
    } else if (sort === 'recent') {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
    }

    return list;
  }, [
    products,
    q,
    cat,
    inStock,
    onlyDiscount,
    organic,
    seasonal,
    sort,
    productPriceNow,
    isDiscountActive,
  ]);

  // --- Kataloq summary statistikası (marketing üst banner üçün) ---
  const summary = useMemo(() => {
    const total = items.length;
    const organicCount = items.filter((p) => p.organic).length;
    const seasonalCount = items.filter((p) => p.seasonal).length;
    const discountCount = items.filter((p) =>
      isDiscountActive(p),
    ).length;

    // Potensial əlavə: endirimli məhsullardakı ortalama qənaət
    let savingSum = 0;
    let savingItems = 0;
    items.forEach((p) => {
      const v = p.variants?.[0];
      const base = v?.price ?? 0;
      if (!base) return;
      if (p.discountType && p.discountValue) {
        const priceNow = productPriceNow(p, v);
        const diff = base - priceNow;
        if (diff > 0) {
          savingSum += diff;
          savingItems += 1;
        }
      }
    });

    const avgSaving = savingItems > 0 ? savingSum / savingItems : 0;

    return {
      total,
      organicCount,
      seasonalCount,
      discountCount,
      avgSaving,
    };
  }, [items, isDiscountActive, productPriceNow]);


  // --- Render ---
  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12"
      >
        {/* HERO / başlıq + marketing copy */}
        <motion.section
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          className="mb-6 rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-xl shadow-emerald-50 md:mb-8 md:p-7"
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3 md:space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
                100% seçilmiş Organik Gədəbəy məhsulları
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
                  Təbii{" "}
                  <span className="bg-gradient-to-r from-emerald-600 to-lime-500 bg-clip-text text-transparent">
                    meyvə-tərəvəz
                  </span>{" "}
                  kataloqu
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 md:text-base">
                  Sağlam qidalanma üçün gündəlik təravətli məhsulları bir
                  səhifədən idarə et. Yerli kənd təsərrüfatı
                  istehsalçılarını dəstəklə, öz ailən üçün daha təmiz süfrə
                  qur.
                </p>
              </div>

              {/* Ümumi statistik kartlar */}
              <div className="grid gap-2 text-[11px] md:grid-cols-4 md:text-xs">
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-800">
                  <LayoutGrid className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {summary.total} məhsul
                    </span>
                    <span className="text-[10px] text-emerald-700/80">
                      Hazırda satışda
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-lime-50 px-3 py-2 text-lime-800">
                  <Leaf className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {summary.organicCount} organik
                    </span>
                    <span className="text-[10px] text-lime-700/80">
                      Sertifikatlı / təbii
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-amber-800">
                  <Zap className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {summary.seasonalCount} mövsümi
                    </span>
                    <span className="text-[10px] text-amber-700/80">
                      Mövsümə uyğun təkliflər
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-rose-800">
                  <BadgePercent className="h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {summary.discountCount} endirimdə
                    </span>
                    <span className="text-[10px] text-rose-700/80">
                      Orta qənaət:{" "}
                      {summary.avgSaving > 0
                        ? formatAzN(summary.avgSaving)
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sağ tərəf – trust + çatdırılma info */}
            <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-lime-500 p-4 text-xs text-emerald-50 shadow-lg md:mt-0 md:w-72">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">
                    Gəncə daxilində günə-gün çatdırılma
                  </p>
                  <p className="text-[11px] text-emerald-50/80">
                    Sifarişinizi səhər edin, gün ərzində məhsul sizdə olsun.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">
                    Məhsul keyfiyyətinə zəmanət
                  </p>
                  <p className="text-[11px] text-emerald-50/80">
                    Problem olduqda dərhal əvəzləmə və ya geri qaytarma.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">
                    Əkin sahəsindən birbaşa
                  </p>
                  <p className="text-[11px] text-emerald-50/80">
                    Gədəbəy bölgəsindən, minimum vasitəçi ilə.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Filter Section - Desktop */}
        <section className="mb-6 hidden rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-md shadow-emerald-50 lg:block md:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
            {/* Axtarış */}
            <div className="relative md:col-span-4">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-11 py-2.5 text-sm text-slate-800 shadow-inner outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Axtar: bal, alma, pomidor..."
              />
            </div>

            {/* Kateqoriya */}
            <div className="md:col-span-3">
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 shadow-inner outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                value={cat}
                onChange={(e) =>
                  setCat(e.target.value as typeof cat)
                }
              >
                <option value="all">Bütün kateqoriyalar</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sortlama */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="hidden text-[11px] font-semibold uppercase tracking-wide text-slate-400 md:block">
                  Çeşidlə:
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 shadow-inner outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  value={sort}
                  onChange={(e) =>
                    setSort(e.target.value as typeof sort)
                  }
                >
                  <option value="recent">Ən yenilər</option>
                  <option value="popular">Tövsiyə olunan</option>
                  <option value="rating">Reytinq: yüksək</option>
                  <option value="price_asc">Qiymət: artan</option>
                  <option value="price_desc">Qiymət: azalan</option>
                </select>
              </div>
            </div>

            {/* Toggle Filtrləri */}
            <div className="flex items-center justify-end gap-2 md:col-span-3">
              <FilterToggle
                icon={BadgePercent}
                label="Yalnız endirimdə"
                checked={onlyDiscount}
                onChange={setOnlyDiscount}
              />
              <FilterToggle
                icon={Leaf}
                label="Yalnız organik"
                checked={organic}
                onChange={setOrganic}
              />
              <FilterToggle
                icon={Package}
                label="Stokda olanlar"
                checked={inStock}
                onChange={setInStock}
              />
            </div>
          </div>

          {/* Aktiv filtrləri çip kimi göstərmək */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Aktiv filtrlər:
            </span>
            {!q &&
              cat === 'all' &&
              !inStock &&
              !onlyDiscount &&
              !organic &&
              !seasonal && (
                <span className="rounded-full bg-slate-50 px-2 py-0.5">
                  Heç biri seçilməyib
                </span>
              )}

            {q && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                Axtarış: “{q}”
              </span>
            )}
            {cat !== 'all' && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                Kateqoriya seçilib
              </span>
            )}
            {inStock && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                Yalnız stokda
              </span>
            )}
            {onlyDiscount && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 font-medium text-rose-700">
                Endirimli məhsullar
              </span>
            )}
            {organic && (
              <span className="rounded-full bg-lime-50 px-2 py-0.5 font-medium text-lime-700">
                Organik məhsullar
              </span>
            )}
            {seasonal && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                Mövsümi seçim
              </span>
            )}
            <span className="ml-auto text-[11px] text-slate-500">
              Göstərilən məhsul sayı:{' '}
              <span className="font-semibold text-slate-900">
                {items.length}
              </span>
            </span>
          </div>
        </section>

        {/* Mobile Filter Trigger */}
        <section className="mb-5 flex items-center justify-between rounded-2xl bg-white/95 p-3 shadow-md shadow-emerald-50 lg:hidden">
          <div className="relative mr-3 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-9 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Axtarış..."
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex items-center gap-1 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-emerald-400/40 transition hover:bg-emerald-700"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtr
          </button>
        </section>

        {/* Məhsullar grid-i */}
        <section className="min-h-[280px]">
          <motion.div
            key={
              q +
              cat +
              sort +
              String(inStock) +
              String(onlyDiscount) +
              String(organic) +
              String(seasonal)
            }
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <AnimatePresence>
              {items.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Empty state */}
          {items.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-8 rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center shadow-sm"
            >
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
              <h3 className="mb-2 text-xl font-bold text-slate-900">
                Məhsul tapılmadı
              </h3>
              <p className="mb-5 text-sm text-slate-500">
                Cari filtrlərə uyğun məhsul yoxdur. Filtrləri
                dəyişdirə və ya axtarışı təmizləyə bilərsiniz.
              </p>
              <button
                onClick={() => {
                  setQ('');
                  setCat('all');
                  setInStock(false);
                  setOnlyDiscount(false);
                  setOrganic(false);
                  setSeasonal(false);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-400/40 transition hover:bg-emerald-700"
              >
                <X className="h-4 w-4" />
                Filtrləri sıfırla
              </button>
            </motion.div>
          )}
        </section>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
                className="fixed right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white p-5 shadow-2xl"
              >
                <div className="mb-4 flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <SlidersHorizontal className="h-5 w-5 text-emerald-600" />
                      Filtrlər
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Kataloqu öz zövqünə uyğun süzgəcdən keçir.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto">
                  {/* Kateqoriya */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Kateqoriya
                    </label>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      value={cat}
                      onChange={(e) =>
                        setCat(e.target.value as typeof cat)
                      }
                    >
                      <option value="all">Bütün kateqoriyalar</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Çeşidləmə */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Çeşidləmə
                    </label>
                    <select
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                      value={sort}
                      onChange={(e) =>
                        setSort(e.target.value as typeof sort)
                      }
                    >
                      <option value="recent">Ən yenilər</option>
                      <option value="popular">Tövsiyə olunan</option>
                      <option value="rating">Reytinq: yüksək</option>
                      <option value="price_asc">
                        Qiymət: artan
                      </option>
                      <option value="price_desc">
                        Qiymət: azalan
                      </option>
                    </select>
                  </div>

                  {/* Xüsusiyyətlər */}
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Xüsusiyyətlər
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <FilterToggle
                        icon={BadgePercent}
                        label="Endirimdə"
                        checked={onlyDiscount}
                        onChange={setOnlyDiscount}
                      />
                      <FilterToggle
                        icon={Leaf}
                        label="Organik"
                        checked={organic}
                        onChange={setOrganic}
                      />
                      <FilterToggle
                        icon={Zap}
                        label="Mövsümi"
                        checked={seasonal}
                        onChange={setSeasonal}
                      />
                      <FilterToggle
                        icon={Package}
                        label="Stokda"
                        checked={inStock}
                        onChange={setInStock}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="mt-4 w-full rounded-2xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-400/40 transition hover:bg-emerald-700"
                >
                  Filtrləri tətbiq et
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
