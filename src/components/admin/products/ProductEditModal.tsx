// src/components/admin/products/ProductEditModal.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X,
  Save,
  Package,
  Tag,
  Layers,
  AlertTriangle,
  Image as ImageIcon,
  Star,
  Zap,
  Settings,
  Info,
  BookOpen,
  DollarSign,
  ClipboardList,
  Percent,
  Lightbulb,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { useCreateProduct, useUpdateProduct } from '@/hooks/useProducts';
import type { Variant, ID } from '@/lib/types';
import { productTotalStock, variantFinalPrice } from '@/lib/calc';
import { TabKey, Product, ProductGrade, UnitType } from '@/types/products';
import BasicTab from '@/components/admin/molecules/BasicTab';
import SettingsTab from '@/components/admin/molecules/SettingsTab';
import SummaryCard from '@/components/admin/molecules/SummaryCard';
import BenefitsTab from '@/components/admin/organisms/BenefitsTab';
import DiscountTab from '@/components/admin/organisms/DiscountTab';
import MediaTab from '@/components/admin/organisms/MediaTab';
import ReviewsTab from '@/components/admin/organisms/ReviewsTab';
import StockTab from '@/components/admin/organisms/StockTab';
import LoadingButton from '@/components/common/LoadingButton';
import LabelsTab from '@/components/admin/molecules/LabelsTab';
import { Button } from '@/components/atoms/button';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Stillər (əvvəlki kimi) ─────────────────────────────────────
export const INPUT_BASE =
  'w-full px-4 py-3 border-2 rounded-2xl text-base font-medium transition-all duration-300 shadow-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-200/70 focus:border-emerald-500 hover:border-emerald-300 hover:shadow-md disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70';

export const INPUT_ERROR =
  'border-rose-300 focus:border-rose-500 focus:ring-rose-200/70 hover:border-rose-400';

export const INPUT_SUCCESS =
  'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200/70';

export const INPUT_SM = 'px-3 py-1.5 text-sm rounded-xl';
export const INPUT_LG = 'px-5 py-4 text-lg rounded-2xl';

export const TEXTAREA_BASE =
  'w-full px-4 py-3 border-2 rounded-2xl text-base font-medium transition-all duration-300 shadow-sm bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-200/70 focus:border-emerald-500 hover:border-emerald-300 hover:shadow-md disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70 min-h-[120px] resize-y';

export const SELECT_BASE =
  'w-full px-4 py-3 border-2 rounded-2xl text-base font-medium transition-all duration-300 shadow-sm bg-white text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-200/70 focus:border-emerald-500 hover:border-emerald-300 hover:shadow-md disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:opacity-70 appearance-none bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236B7280%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22/%3E%3C/svg%3E")] bg-[length:20px] bg-[right:14px_center] bg-no-repeat pr-12';

export const getInputClass = (valid: boolean, size: 'sm' | 'md' | 'lg' = 'md') => {
  const sizeClass = size === 'sm' ? INPUT_SM : size === 'lg' ? INPUT_LG : '';
  return `${INPUT_BASE} ${sizeClass} ${valid ? INPUT_SUCCESS : INPUT_ERROR}`;
};

export const FormLabel: React.FC<{
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
}> = ({ label, required, icon, description, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-700">
      {icon && <span className="text-emerald-500">{icon}</span>}
      <span className="bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
        {label}
      </span>
      {required && <span className="text-rose-500 text-xs font-bold">*</span>}
    </div>
    {description && (
      <p className="text-[11px] text-slate-400/80 leading-relaxed italic">
        {description}
      </p>
    )}
  </div>
);

export const FormGroup: React.FC<{
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, required, icon, description, error, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <FormLabel label={label} required={required} icon={icon} description={description} />
    <div className="relative">
      <div className="group relative">
        {children}
        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent pointer-events-none transition-all duration-300 group-hover:ring-emerald-200/40 group-focus-within:ring-emerald-300/60" />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs font-medium text-rose-600 flex items-center gap-1.5"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          {error}
        </motion.p>
      )}
    </div>
  </div>
);

