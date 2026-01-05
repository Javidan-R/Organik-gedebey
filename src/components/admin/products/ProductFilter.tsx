import { ID, Product, useApp } from "@/lib/store";
import { FilterState, useProductFilters } from "@/lib/utils/useProductFilter";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Filter, Archive, LayoutGrid, Rows3, SlidersHorizontal, X, BadgeDollarSign, Layers, Percent, Star } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { Input } from "../../atoms/input";
import { Select } from "../../atoms/select";
import { ProductCardViewMode } from "@/types/products";

 export function ProductFilter() {
  const [viewMode, setViewMode] = useState<ProductCardViewMode>('grid');
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
    const products = useApp((state) => state.products || []);

  const categories = useApp((state) => state.categories);

  const filteredProducts = useProductFilters(products, filters);

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

  return (

     <section className="rounded-3xl border border-emerald-100 bg-white/85 p-4 shadow-xl shadow-emerald-50 backdrop-blur-md md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Input
              label="Məhsul Axtarışı"
              name="productSearch"
              value={filters.searchTerm}
              onChange={(e) =>
                handleFilterChange('searchTerm', (e as unknown as React.ChangeEvent<HTMLInputElement>).target.value)
              }
              placeholder="Ad, teq, slug və təsvir üzrə axtar..."
              icon={<Search className="h-4 w-4" />}
              className="flex-1"
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
  )
 }
