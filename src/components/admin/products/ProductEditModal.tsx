// src/components/admin/products/ProductEditModal.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X, Save, Package, Tag, Layers, AlertTriangle, Image as ImageIcon,
  Star, Zap, Settings, Info, BookOpen, DollarSign, ClipboardList,
  Percent, Lightbulb, Plus, Trash2
} from 'lucide-react';

import { useApp } from '@/lib/store';
import type { Variant, ID } from '@/lib/types';
import { productTotalStock, variantFinalPrice } from '@/lib/calc';
import {
  TabKey, Product, ProductGrade, ProductImage, ProductCardViewMode, UnitType
} from '@/types/products';
import BasicTab from '@/components/admin/molecules/BasicTab';
import SettingsTab from '@/components/admin/molecules/SettingsTab';
import SummaryCard from '@/components/admin/molecules/SummaryCard';
import BenefitsTab from '@/components/admin/organisms/BenefitsTab';
import DiscountTab from '@/components/admin/organisms/DiscountTab';
import MediaTab from '@/components/admin/organisms/MediaTab';
import ReviewsTab from '@/components/admin/organisms/ReviewsTab';
import StockTab from '@/components/admin/organisms/StockTab';
import LoadingButton from '@/components/shared/LoadingButton';
import LabelsTab from '@/components/admin/molecules/LabelsTab';
import { Button } from '@/components/atoms/button';

// Util
export const cryptoId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const INPUT_BASE =
  'w-full px-3 py-2 border rounded-xl text-sm transition shadow-sm focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed';

export const TEXTAREA_BASE =
  'w-full px-3 py-2 border rounded-xl text-sm transition shadow-sm min-h-[140px] focus:outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500';

export const getInputClass = (valid: boolean) =>
  `${INPUT_BASE} ${
    valid
      ? 'border-gray-300'
      : 'border-red-400 focus:border-red-500 focus:ring-red-100'
  }`;

// Tab definitions
export const TAB_DEFS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'basic', label: 'Əsas', icon: <Package className="h-4 w-4" /> },
  { key: 'stock', label: 'Stok / Variant', icon: <Layers className="h-4 w-4" /> },
  { key: 'media', label: 'Media', icon: <ImageIcon className="h-4 w-4" /> },
  { key: 'labels', label: 'Etiketlər', icon: <Tag className="h-4 w-4" /> },
  { key: 'discount', label: 'Endirim', icon: <Percent className="h-4 w-4" /> },
  { key: 'benefits', label: 'Faydalar', icon: <Info className="h-4 w-4" /> },
  { key: 'tips', label: 'Məsləhətlər', icon: <Lightbulb className="h-4 w-4" /> },
  { key: 'reviews', label: 'Rəylər', icon: <Star className="h-4 w-4" /> },
  { key: 'settings', label: 'Parametrlər', icon: <Settings className="h-4 w-4" /> },
];

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
      batchDate: new Date().toISOString().split('T')[0],
      createdAt: now,
      label: 'Standart'
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
          ? initial.variants.map(v => ({
              ...v,
              grade: v.grade ?? initial.grade ?? defaultGrade,
              minStock: v.minStock ?? initial.minStock ?? defaultMinStock,
              unit: v.unit ?? initial.unit ?? defaultUnit,
              batchDate: v.batchDate ?? new Date().toISOString().split('T')[0],
              costPrice: v.costPrice ?? 0,
              stock: v.stock ?? 0,
              arrivalCost: v.arrivalCost ?? 0,
            }))
          : [fallbackVariant],
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
        batchDate: now.split('T')[0],
        createdAt: now,
        label: 'Standart'
      },
    ],
    benefits: [],
    usageTips: [],
    certificates: [],
    allergens: [],
    storageNotes: [],
    quantityStep: 0,
    shortDescription: undefined,
    isNewArrival: undefined,
    isFeatured: undefined,
    basePrice: 0,
    stock: 0,
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
  };
};

