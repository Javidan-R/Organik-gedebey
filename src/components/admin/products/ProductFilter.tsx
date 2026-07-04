// src/components/admin/products/ProductFilter.tsx
'use client';

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Archive,
  LayoutGrid,
  Rows3,
  SlidersHorizontal,
  X,
  BadgeDollarSign,
  Layers,
  Percent,
  Star,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { Select } from '@/components/atoms/select';
import { ID, ProductCardViewMode } from '@/types/products';
import { FilterState, useProductFilters } from '@/utils/useProductFilter';

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface ProductFilterProps {
  filters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  onViewModeChange?: (mode: ProductCardViewMode) => void;
  defaultViewMode?: ProductCardViewMode;
  className?: string;
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

// 1. Search Input with Debounce
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchInput = ({ value, onChange, placeholder = 'Ad, teq, slug və təsvir üzrə axtar...', className = '' }: SearchInputProps) => {
  const [localValue, setLocalValue] = useState(value);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      onChange(val);
    }, 300);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
        <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border-0 bg-slate-100/80 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-400/60 focus:outline-none transition-all duration-200 shadow-inner"
        aria-label="Məhsul axtar"
      />
      {localValue && (
        <button
          onClick={() => { onChange(''); setLocalValue(''); }}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Təmizlə"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

// 2. View Mode Toggle
interface ViewModeToggleProps {
  viewMode: ProductCardViewMode;
  onToggle: (mode: ProductCardViewMode) => void;
}

const ViewModeToggle = ({ viewMode, onToggle }: ViewModeToggleProps) => {
  const options: { value: ProductCardViewMode; label: string; icon: React.ReactNode }[] = [
    { value: 'grid', label: 'Grid', icon: <LayoutGrid className="h-4 w-4" /> },
    { value: 'list', label: 'List', icon: <Rows3 className="h-4 w-4" /> },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl bg-slate-100/70 p-1 shadow-inner">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onToggle(opt.value)}
          className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            viewMode === opt.value
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
              : 'text-slate-600 hover:bg-white/60 hover:text-slate-800'
          }`}
          aria-pressed={viewMode === opt.value}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};

// 3. Status Toggle (Active / Archived)
interface StatusToggleProps {
  showArchived: boolean;
  activeCount: number;
  archivedCount: number;
  onChange: (showArchived: boolean) => void;
}

const StatusToggle = ({ showArchived, activeCount, archivedCount, onChange }: StatusToggleProps) => {
  return (
    <div className="inline-flex gap-1 rounded-2xl bg-emerald-50/70 p-1 shadow-inner">
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
          !showArchived
            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
            : 'text-emerald-700 hover:bg-emerald-100/60'
        }`}
        aria-pressed={!showArchived}
      >
        Aktiv ({activeCount})
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-200 ${
          showArchived
            ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
            : 'text-rose-700 hover:bg-rose-100/60'
        }`}
        aria-pressed={showArchived}
      >
        <Archive className="mr-1 inline-block h-3 w-3" />
        Arxiv ({archivedCount})
      </button>
    </div>
  );
};

// 4. Advanced Filter Toggle Button
interface AdvancedToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  activeFilterCount: number;
}

const AdvancedToggle = ({ isOpen, onToggle, activeFilterCount }: AdvancedToggleProps) => (
  <button
    type="button"
    onClick={onToggle}
    className={`inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
      isOpen || activeFilterCount > 0
        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
        : 'bg-slate-100/70 text-slate-700 hover:bg-slate-200/80'
    }`}
    aria-expanded={isOpen}
  >
    <SlidersHorizontal className="h-3.5 w-3.5" />
    <span>Ətraflı</span>
    {activeFilterCount > 0 && (
      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px] font-black text-white">
        {activeFilterCount}
      </span>
    )}
    <ChevronDown className={`ml-0.5 h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
  </button>
);

// 5. Filter Chip (for displaying active filters)
interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

const FilterChip = ({ label, onRemove }: FilterChipProps) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200/60">
    {label}
    <button
      onClick={onRemove}
      className="rounded-full p-0.5 hover:bg-emerald-200/60 transition-colors"
      aria-label={`${label} filtrini sil`}
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

// 6. Advanced Filters Panel
interface AdvancedFiltersPanelProps {
  filters: FilterState;
  onFilterChange: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
}

