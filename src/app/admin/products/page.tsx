// src/app/admin/products/page.tsx
'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  AlertTriangle,
  Archive,
  PackageSearch,
  Filter,
  Sparkles,
  LayoutGrid,
  Rows3,
  SlidersHorizontal,
  X,
  Percent,
  Layers,
  Star,
  BadgeDollarSign,
} from 'lucide-react';

import { useApp, useHasHydrated } from '@/lib/store';

import { Input } from '@/components/atoms/input';
import { Select } from '@/components/atoms/select';
import { Button } from '@/components/atoms/button';
import { ProductCard } from '@/components/admin/products/ProductCard';
import { useProductFilters, FilterState } from '@/lib/utils/useProductFilter';
import ProductEditModal from '@/components/admin/products/ProductEditModal';
import { SkeletonGrid } from '@/components/admin/molecules/SkeletonGrid';
import { ProductStatistic } from '@/components/admin/products/ProductStatistic';
import { ID, Product, ProductCardViewMode } from '@/types/products';

// SSR-safe ID
function cryptoIdSafe(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

// Yeni məhsul üçün stub (Product schema ilə uyğun)
export const newProductStub: Partial<Product> = {
  name: 'Yeni Məhsul',
  slug: '',
  description: '',
  categoryId: '',
  tags: ['organik'],
  images: [],
  variants: [
    {
      id: '',
      name: 'Standart',
      price: 0,
      stock: 0,
      costPrice: 0,
      arrivalCost: 0,
      unit: 'ədəd',
      grade: 'A',
      minStock: 10,
      batchDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    },
  ],
  unit: 'ədəd',
  grade: 'A',
  minStock: 10,
  price: 0,
  reviews: [],
  statusTags: ['newArrival'],
  createdAt: new Date().toISOString(),
  archived: false,
};


export default function AdminProducts() {
  const [viewMode, setViewMode] = useState<ProductCardViewMode>('grid');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    categoryId: '',
    showArchived: false,
    stockFilter: 'all',
    discountOnly: false,
    minPrice: '',
    maxPrice: '',
    minRating: '',
    sortKey: 'newest',
  });

  const hydrated = useHasHydrated();

  const products = useApp((state) => state.products || []);
  const categories = useApp((state) => state.categories);
  const archiveProduct = useApp((s) => s.archiveProduct);
  const unarchiveProduct = useApp((s) => s.unarchiveProduct);

  const filteredProducts = useProductFilters(products, filters);

  const categoryMap = useMemo(
    () =>
      categories.reduce(
        (map, c) => ({ ...map, [c.id]: c.name }),
        {} as Record<ID, string>,
      ),
    [categories],
  );

  const activeProductCount = useMemo(
    () => products.filter((p) => !p.archived).length,
    [products],
  );

  const archivedProductCount = useMemo(
    () => products.filter((p) => p.archived).length,
    [products],
  );

  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const handleResetAdvanced = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      stockFilter: 'all',
      discountOnly: false,
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortKey: 'newest',
    }));
  }, []);

  const handleSetEditingProduct = useCallback(
    (p: Product | null) => setEditingProduct(p),
    [],
  );

  const handleArchiveProduct = useCallback(
    (id: ID) => archiveProduct(id),
    [archiveProduct],
  );

  const handleUnarchiveProduct = useCallback(
    (id: ID) => unarchiveProduct(id),
    [unarchiveProduct],
  );

  const handleCreateNew = () => {
    const now = new Date().toISOString();
    const id1 = cryptoIdSafe();
    const id2 = cryptoIdSafe();

    const baseSlug = (filters.searchTerm || 'yeni-mehsul')
      .toLowerCase()
      .replace(/[^\wşəğüçıö\s-]/gi, ' ')
      .trim()
      .replace(/\s+/g, '-') || 'yeni-mehsul';

    const fresh: Product = {
      ...(newProductStub as Product),
      id: id1,
      name: 'Yeni Məhsul',
      slug: `${baseSlug}-${id2.slice(0, 6)}`,
      createdAt: now,
      reviews: [],
      images: [],
      variants: [
        {
          id: cryptoIdSafe(),
          name: 'Standart',
          price: 0,
          stock: 0,
          costPrice: 0,
          arrivalCost: 0,
          unit: 'ədəd',
          grade: 'A',
          minStock: 10,
          batchDate: now.split('T')[0],
          createdAt: now,
        },
      ],
      archived: false,
    };

    setEditingProduct(fresh);
  };

  const showSkeleton = !hydrated;

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-emerald-50 via-slate-50 to-white">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-emerald-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
              <Sparkles className="h-4 w-4" />
              Admin · Məhsullar
            </div>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-slate-900 md:text-3xl">
              <PackageSearch className="h-7 w-7 text-emerald-600" />
              Məhsulların İdarə Edilməsi
            </h1>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-2xl bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 shadow-inner">
              Aktiv: <span className="font-bold">{activeProductCount}</span> ·
              Arxiv: <span className="font-bold">{archivedProductCount}</span>
            </div>

            <Button variant="primary" onClick={handleCreateNew}>
              <Plus className="h-4 w-4" />
              <span>Yeni Məhsul</span>
            </Button>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-20 pt-4 md:px-6 md:pt-6">
        {/* GLOBAL ANALYTICS PANEL */}
       <ProductStatistic/>

        {/* FILTER SECTION */}
        <section className="rounded-3xl border border-emerald-100 bg-white/85 p-4 shadow-xl shadow-emerald-50 backdrop-blur-md md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center w-full ">
            <Input
    label="Məhsul Axtarışı"
    name="productSearch"
    value={filters.searchTerm}
    onChange={(value) => handleFilterChange('searchTerm', value)} // 👈🏻 Düzəliş buradadır.
    placeholder="Ad, teq, slug və təsvir üzrə axtar..."
    icon={<Search className="h-4 w-4" />}
    className="flex-1 w-80"