interface ProductEditModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Product | null;
}

export default function ProductEditModal({
  open,
  onClose,
  initial = null,
}: ProductEditModalProps) {
  const {
    categories,
    addProduct,
    updateProduct,
    approveReview,
    deleteReview,
    products,
  } = useApp();

  const [tab, setTab] = useState<TabKey>('basic');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [product, setProduct] = useState<Product>(() =>
    buildInitialProduct(initial),
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setProduct(buildInitialProduct(initial));
    setTab('basic');
    setSubmitted(false);
    setErrorMsg(null);
  }, [initial, open]);

  const isNew = !products.some((p) => p.id === product.id);

  // Slug generator
  const generateSlug = useCallback(() => {
    if (!product.name.trim()) return;
    const slug = product.name
      .toLowerCase()
      .replace(/[^\wşəğüçıö\s-]/gi, ' ')
      .trim()
      .replace(/\s+/g, '-');
    setProduct((s) => ({ ...s, slug }));
  }, [product.name]);

  // Discount validation
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

  const primaryVariant = product.variants[0];
  const primaryPrice = primaryVariant?.price ?? product.price ?? 0;

  const finalPricePreview = useMemo(() => {
    if (!product.discountType || !product.discountValue) return primaryPrice;
    return variantFinalPrice(product, primaryVariant);
  }, [primaryPrice, primaryVariant, product]);

  const nameValid = product.name.trim().length > 0;
  const categoryValid = !!product.categoryId;
  const baseValid = nameValid && categoryValid;

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  // PREMIUM universal update
  const updateVariant = (
    index: number,
    key: keyof Variant,
    rawValue: string
  ) => {
    setProduct(prev => {
      const variants = [...prev.variants];
      let finalValue: unknown = rawValue;

      // Number sahələri üçün universal parse
      if (["price", "stock", "costPrice", "arrivalCost", "minStock"].includes(key)) {
        if (rawValue === "" || rawValue === null) {
          finalValue = "";
        } else {
          const num = Number(rawValue.replace(",", "."));
          finalValue = isNaN(num) ? 0 : num;
        }
      }

      variants[index] = {
        ...variants[index],
        [key]: finalValue
      };

      // Əsas variant dəyişibsə — product.price sync et
      if (index === 0 && key === "price") {
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
        batchDate: now.split('T')[0],
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

  // ✅ FIX: Server sync – API çağır, cavab gözlə, sonra store-u yenilə
  const handleSave = async () => {
    if (saving) return;
    setSubmitted(true);
    setErrorMsg(null);
    if (!baseValid || discountError) return;

    setSaving(true);
    try {
      // Məhsul məlumatlarını normallaşdır
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
        // Qiymət sahələrini number-ə çevir (string göndərmə)
        basePrice: product.basePrice ?? product.price ?? 0,
        price: primaryVariant?.price ?? product.price ?? 0,
        costPrice: primaryVariant?.costPrice ?? product.costPrice ?? 0,
        stock: primaryVariant?.stock ?? 0,
        variants: product.variants.map(v => ({
          ...v,
          price: Number(v.price),
          stock: Number(v.stock),
          costPrice: Number(v.costPrice),
          arrivalCost: Number(v.arrivalCost || 0),
          minStock: Number(v.minStock),
        })),
      };

      const url = isNew ? '/api/products' : `/api/products/${product.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const savedProduct = isNew ? data : data.product;

      // Store-u yenilə (serverdən qaytarılan məlumatla)
      if (isNew) {
        addProduct(savedProduct);
      } else {
        updateProduct(savedProduct);
      }

      handleClose();
    } catch (err: any) {
      console.error('Save error:', err);
      setErrorMsg(err.message || 'Xəta baş verdi. Yenidən cəhd edin.');
    } finally {
      setSaving(false);
    }
  };

  const pendingReviewsCount =
    product.reviews?.filter((r) => !r.approved).length ?? 0;

  const totalStock = productTotalStock(product);
  const estimatedCost = product.variants.reduce(
    (sum, v) => sum + (v.costPrice || 0) * (v.stock || 0),
    0,
  );
  const potentialRevenue = product.variants.reduce(
    (sum, v) => sum + (v.price || 0) * (v.stock || 0),
    0,
  );
  const potentialProfit = potentialRevenue - estimatedCost;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-600">
              <ClipboardList className="h-4 w-4" />
              {isNew ? 'Yeni məhsul' : 'Məhsul redaktəsi'}
            </div>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-extrabold text-gray-900">
              <Package className="h-6 w-6 text-emerald-600" />
              {product.name || 'Yeni məhsul'}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              ID:{' '}
              <span className="font-mono">
                {product.id ? product.id.slice(0, 8) : '—'}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {pendingReviewsCount > 0 && (
              <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 shadow-inner">
                <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                {pendingReviewsCount} rəy təsdiq gözləyir
              </div>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-3 border-b bg-gray-50 px-6 py-3 text-xs md:grid-cols-4">
          <SummaryCard
            label="Ümumi stok"
            value={totalStock}
            icon={<Package className="h-4 w-4" />}
            highlight={totalStock <= (product.minStock ?? 5)}
          />
          <SummaryCard
            label="Stok maya dəyəri (təxmini)"
            value={`${estimatedCost.toFixed(2)} ₼`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <SummaryCard
            label="Potensial satış dəyəri"
            value={`${potentialRevenue.toFixed(2)} ₼`}
            icon={<BookOpen className="h-4 w-4" />}
          />
          <SummaryCard
            label="Potensial mənfəət"
            value={`${potentialProfit.toFixed(2)} ₼`}
            icon={<Zap className="h-4 w-4" />}
            highlight={potentialProfit < 0}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 text-xs">
          {TAB_DEFS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-medium transition ${
                tab === t.key
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="h-4 w-4 text-xs">{t.icon}</span>
              <span>{t.label}</span>
              {t.key === 'reviews' && pendingReviewsCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {pendingReviewsCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-1">
          {errorMsg && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertTriangle className="inline-block h-4 w-4 mr-1" />
              {errorMsg}
            </div>
          )}
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
                      setProduct(prev => ({
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
                        onChange={e => {
                          const newTips = [...(product.usageTips || [])];
                          newTips[idx] = e.target.value;
                          setProduct(prev => ({ ...prev, usageTips: newTips }));
                        }}
                        placeholder="Məs: Səhər ac qarına 1 qaşıq..."
                      />
                      <button
                        onClick={() => {
                          const newTips = (product.usageTips || []).filter((_, i) => i !== idx);
                          setProduct(prev => ({ ...prev, usageTips: newTips }));
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
                      setProduct(prev => ({
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
                        onChange={e => {
                          const newAllergens = [...(product.allergens || [])];
                          newAllergens[idx] = e.target.value;
                          setProduct(prev => ({ ...prev, allergens: newAllergens }));
                        }}
                        placeholder="Məs: Süd, Fındıq..."
                      />
                      <button
                        onClick={() => {
                          const newAllergens = (product.allergens || []).filter((_, i) => i !== idx);
                          setProduct(prev => ({ ...prev, allergens: newAllergens }));
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-3">
          <div className="flex flex-col gap-1 text-xs">
            {!baseValid && submitted && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Ad və kateqoriya mütləq doldurulmalıdır.</span>
              </div>
            )}
            {discountError && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{discountError}</span>
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <LoadingButton
              variant="secondary"
              onClick={handleClose}
              isLoading={false}
              disabled={saving}
            >
              Ləğv et
            </LoadingButton>
            <LoadingButton
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
            >
              <Save className="h-4 w-4" />
              {isNew ? 'Məhsulu yarat' : 'Dəyişiklikləri yadda saxla'}
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
}