const AdvancedFiltersPanel = ({ filters, onFilterChange, onReset }: AdvancedFiltersPanelProps) => {
  const priceInputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all';

  const stockOptions: { value: FilterState['stockFilter']; label: string }[] = [
    { value: 'all', label: 'Hamısı' },
    { value: 'in_stock', label: 'Stokda' },
    { value: 'low_stock', label: 'Az stok' },
    { value: 'out_of_stock', label: 'Stoksuz' },
  ];

  const sortOptions: { value: FilterState['sortKey']; label: string }[] = [
    { value: 'newest', label: 'Ən yenilər' },
    { value: 'price_asc', label: 'Qiymət: artan' },
    { value: 'price_desc', label: 'Qiymət: azalan' },
    { value: 'rating', label: 'Reytinq' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 shadow-inner backdrop-blur-sm md:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            Ətraflı filtr parametrləri
          </p>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-xl bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <X className="h-3 w-3" /> Sıfırla
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Price Range */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              <BadgeDollarSign className="h-3.5 w-3.5 text-emerald-600" />
              Qiymət (AZN)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                className={priceInputClass}
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => onFilterChange('minPrice', e.target.value)}
                aria-label="Minimum qiymət"
              />
              <span className="text-slate-400 text-xs">—</span>
              <input
                type="number"
                min={0}
                className={priceInputClass}
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                aria-label="Maksimum qiymət"
              />
            </div>
          </div>

          {/* Stock Status */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              Stok statusu
            </label>
            <div className="flex flex-wrap gap-1">
              {stockOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFilterChange('stockFilter', opt.value)}
                  className={`rounded-xl px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                    filters.stockFilter === opt.value
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Discount & Rating */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              <Percent className="h-3.5 w-3.5 text-pink-600" />
              Endirim & Reytinq
            </label>
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={filters.discountOnly}
                  onChange={(e) => onFilterChange('discountOnly', e.target.checked)}
                />
                <span>Yalnız endirimdə olanlar</span>
              </label>
              <div className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-amber-500" />
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  placeholder="Min reytinq"
                  value={filters.minRating}
                  onChange={(e) => onFilterChange('minRating', e.target.value)}
                  aria-label="Minimum reytinq"
                />
              </div>
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
              <Filter className="h-3.5 w-3.5 text-slate-700" />
              Sortlama
            </label>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              value={filters.sortKey}
              onChange={(e) => onFilterChange('sortKey', e.target.value as FilterState['sortKey'])}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function ProductFilter({
  filters: externalFilters,
  onFilterChange: externalOnFilterChange,
  onViewModeChange,
  defaultViewMode = 'grid',
  className = '',
}: ProductFilterProps) {
  // ── State ────────────────────────────────────────────────────────────────────
  const [internalViewMode, setInternalViewMode] = useState<ProductCardViewMode>(defaultViewMode);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Daxili filters state (yalnız externalFilters prop-u verilmədikdə istifadə olunur)
  const [internalFilters, setInternalFilters] = useState<FilterState>({
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

  // ── Store ──────────────────────────────────────────────────────────────────
  const products = useApp((state) => state.products || []);
  const categories = useApp((state) => state.categories || []);

  // Əgər externalFilters varsa, ondan istifadə et, yoxsa daxili state-dən
  const filters = externalFilters ?? internalFilters;

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredProducts = useProductFilters(products, filters);

  const activeProductCount = useMemo(
    () => products.filter((p) => !p.archived).length,
    [products]
  );
  const archivedProductCount = useMemo(
    () => products.filter((p) => p.archived).length,
    [products]
  );

  const advancedFilterCount = useMemo(() => {
    let count = 0;
    if (filters.stockFilter !== 'all') count++;
    if (filters.discountOnly) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.minRating) count++;
    if (filters.sortKey !== 'newest') count++;
    return count;
  }, [filters]);

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
      // Əgər externalFilters prop-u varsa, onu yenilə
      if (externalOnFilterChange) {
        const newFilters = { ...filters, [key]: value };
        externalOnFilterChange(newFilters);
      } else {
        // Əks halda daxili state-i yenilə
        setInternalFilters((prev) => ({ ...prev, [key]: value }));
      }
    },
    [externalOnFilterChange, filters]
  );

  const handleResetAdvanced = useCallback(() => {
    const resetState: Partial<FilterState> = {
      stockFilter: 'all',
      discountOnly: false,
      minPrice: '',
      maxPrice: '',
      minRating: '',
      sortKey: 'newest',
    };

    if (externalOnFilterChange) {
      const newFilters = { ...filters, ...resetState };
      externalOnFilterChange(newFilters);
    } else {
      setInternalFilters((prev) => ({ ...prev, ...resetState }));
    }
  }, [externalOnFilterChange, filters]);

  const handleViewModeChange = useCallback(
    (mode: ProductCardViewMode) => {
      setInternalViewMode(mode);
      onViewModeChange?.(mode);
    },
    [onViewModeChange]
  );

  const handleStatusToggle = useCallback(
    (showArchived: boolean) => {
      handleFilterChange('showArchived', showArchived);
    },
    [handleFilterChange]
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <section className={`rounded-3xl border border-emerald-100/60 bg-white/80 p-4 shadow-xl shadow-emerald-50/50 backdrop-blur-sm md:p-5 ${className}`}>
      {/* Primary Filter Row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <SearchInput
          value={filters.searchTerm}
          onChange={(val) => handleFilterChange('searchTerm', val)}
          className="flex-1 min-w-[180px]"
        />

        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <Select
            label="Kateqoriya"
            name="categoryFilter"
            value={filters.categoryId}
            onChange={(e) => {
              const val = typeof e === 'string' ? e : (e as React.ChangeEvent<HTMLSelectElement>).target.value;
              handleFilterChange('categoryId', val as ID | '');
            }}
            options={[
              { value: '', label: 'Bütün kateqoriyalar' },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ]}
            icon={<Filter className="h-4 w-4" />}
            className="w-full md:w-48"
          />
        </div>
      </div>

      {/* Secondary Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-emerald-100 pt-3 text-xs md:text-sm">
        <StatusToggle
          showArchived={filters.showArchived}
          activeCount={activeProductCount}
          archivedCount={archivedProductCount}
          onChange={handleStatusToggle}
        />

        <ViewModeToggle viewMode={internalViewMode} onToggle={handleViewModeChange} />

        <div className="ml-auto flex items-center gap-2">
          <AdvancedToggle
            isOpen={advancedOpen}
            onToggle={() => setAdvancedOpen((v) => !v)}
            activeFilterCount={advancedFilterCount}
          />
          <span className="text-[11px] text-slate-400 md:text-xs whitespace-nowrap">
            <span className="font-semibold text-slate-700">{filteredProducts.length}</span> məhsul
          </span>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence initial={false}>
        {advancedOpen && (
          <AdvancedFiltersPanel
            filters={filters}
            onFilterChange={handleFilterChange}
            onReset={handleResetAdvanced}
          />
        )}
      </AnimatePresence>

      {/* Active Filter Chips */}
      {(filters.searchTerm ||
        filters.categoryId ||
        filters.stockFilter !== 'all' ||
        filters.discountOnly ||
        filters.minPrice ||
        filters.maxPrice ||
        filters.minRating) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="text-[10px] font-semibold uppercase text-slate-400">Filtrlər:</span>
          {filters.searchTerm && (
            <FilterChip label={`"${filters.searchTerm}"`} onRemove={() => handleFilterChange('searchTerm', '')} />
          )}
          {filters.categoryId && (
            <FilterChip
              label={categories.find((c) => c.id === filters.categoryId)?.name || 'Kateqoriya'}
              onRemove={() => handleFilterChange('categoryId', '')}
            />
          )}
          {filters.stockFilter !== 'all' && (
            <FilterChip
              label={`Stok: ${filters.stockFilter === 'in_stock' ? 'Stokda' : filters.stockFilter === 'low_stock' ? 'Az stok' : 'Stoksuz'}`}
              onRemove={() => handleFilterChange('stockFilter', 'all')}
            />
          )}
          {filters.discountOnly && (
            <FilterChip label="Endirim" onRemove={() => handleFilterChange('discountOnly', false)} />
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <FilterChip
              label={`${filters.minPrice || '0'}₼ — ${filters.maxPrice || '∞'}₼`}
              onRemove={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', ''); }}
            />
          )}
          {filters.minRating && (
            <FilterChip
              label={`⭐ ${filters.minRating}+`}
              onRemove={() => handleFilterChange('minRating', '')}
            />
          )}
        </div>
      )}
    </section>
  );
}