// ─── Tab Definitions ────────────────────────────────────────────
export const TAB_DEFS: { key: TabKey; label: string; icon: React.ReactNode; badge?: number }[] = [
  { key: 'basic', label: 'Əsas', icon: <Package className="h-4 w-4" /> },
  { key: 'stock', label: 'Stok / Variant', icon: <Layers className="h-4 w-4" /> },
  { key: 'media', label: 'Media', icon: <ImageIcon className="h-4 w-4" /> },
  { key: 'labels', label: 'Etiketlər', icon: <Tag className="h-4 w-4" /> },
  { key: 'discount', label: 'Endirim', icon: <Percent className="h-4 w-4" /> },
  { key: 'benefits', label: 'Faydalar', icon: <Info className="h-4 w-4" /> },
  { key: 'tips', label: 'Məsləhətlər', icon: <Lightbulb className="h-4 w-4" /> },
  { key: 'reviews', label: 'Rəylər', icon: <Star className="h-4 w-4" />, badge: 0 },
  { key: 'settings', label: 'Parametrlər', icon: <Settings className="h-4 w-4" /> },
];

// ─── buildInitialProduct ──────────────────────────────────────────
export const buildInitialProduct = (initial?: Product | null): Product => {
  const now = new Date().toISOString();
  const defaultGrade: ProductGrade = 'A';
  const defaultUnit: UnitType = 'ədəd';
  const defaultMinStock = 10;

  if (initial) {
    const fallbackVariant: Variant = {
      id: cryptoId(),
      name: 'Standart',
      price: initial.price ?? 0,
      stock: 0,
      costPrice: 0,
      arrivalCost: 0,
      minStock: initial.minStock ?? defaultMinStock,
      grade: initial.grade ?? defaultGrade,
      unit: initial.unit ?? defaultUnit,
      batchDate: now,
      createdAt: now,
      label: 'Standart',
    };

    return {
      ...initial,
      tags: initial.tags ?? [],
      images: initial.images ?? [],
      benefits: initial.benefits ?? [],
      usageTips: initial.usageTips ?? [],
      certificates: initial.certificates ?? [],
      allergens: initial.allergens ?? [],
      storageNotes: initial.storageNotes ?? [],
      reviews: initial.reviews ?? [],
      statusTags: initial.statusTags ?? ['newArrival'],
      unit: initial.unit ?? defaultUnit,
      grade: initial.grade ?? defaultGrade,
      minStock: initial.minStock ?? defaultMinStock,
      variants:
        initial.variants && initial.variants.length > 0
          ? initial.variants.map((v) => ({
              ...v,
              grade: v.grade ?? initial.grade ?? defaultGrade,
              minStock: v.minStock ?? initial.minStock ?? defaultMinStock,
              unit: v.unit ?? initial.unit ?? defaultUnit,
              batchDate: v.batchDate ?? now,
              costPrice: v.costPrice ?? 0,
              stock: v.stock ?? 0,
              arrivalCost: v.arrivalCost ?? 0,
            }))
          : [fallbackVariant],
      isSeasonal: initial.isSeasonal ?? false,
      soldCount: initial.soldCount ?? 0,
    };
  }

  return {
    id: cryptoId(),
    name: '',
    slug: '',
    description: '',
    categoryId: '',
    tags: ['organik'],
    images: [],
    video: undefined,
    origin: 'Azərbaycanda istehsal olunub',
    originRegion: 'Gədəbəy',
    isOrganic: true,
    isSeasonal: false,
    isFeatured: false,
    isNewArrival: false,
    seasonal: false,
    featured: false,
    discountType: undefined,
    discountValue: undefined,
    discountStart: undefined,
    discountEnd: undefined,
    archived: false,
    createdAt: now,
    unit: defaultUnit,
    grade: defaultGrade,
    minStock: defaultMinStock,
    statusTags: ['newArrival'],
    price: 0,
    costPrice: 0,
    stock: 0,
    basePrice: 0,
    quantityStep: 0,
    reviews: [],
    variants: [
      {
        id: cryptoId(),
        name: 'Standart',
        price: 0,
        stock: 0,
        costPrice: 0,
        arrivalCost: 0,
        minStock: defaultMinStock,
        grade: defaultGrade,
        unit: defaultUnit,
        batchDate: now,
        createdAt: now,
        label: 'Standart',
      },
    ],
    benefits: [],
    usageTips: [],
    certificates: [],
    allergens: [],
    storageNotes: [],
    shortDescription: undefined,
    metaTitle: '',
    seoTitle: '',
    seoDescription: '',
    metaDescription: '',
    keywords: [],
    attributes: [],
    nutritionalFacts: [],
    updatedAt: now,
    weight: undefined,
    shelfLifeDays: undefined,
    soldCount: 0,
  };
};

