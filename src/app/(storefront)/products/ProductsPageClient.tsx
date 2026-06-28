'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/store';
import {
  Search,
  BadgePercent,
  X,
  Leaf,
  Filter,
  Sparkles,
  Mountain,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RusticProductCard } from '@/components/ui/organisms/RusticProductCard';
import { debounce } from 'lodash';

// ──────────────────────────────────────────────────────────────────
// Helper funksiyalar
// ──────────────────────────────────────────────────────────────────

// Animasiya variantları
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ──────────────────────────────────────────────────────────────────
// Əsas səhifə komponenti
// ──────────────────────────────────────────────────────────────────
export function ProductsPageClient({ initialData }: { initialData?: { products: any[]; categories: any[] } }) {
  const {
    products,
    categories,
    productPriceNow,
    isDiscountActive,
    addToCart,
    storefrontConfig,
    _hasHydrated,
  } = useApp();

  const currency = storefrontConfig?.currency || 'AZN';

  // ── Filter state-ləri (reytinq yoxdur) ─────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [organicOnly, setOrganicOnly] = useState(false);
  const [sortBy, setSortBy] = useState<
    'recent' | 'popular' | 'price_asc' | 'price_desc'
  >('recent');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const debouncedSetSearch = useCallback(
    debounce((value: string) => setDebouncedSearch(value), 300),
    []
  );

  // ── Hydrate store with initial data from server ─────────────────
  useEffect(() => {
    if (initialData) {
      const { setProducts, setCategories } = useApp.getState();
      setProducts(initialData.products);
      setCategories(initialData.categories);
    }
  }, [initialData]);

  useEffect(() => {
    debouncedSetSearch(searchTerm);
    return () => debouncedSetSearch.cancel();
  }, [searchTerm, debouncedSetSearch]);

  // ── URL sync (opsional) ────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (selectedCategory !== 'all') params.set('cat', selectedCategory);
    if (inStockOnly) params.set('stock', '1');
    if (discountOnly) params.set('sale', '1');
    if (organicOnly) params.set('org', '1');
    if (minPrice > 0) params.set('min', String(minPrice));
    if (maxPrice < 500) params.set('max', String(maxPrice));
    if (sortBy !== 'recent') params.set('sort', sortBy);
    const query = params.toString();
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
  }, [debouncedSearch, selectedCategory, inStockOnly, discountOnly, organicOnly, minPrice, maxPrice, sortBy]);

  // ── Filtrlənmiş və sıralanmış məhsullar (reytinqsiz) ───────────
  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => !p.archived);

    // Axtarış
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.tags?.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Kateqoriya
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    // Qiymət aralığı
    list = list.filter((p) => {
      const price = productPriceNow(p);
      return price >= minPrice && price <= maxPrice;
    });

    // Stok
    if (inStockOnly) {
      list = list.filter((p) => {
        const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock ?? 0), 0) ?? p.stock ?? 0;
        return totalStock > 0;
      });
    }

    // Endirim
    if (discountOnly) list = list.filter((p) => isDiscountActive(p));

    // Organik
    if (organicOnly) list = list.filter((p) => p.isOrganic);

    // Sıralama (reytinq yoxdur)
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => productPriceNow(a) - productPriceNow(b));
        break;
      case 'price_desc':
        list.sort((a, b) => productPriceNow(b) - productPriceNow(a));
        break;
      case 'popular':
        list.sort((a, b) => {
          const fa = a.featured ? 1 : 0;
          const fb = b.featured ? 1 : 0;
          if (fa !== fb) return fb - fa;
          // İkinci dərəcəli sıralama – satış sayı (yoxdursa, id)
          return (b.soldCount || 0) - (a.soldCount || 0);
        });
        break;
      default: // recent
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [
    products,
    debouncedSearch,
    selectedCategory,
    minPrice,
    maxPrice,
    inStockOnly,
    discountOnly,
    organicOnly,
    sortBy,
    productPriceNow,
    isDiscountActive,
  ]);

  // ── Statistik məlumatlar (yuxarı banner üçün) ──────────────────
  const stats = useMemo(() => {
    const total = filteredProducts.length;
    const organicCount = filteredProducts.filter((p) => p.isOrganic).length;
    const discountedCount = filteredProducts.filter((p) => isDiscountActive(p)).length;
    let avgSaving = 0;
    let savingItems = 0;
    filteredProducts.forEach((p) => {
      const variant = p.variants?.[0];
      const base = variant?.price ?? 0;
      if (base && isDiscountActive(p)) {
        const now = productPriceNow(p);
        if (now < base) {
          avgSaving += base - now;
          savingItems++;
        }
      }
    });
    avgSaving = savingItems > 0 ? avgSaving / savingItems : 0;
    return { total, organicCount, discountedCount, avgSaving };
  }, [filteredProducts, isDiscountActive, productPriceNow]);

  // ── Aktiv filtrlərin sayı ──────────────────────────────────────
  const activeFiltersCount = [
    debouncedSearch !== '',
    selectedCategory !== 'all',
    minPrice > 0 || maxPrice < 500,
    inStockOnly,
    discountOnly,
    organicOnly,
  ].filter(Boolean).length;

  // ── Bütün filtrləri sıfırla ────────────────────────────────────
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice(0);
    setMaxPrice(500);
    setInStockOnly(false);
    setDiscountOnly(false);
    setOrganicOnly(false);
    setSortBy('recent');
  };

  // ────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {!_hasHydrated && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-slate-600">Yüklənir...</p>
          </div>
        </div>
      )}
      {/* Təbii dağ siluetləri (arxa plan) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <svg className="absolute bottom-0 left-0 w-full h-48 opacity-10" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path fill="#064e3b" fillOpacity="0.2" d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,176C960,160,1056,160,1152,170.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        <svg className="absolute top-20 right-0 w-96 h-96 opacity-5" viewBox="0 0 200 200">
          <path fill="#0f5c3c" d="M100,0 L130,50 L180,50 L140,80 L160,130 L100,100 L40,130 L60,80 L20,50 L70,50 Z" />
        </svg>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        {/* ── Başlıq və statistik banner (təbii motivli) ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-10 overflow-hidden rounded-3xl bg-white/60 backdrop-blur-sm p-6 shadow-xl shadow-emerald-100/30"
        >
          {/* Təbii dekorativ elementlər */}
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-100/20 blur-3xl" />
          <div className="absolute bottom-4 right-8 text-emerald-100/40">
            <Mountain className="h-24 w-24" strokeWidth={0.5} />
          </div>
          <div className="absolute left-6 top-6 rotate-12 text-emerald-100/40">
            <Leaf className="h-12 w-12" strokeWidth={0.5} />
          </div>

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Gədəbəy dağlarından birbaşa
              </div>
              <h1 className="text-3xl font-black tracking-tight text-emerald-900 md:text-4xl">
                Təbii məhsullar kataloqu
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Ən təzə, ən keyfiyyətli kənd məhsullarını kəşf edin. Hamısı sertifikatlı,
                heç bir kimyəvi qatqısız.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-emerald-50/80 px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-2xl font-black text-emerald-800">{stats.total}</p>
                <p className="text-[10px] font-semibold uppercase text-emerald-600">Məhsul</p>
              </div>
              <div className="rounded-2xl bg-lime-50/80 px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-2xl font-black text-lime-800">{stats.organicCount}</p>
                <p className="text-[10px] font-semibold uppercase text-lime-600">Organik</p>
              </div>
              <div className="rounded-2xl bg-rose-50/80 px-4 py-2 text-center backdrop-blur-sm">
                <p className="text-2xl font-black text-rose-800">{stats.discountedCount}</p>
                <p className="text-[10px] font-semibold uppercase text-rose-600">Endirim</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Desktop Filter Panel (reytinq yoxdur) ── */}
        <div className="mb-8 hidden rounded-3xl bg-white/70 backdrop-blur-md p-5 shadow-md shadow-emerald-50/50 lg:block">
          <div className="flex flex-wrap items-end gap-4">
            {/* Axtarış */}
            <div className="flex-1 min-w-[200px]">
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                Axtarış
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Bal, alma, pendir..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Kateqoriya */}
            <div className="w-48">
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                Kateqoriya
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-400"
              >
                <option value="all">Hamısı</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Qiymət aralığı */}
            <div className="w-64">
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                Qiymət (₼)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="w-20 rounded-xl border border-slate-200 px-2 py-2 text-center text-sm"
                  placeholder="Min"
                />
                <span>—</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-20 rounded-xl border border-slate-200 px-2 py-2 text-center text-sm"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Sıralama (reytinqsiz) */}
            <div className="w-44">
              <label className="mb-1 block text-[11px] font-semibold uppercase text-slate-500">
                Sırala
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="recent">Ən yeni</option>
                <option value="popular">Populyar</option>
                <option value="price_asc">Qiymət: artan</option>
                <option value="price_desc">Qiymət: azalan</option>
              </select>
            </div>

            {/* Filter toggles (yalnız stok, endirim, organik, mövsümi) */}
            <div className="flex flex-wrap gap-2">
              <FilterChip
                active={inStockOnly}
                onClick={() => setInStockOnly(!inStockOnly)}
                icon={Package}
                label="Stokda"
              />
              <FilterChip
                active={discountOnly}
                onClick={() => setDiscountOnly(!discountOnly)}
                icon={BadgePercent}
                label="Endirim"
              />
              <FilterChip
                active={organicOnly}
                onClick={() => setOrganicOnly(!organicOnly)}
                icon={Leaf}
                label="Organik"
              />
            </div>
          </div>

          {/* Aktiv filtrlər çipləri */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-emerald-100 pt-3">
              <span className="text-xs text-slate-500">Aktiv filtrlər:</span>
              {debouncedSearch && (
                <ActiveChip label={`"${debouncedSearch}"`} onRemove={() => setSearchTerm('')} />
              )}
              {selectedCategory !== 'all' && (
                <ActiveChip
                  label={categories.find((c) => c.id === selectedCategory)?.name || ''}
                  onRemove={() => setSelectedCategory('all')}
                />
              )}
              {(minPrice > 0 || maxPrice < 500) && (
                <ActiveChip
                  label={`${minPrice}₼ - ${maxPrice}₼`}
                  onRemove={() => {
                    setMinPrice(0);
                    setMaxPrice(500);
                  }}
                />
              )}
              {inStockOnly && <ActiveChip label="Stokda" onRemove={() => setInStockOnly(false)} />}
              {discountOnly && <ActiveChip label="Endirim" onRemove={() => setDiscountOnly(false)} />}
              {organicOnly && <ActiveChip label="Organik" onRemove={() => setOrganicOnly(false)} />}
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold text-emerald-600 hover:underline"
              >
                Hamısını təmizlə
              </button>
            </div>
          )}
        </div>

        {/* ── Mobil Filter Button ── */}
        <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Axtar..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm"
            />
          </div>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md"
          >
            <Filter className="h-4 w-4" />
            Filtr
            {activeFiltersCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-emerald-600">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Nəticə sayı və sort (mobil) ── */}
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-sm text-slate-500">
            <span className="font-bold text-emerald-700">{filteredProducts.length}</span> məhsul
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm"
          >
            <option value="recent">Ən yeni</option>
            <option value="popular">Populyar</option>
            <option value="price_asc">Qiymət: artan</option>
            <option value="price_desc">Qiymət: azalan</option>
          </select>
        </div>

        {/* ── Məhsul Grid ── */}
        {filteredProducts.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <RusticProductCard
                  product={product}
                  currency={currency}
                  addToCart={addToCart}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 rounded-3xl border-2 border-dashed border-emerald-200 bg-white/60 p-12 text-center backdrop-blur-sm"
          >
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h3 className="mt-4 text-xl font-bold text-slate-800">Məhsul tapılmadı</h3>
            <p className="mt-2 text-sm text-slate-500">
              Cari filtrlərə uyğun heç bir məhsul yoxdur. Filtrləri dəyişdirin.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white"
            >
              <X className="h-4 w-4" /> Filtrləri sıfırla
            </button>
          </motion.div>
        )}
      </div>

      {/* ── Mobil Filter Drawer (reytinq yoxdur) ── */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-lg font-bold text-slate-800">Filtrlər</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Kateqoriya */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Kateqoriya
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="all">Hamısı</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Qiymət aralığı */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Qiymət (₼)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Min"
                    />
                    <span>—</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Xüsusiyyətlər (reytinq yoxdur) */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                    Xüsusiyyətlər
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      active={inStockOnly}
                      onClick={() => setInStockOnly(!inStockOnly)}
                      icon={Package}
                      label="Stokda"
                    />
                    <FilterChip
                      active={discountOnly}
                      onClick={() => setDiscountOnly(!discountOnly)}
                      icon={BadgePercent}
                      label="Endirim"
                    />
                    <FilterChip
                      active={organicOnly}
                      onClick={() => setOrganicOnly(!organicOnly)}
                      icon={Leaf}
                      label="Organik"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t p-4">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-md"
                >
                  Tətbiq et ({filteredProducts.length} məhsul)
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 w-full rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-600"
                  >
                    Bütün filtrləri sıfırla
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

// ──────────────────────────────────────────────────────────────────
// Sub-komponentlər
// ──────────────────────────────────────────────────────────────────
const FilterChip = ({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
      active
        ? 'bg-emerald-600 text-white shadow-sm'
        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
    }`}
  >
    <Icon className="h-3.5 w-3.5" />
    {label}
  </button>
);

const ActiveChip = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
    {label}
    <button onClick={onRemove} className="ml-0.5 rounded-full p-0.5 hover:bg-emerald-100">
      <X className="h-3 w-3" />
    </button>
  </span>
);