/>

            <Select
              label="Kateqoriya"
              name="categoryFilter"
              value={filters.categoryId}
              onChange={(e) =>
                handleFilterChange('categoryId', e.target.value as ID | '')
              }
              options={[
                { value: '', label: 'Bütün kateqoriyalar' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              icon={<Filter className="h-4 w-4" />}
              className="w-full md:w-64"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-emerald-100 pt-3 text-xs md:text-sm">
            <div className="inline-flex gap-2 rounded-2xl bg-emerald-50 px-2 py-1 font-medium text-emerald-800 shadow-inner">
              <button
                type="button"
                onClick={() => handleFilterChange('showArchived', false)}
                className={`rounded-xl px-3 py-1 transition ${
                  !filters.showArchived
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-transparent text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Aktiv ({activeProductCount})
              </button>
              <button
                type="button"
                onClick={() => handleFilterChange('showArchived', true)}
                className={`rounded-xl px-3 py-1 transition ${
                  filters.showArchived
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-transparent text-rose-700 hover:bg-rose-100'
                }`}
              >
                <Archive className="mr-1 inline-block h-3 w-3" />
                Arxivdə ({archivedProductCount})
              </button>
            </div>

            <div className="ml-auto inline-flex items-center gap-1 rounded-2xl bg-slate-50 px-1 py-1 shadow-inner">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-xs font-semibold transition ${
                  viewMode === 'grid'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-xs font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Rows3 className="h-4 w-4" />
                List
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAdvancedOpen((v) => !v)}
              className="inline-flex items-center gap-1 rounded-2xl bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-700 shadow-inner hover:bg-slate-100 md:text-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Ətraflı filtr
            </button>

            <p className="text-[11px] text-slate-500 md:text-xs">
              Göstərilən məhsul sayı:{' '}
              <span className="font-semibold text-slate-900">
                {filteredProducts.length}
              </span>
            </p>
          </div>

          <AnimatePresence initial={false}>
            {advancedOpen && (
              <motion.div
                key="advanced"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-700 shadow-inner md:p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Ətraflı filtr parametrləri
                  </p>
                  <button
                    type="button"
                    onClick={handleResetAdvanced}
                    className="inline-flex items-center gap-1 rounded-xl bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    <X className="h-3 w-3" />
                    Sıfırla
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  {/* Price range */}
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                      <BadgeDollarSign className="h-3.5 w-3.5 text-emerald-600" />
                      Qiymət aralığı (AZN)
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange('minPrice', e.target.value)
                        }
                      />
                      <input
                        type="number"
                        min={0}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange('maxPrice', e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* Stock filter */}
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                      <Layers className="h-3.5 w-3.5 text-emerald-600" />
                      Stok statusu
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        ['all', 'Hamısı'],
                        ['in_stock', 'Stokda'],
                        ['low_stock', 'Az stok'],
                        ['out_of_stock', 'Stoksuz'],
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            handleFilterChange(
                              'stockFilter',
                              value as FilterState['stockFilter'],
                            )
                          }
                          className={`rounded-xl px-2 py-1 text-[11px] font-medium transition ${
                            filters.stockFilter === value
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Discount / rating */}
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                      <Percent className="h-3.5 w-3.5 text-pink-600" />
                      Endirim & reytinq
                    </p>
                    <div className="flex flex-col gap-2">
                      <label className="inline-flex items-center gap-1 text-[11px]">
                        <input
                          type="checkbox"
                          className="h-3 w-3 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          checked={filters.discountOnly}
                          onChange={(e) =>
                            handleFilterChange('discountOnly', e.target.checked)
                          }
                        />
                        <span>Yalnız endirimdə olanlar</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        <input
                          type="number"
                          min={0}
                          max={5}
                          step={0.1}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="Min reytinq (0-5)"
                          value={filters.minRating}
                          onChange={(e) =>
                            handleFilterChange('minRating', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                      <Filter className="h-3.5 w-3.5 text-slate-700" />
                      Sortlama
                    </p>
                    <select
                      className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-[11px] shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      value={filters.sortKey}
                      onChange={(e) =>
                        handleFilterChange(
                          'sortKey',
                          e.target.value as FilterState['sortKey'],
                        )
                      }
                    >
                      <option value="newest">Ən yenilər</option>
                      <option value="price_asc">Qiymət: artan</option>
                      <option value="price_desc">Qiymət: azalan</option>
                      <option value="rating">Reytinq</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* MOBILE view toggle + new button */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-50 px-1 py-1 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1 rounded-2xl px-2 py-1 text-[11px] font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Rows3 className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Yeni
          </Button>
        </div>

        {/* PRODUCT LIST / SKELETON */}
        <section className="min-h-80">
          {showSkeleton ? (
            <SkeletonGrid viewMode={viewMode} />
          ) : (
            <motion.div layout>
              <AnimatePresence mode="wait">
                {filteredProducts.length > 0 ? (
                  <motion.div
                    key={`product-${viewMode}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.22 }}
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4'
                        : 'space-y-3'
                    }
                  >
                    <AnimatePresence>
                      {filteredProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          p={p}
                          categoryMap={categoryMap}
                          setEditingProduct={handleSetEditingProduct}
                          archiveProduct={handleArchiveProduct}
                          unarchiveProduct={handleUnarchiveProduct}
                          viewMode={viewMode}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center shadow-sm"
                  >
                    <AlertTriangle className="mb-4 h-14 w-14 text-amber-500" />
                    <h3 className="mb-2 text-2xl font-bold text-slate-900">
                      Məhsul tapılmadı
                    </h3>
                    <p className="mb-6 max-w-md text-sm text-slate-500">
                      Cari filtrlərə uyğun məhsul yoxdur. Filtrləri dəyişdirə və
                      ya birbaşa yeni məhsul yarada bilərsiniz.
                    </p>
                    <Button variant="primary" onClick={handleCreateNew}>
                      <Plus className="h-4 w-4" />
                      Yeni Məhsul Yarat
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </section>

        {/* FLOATING ACTION – mobile */}
        <Button
          type="button"
          variant="primary"
          onClick={handleCreateNew}
          className="fixed bottom-6 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full shadow-lg shadow-emerald-400/40 md:hidden"
        >
          <Plus className="h-6 w-6" />
        </Button>

        {/* EDIT MODAL */}
        <AnimatePresence>
          {editingProduct && (
            <ProductEditModal
              key={editingProduct.id}
              initial={editingProduct}
              open={!!editingProduct}
              onClose={() => setEditingProduct(null)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