export const cryptoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function sanitizeNulls<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key in obj) {
    const val = obj[key];
    if (val === null || val === undefined) continue;
    if (Array.isArray(val) && val.length === 0) continue;
    if (typeof val === 'object' && !Array.isArray(val) && val !== null) {
      result[key] = sanitizeNulls(val);
    } else {
      result[key] = val;
    }
  }
  return result as T;
}

interface ProductEditModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Product | null;
}

// ─── Main Component ──────────────────────────────────────────────
export default function ProductEditModal({
  open,
  onClose,
  initial = null,
}: ProductEditModalProps) {
  const { categories, approveReview, deleteReview, products } = useApp();

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [tab, setTab] = useState<TabKey>('basic');
  const [submitted, setSubmitted] = useState(false);
  const [product, setProduct] = useState<Product>(() =>
    buildInitialProduct(initial)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isMobileTabMenuOpen, setIsMobileTabMenuOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setProduct(buildInitialProduct(initial));
    setTab('basic');
    setSubmitted(false);
    setErrorMsg(null);
    setSaving(false);
    setIsMobileTabMenuOpen(false);
  }, [open, initial]);

  const isNew = !products.some((p) => p.id === product.id);

  const generateSlug = useCallback(() => {
    if (!product.name.trim()) return;
    const slug = product.name
      .toLowerCase()
      .replace(/[^\wşəğüçıö\s-]/gi, ' ')
      .trim()
      .replace(/\s+/g, '-');
    setProduct((s) => ({ ...s, slug }));
  }, [product.name]);

  const discountError = useMemo(() => {
    if (product.discountValue && !product.discountType) {
      return 'Endirim növü seçilməlidir (faiz və ya sabit məbləğ).';
    }
    if (
      product.discountType === 'percentage' &&
      product.discountValue &&
      product.discountValue > 100
    ) {
      return 'Faiz endirimi 100%-dən böyük ola bilməz.';
    }
    if (product.discountStart && product.discountEnd) {
      const s = new Date(product.discountStart).getTime();
      const e = new Date(product.discountEnd).getTime();
      if (s > e) {
        return 'Endirimin başlama tarixi bitiş tarixindən böyük ola bilməz.';
      }
    }
    return '';
  }, [
    product.discountType,
    product.discountValue,
    product.discountStart,
    product.discountEnd,
  ]);

  const primaryVariant = product.variants?.[0];
  const primaryPrice = primaryVariant?.price ?? product.price ?? 0;

  const finalPricePreview = useMemo(() => {
    if (!product.discountType || !product.discountValue) return primaryPrice;
    if (!primaryVariant) return primaryPrice;
    return variantFinalPrice(product, primaryVariant);
  }, [primaryPrice, primaryVariant, product]);

  const nameValid = product.name.trim().length > 0;
  const categoryValid = !!product.categoryId;
  const baseValid = nameValid && categoryValid;

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const updateVariant = (index: number, key: keyof Variant, rawValue: string) => {
    setProduct((prev) => {
      const variants = [...prev.variants];
      let finalValue: unknown = rawValue;

      if (
        ['price', 'stock', 'costPrice', 'arrivalCost', 'minStock'].includes(key)
      ) {
        if (rawValue === '' || rawValue === null) {
          finalValue = '';
        } else {
          const num = Number(rawValue.replace(',', '.'));
          finalValue = isNaN(num) ? 0 : num;
        }
      }

      // @ts-expect-error – key dynamically assigned, but we know it's safe
      variants[index] = { ...variants[index], [key]: finalValue };

      if (index === 0 && key === 'price') {
        return { ...prev, variants, price: Number(finalValue) };
      }

      return { ...prev, variants };
    });
  };

  const addVariant = useCallback(() => {
    setProduct((prev) => {
      if (!prev) return prev;
      const primaryVariant = prev.variants[0];
      const now = new Date().toISOString();
      const inheritedUnit = primaryVariant?.unit ?? prev.unit ?? 'ədəd';
      const inheritedGrade = primaryVariant?.grade ?? prev.grade ?? 'A';
      const inheritedMinStock = primaryVariant?.minStock ?? prev.minStock ?? 10;

      const newVariant: Variant = {
        id: cryptoId(),
        name: `Çeşid ${prev.variants.length + 1}`,
        label: `Çeşid ${prev.variants.length + 1}`,
        price: primaryVariant?.price ?? 0,
        stock: 0,
        costPrice: primaryVariant?.costPrice ?? 0,
        arrivalCost: primaryVariant?.arrivalCost ?? 0,
        createdAt: now,
        grade: inheritedGrade,
        unit: inheritedUnit,
        minStock: inheritedMinStock,
        batchDate: now,
      };

      return {
        ...prev,
        variants: [...prev.variants, newVariant],
      };
    });
  }, []);

  const removeVariant = (id: ID) => {
    setProduct((prev) => {
      if (prev.variants.length <= 1) return prev;
      return {
        ...prev,
        variants: prev.variants.filter((v) => v.id !== id),
      };
    });
  };

  const handleSave = async () => {
    if (saving) return;
    setSubmitted(true);
    setErrorMsg(null);
    if (!baseValid || discountError) return;

    setSaving(true);

    try {
      const payload = {
        ...product,
        slug:
          product.slug ||
          product.name
            .toLowerCase()
            .replace(/[^\wşəğüçıö\s-]/gi, ' ')
            .trim()
            .replace(/\s+/g, '-'),
        tags: (product.tags || []).map((t) => t.toLowerCase().trim()),
        reviews: product.reviews ?? [],
        basePrice: product.basePrice ?? product.price ?? 0,
        price: primaryVariant?.price ?? product.price ?? 0,
        costPrice: primaryVariant?.costPrice ?? product.costPrice ?? 0,
        stock: primaryVariant?.stock ?? 0,
        variants: product.variants.map((v) => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock),
          costPrice: Number(v.costPrice),
          arrivalCost: Number(v.arrivalCost || 0),
          minStock: Number(v.minStock),
        })),
        isSeasonal: product.isSeasonal ?? false,
        soldCount: product.soldCount ?? 0,
        discountType: product.discountType
          ? product.discountType.toUpperCase() as 'PERCENTAGE' | 'FIXED'
          : undefined,
      };

      const cleanPayload: Partial<Product> = sanitizeNulls(payload);

      if (isNew) {
        await createMutation.mutateAsync(cleanPayload as Product);
      } else {
        await updateMutation.mutateAsync({ id: product.id, data: cleanPayload });
      }

      handleClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Xəta baş verdi. Yenidən cəhd edin.';
      console.error('Save error:', err);
      setErrorMsg(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const totalStock = productTotalStock(product);
  const estimatedCost = product.variants.reduce(
    (sum, v) => sum + (v.costPrice || 0) * (v.stock || 0),
    0
  );
  const potentialRevenue = product.variants.reduce(
    (sum, v) => sum + (v.price || 0) * (v.stock || 0),
    0
  );
  const potentialProfit = potentialRevenue - estimatedCost;
  const pendingReviewsCount =
    product.reviews?.filter((r) => !r.approved).length ?? 0;

  // ─── Mobile Tab Selector ──────────────────────────────────────
  const currentTabLabel = TAB_DEFS.find((t) => t.key === tab)?.label || 'Əsas';
  const currentTabIcon = TAB_DEFS.find((t) => t.key === tab)?.icon;

  // ─── Render ────────────────────────────────────────────────────
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm">
      <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl">
        {/* ─── Header ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b px-4 py-3 sm:px-6 sm:py-4 gap-3">
          <div className="w-full sm:w-auto">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-600">
              <ClipboardList className="h-4 w-4" />
              {isNew ? 'Yeni məhsul' : 'Məhsul redaktəsi'}
            </div>
            <h2 className="mt-0.5 flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-gray-900">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
              <span className="truncate">{product.name || 'Yeni məhsul'}</span>
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              ID: <span className="font-mono">{product.id ? product.id.slice(0, 8) : '—'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 ml-auto sm:ml-0">
            {pendingReviewsCount > 0 && (
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 shadow-inner">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                {pendingReviewsCount} rəy gözləyir
              </div>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-100 transition-colors"
              aria-label="Bağla"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── Summary Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b bg-gray-50/80 px-3 py-2 sm:px-6 sm:py-3 text-xs">
          <SummaryCard
            label="Ümumi stok"
            value={totalStock}
            icon={<Package className="h-4 w-4" />}
            highlight={totalStock <= (product.minStock ?? 5)}
          />
          <SummaryCard
            label="Maya dəyəri"
            value={`${estimatedCost.toFixed(2)} ₼`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <SummaryCard
            label="Satış dəyəri"
            value={`${potentialRevenue.toFixed(2)} ₼`}
            icon={<BookOpen className="h-4 w-4" />}
          />
          <SummaryCard
            label="Mənfəət"
            value={`${potentialProfit.toFixed(2)} ₼`}
            icon={<Zap className="h-4 w-4" />}
            highlight={potentialProfit < 0}
          />
        </div>

        {/* ─── Tabs ──────────────────────────────────────────────── */}
        <div className="border-b px-3 py-2 sm:px-6 sm:py-3">
          {/* Desktop Tabs */}
          <div className="hidden sm:flex items-center gap-1 overflow-x-auto scrollbar-thin">
            {TAB_DEFS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                  tab === t.key
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-400/30 scale-[1.02]'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="h-4 w-4">{t.icon}</span>
                <span>{t.label}</span>
                {t.key === 'reviews' && pendingReviewsCount > 0 && (
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {pendingReviewsCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mobile Tab Dropdown */}
          <div className="sm:hidden relative">
            <button
              type="button"
              onClick={() => setIsMobileTabMenuOpen(!isMobileTabMenuOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-emerald-600">{currentTabIcon}</span>
                <span>{currentTabLabel}</span>
                {pendingReviewsCount > 0 && tab === 'reviews' && (
                  <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {pendingReviewsCount}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  isMobileTabMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {isMobileTabMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
                >
                  {TAB_DEFS.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        setTab(t.key);
                        setIsMobileTabMenuOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                        tab === t.key
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-emerald-600">{t.icon}</span>
                      <span className="flex-1 text-left">{t.label}</span>
                      {t.key === 'reviews' && pendingReviewsCount > 0 && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                          {pendingReviewsCount}
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ─── Content ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-3 py-2 sm:px-6 sm:pb-4 sm:pt-3">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="inline-block h-4 w-4 mr-1" />
              {errorMsg}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'basic' && (
                <BasicTab
                  product={product}
                  setProduct={setProduct}
                  categories={categories}
                  submitted={submitted}
                  generateSlug={generateSlug}
                />
              )}
              {tab === 'stock' && (
                <StockTab
                  product={product}
                  updateVariant={updateVariant}
                  addVariant={addVariant}
                  removeVariant={removeVariant}
                />
              )}
              {tab === 'media' && (
                <MediaTab product={product} setProduct={setProduct} />
              )}
              {tab === 'labels' && (
                <LabelsTab product={product} setProduct={setProduct} />
              )}
              {tab === 'discount' && (
                <DiscountTab
                  product={product}
                  setProduct={setProduct}
                  discountError={discountError}
                  finalPricePreview={finalPricePreview}
                  primaryPrice={primaryPrice}
                />
              )}
              {tab === 'benefits' && (
                <BenefitsTab product={product} setProduct={setProduct} />
              )}
              {tab === 'tips' && (
                <div className="space-y-6">
                  {/* Usage Tips */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        İstifadə Məsləhətləri
                      </h3>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setProduct((prev) => ({
                            ...prev,
                            usageTips: [...(prev.usageTips || []), ''],
                          }))
                        }
                      >
                        <Plus className="h-4 w-4" /> Əlavə et
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(product.usageTips || []).map((tip, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            className={INPUT_BASE}
                            value={tip}
                            onChange={(e) => {
                              const newTips = [...(product.usageTips || [])];
                              newTips[idx] = e.target.value;
                              setProduct((prev) => ({ ...prev, usageTips: newTips }));
                            }}
                            placeholder="Məs: Səhər ac qarına 1 qaşıq..."
                          />
                          <button
                            onClick={() => {
                              const newTips = (product.usageTips || []).filter(
                                (_, i) => i !== idx
                              );
                              setProduct((prev) => ({ ...prev, usageTips: newTips }));
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                        Allergenlər
                      </h3>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setProduct((prev) => ({
                            ...prev,
                            allergens: [...(prev.allergens || []), ''],
                          }))
                        }
                      >
                        <Plus className="h-4 w-4" /> Əlavə et
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(product.allergens || []).map((allergen, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            className={INPUT_BASE}
                            value={allergen}
                            onChange={(e) => {
                              const newAllergens = [...(product.allergens || [])];
                              newAllergens[idx] = e.target.value;
                              setProduct((prev) => ({ ...prev, allergens: newAllergens }));
                            }}
                            placeholder="Məs: Süd, Fındıq..."
                          />
                          <button
                            onClick={() => {
                              const newAllergens = (product.allergens || []).filter(
                                (_, i) => i !== idx
                              );
                              setProduct((prev) => ({ ...prev, allergens: newAllergens }));
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {tab === 'reviews' && (
                <ReviewsTab
                  product={product}
                  approveReview={approveReview}
                  deleteReview={deleteReview}
                />
              )}
              {tab === 'settings' && (
                <SettingsTab product={product} setProduct={setProduct} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ─── Footer ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t bg-gray-50/80 px-3 py-2.5 sm:px-6 sm:py-3 gap-2">
          <div className="flex flex-col gap-0.5 text-xs">
            {!baseValid && submitted && (
              <div className="flex items-center gap-1 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Ad və kateqoriya mütləq doldurulmalıdır.</span>
              </div>
            )}
            {discountError && (
              <div className="flex items-center gap-1 text-rose-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{discountError}</span>
              </div>
            )}
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2 ml-auto">
            <LoadingButton
              variant="secondary"
              onClick={handleClose}
              isLoading={false}
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              Ləğv et
            </LoadingButton>
            <LoadingButton
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-400/30"
            >
              <Save className="h-4 w-4" />
              {isNew ? 'Məhsulu yarat' : 'Yadda saxla'}
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
}