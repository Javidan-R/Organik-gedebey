// src/components/admin/baskets/BasketEditModal.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, Trash2, Package, ShoppingBag, Save,
  AlertCircle, DollarSign, Search, GripVertical,
  Layers, Image, Gift, Tag, Star, TrendingUp, Leaf,
  Upload, Camera, Eye, EyeOff, Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { useApp } from '@/lib/store';
import { Basket, FormVariant, emptyFormVariant, toFormVariant } from '@/types/basket';
import { formatCurrency } from '@/utils/product';
import toast from 'react-hot-toast';

// ─── Types ──────────────────────────────────────────────────────
interface BasketEditModalProps {
  open: boolean;
  onClose: () => void;
  basket: Basket | null;
  onSave: (basket: Partial<Basket>) => Promise<void>;
}

interface SelectedProduct {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  altText?: string;
  displayOrder: number;
}

// ─── Margin Calculator ──────────────────────────────────────────
function calculateBasketMargin(
  basket: Partial<Basket>,
  selectedProducts: SelectedProduct[],
  products: any[],
  productPriceNow: (product: any, variant: any) => number
) {
  let totalCost = 0;
  let totalRevenue = 0;

  if (selectedProducts.length > 0) {
    for (const sp of selectedProducts) {
      const product = products.find(p => p.id === sp.productId);
      if (!product) continue;
      const variant = sp.variantId
        ? product.variants?.find((v: any) => v.id === sp.variantId)
        : product.variants?.[0];
      if (!variant) continue;
      const price = productPriceNow(product, variant);
      const cost = variant.costPrice ? Number(variant.costPrice) : 0;
      const qty = sp.quantity || 1;
      totalCost += cost * qty;
      totalRevenue += price * qty;
    }
  } else {
    const primaryVariant = basket.variants?.[0];
    const price = primaryVariant
      ? parseFloat(String(primaryVariant.price || '0'))
      : 0;
    totalCost = price * 0.6;
    totalRevenue = price;
  }

  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  return { totalRevenue, totalCost, profit, margin };
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENT: ProductSelector
// ═══════════════════════════════════════════════════════════════
const ProductSelector = ({
  products,
  onAddProduct,
}: {
  products: any[];
  onAddProduct: (productId: string, variantId: string | null, quantity: number) => void;
}) => {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    return products
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 10);
  }, [search, products]);

  const selectedProduct = useMemo(
    () => products.find(p => p.id === selectedProductId),
    [selectedProductId, products]
  );

  const variants = selectedProduct?.variants || [];

  useEffect(() => {
    setSelectedVariantId(null);
  }, [selectedProductId]);

  const handleAdd = () => {
    if (!selectedProductId) return;
    onAddProduct(selectedProductId, selectedVariantId, quantity);
    setSearch('');
    setSelectedProductId(null);
    setSelectedVariantId(null);
    setQuantity(1);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Məhsul axtar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none bg-white text-gray-700 placeholder-gray-400"
          />
          {search && (
            <div className="absolute top-full mt-1 w-full bg-white border rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="p-3 text-sm text-gray-500">Məhsul tapılmadı</p>
              )}
              {filtered.map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 ${
                    selectedProductId === p.id ? 'bg-emerald-50 font-bold text-emerald-700' : ''
                  }`}
                  onClick={() => {
                    setSelectedProductId(p.id);
                    setSearch('');
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="flex items-center gap-2">
            {variants.length > 0 && (
              <select
                value={selectedVariantId || ''}
                onChange={(e) => setSelectedVariantId(e.target.value || null)}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-emerald-500 bg-white text-gray-700"
              >
                <option value="">Standart variant</option>
                {variants.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100"
              >
                −
              </button>
              <span className="w-8 text-center font-bold text-sm text-gray-700">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-100"
              >
                +
              </button>
            </div>
            <Button type="button" size="sm" onClick={handleAdd} className="bg-emerald-600 hover:bg-emerald-700 whitespace-nowrap">
              <Plus className="w-3.5 h-3.5 mr-1" /> Əlavə et
            </Button>
          </div>
        )}
      </div>
      {selectedProduct && (
        <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2 text-sm text-emerald-700">
          <Check className="w-4 h-4" />
          <span className="font-semibold">{selectedProduct.name}</span>
          <span className="text-emerald-500">seçildi</span>
          <button
            type="button"
            onClick={() => setSelectedProductId(null)}
            className="ml-auto text-emerald-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENT: SelectedProductsList
// ═══════════════════════════════════════════════════════════════
const SelectedProductsList = ({
  items,
  products,
  onRemove,
  onUpdate,
}: {
  items: SelectedProduct[];
  products: any[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: any) => void;
}) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm text-gray-500">Hələ məhsul əlavə edilməyib</p>
        <p className="text-xs text-gray-400 mt-1">
          Yuxarıdakı axtarış panelindən məhsul seçin
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const product = products.find(p => p.id === item.productId);
        const variant =
          product?.variants?.find((v: any) => v.id === item.variantId) ||
          product?.variants?.[0];
        const price = variant ? Number(variant.price || 0) : 0;
        const lineTotal = price * item.quantity;

        return (
          <motion.div
            key={`${item.productId}-${idx}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <GripVertical className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {product?.name || 'Naməlum məhsul'}
              </p>
              <p className="text-xs text-gray-500">
                {variant?.name || 'Standart'} · {formatCurrency(price)} × {item.quantity} ={' '}
                <span className="font-semibold text-emerald-600">
                  {formatCurrency(lineTotal)}
                </span>
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              {product?.variants?.length > 1 && (
                <select
                  value={item.variantId || ''}
                  onChange={e => onUpdate(idx, 'variantId', e.target.value || null)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white hover:border-emerald-300 text-gray-700"
                >
                  <option value="">Standart</option>
                  {product.variants.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => onUpdate(idx, 'quantity', Math.max(1, item.quantity - 1))}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs hover:bg-white"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-bold text-gray-700">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdate(idx, 'quantity', item.quantity + 1)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-xs hover:bg-white"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(idx)}
                className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                title="Məhsulu sil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENT: TabButton
// ═══════════════════════════════════════════════════════════════
const TabButton = ({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-2xl transition-all ${
      active
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && (
      <span
        className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {count}
      </span>
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function BasketEditModal({
  open,
  onClose,
  basket,
  onSave,
}: BasketEditModalProps) {
  const { products, productPriceNow } = useApp();

  const [formData, setFormData] = useState<Partial<Basket>>({});
  const [variants, setVariants] = useState<FormVariant[]>([
    emptyFormVariant(),
  ]);
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'general' | 'variants' | 'products' | 'media'
  >('general');
  const [formTouched, setFormTouched] = useState(false);

  // Media state
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');

  // ─── Initialize form ─────────────────────────────────────
  useEffect(() => {
    if (basket && Object.keys(basket).length > 1) {
      setFormData(basket);
      setVariants(
        basket.variants?.length
          ? basket.variants.map(toFormVariant)
          : [emptyFormVariant()]
      );
      setSelectedProducts(
        basket.products?.map(p => ({
          productId: p.productId,
          variantId: p.productVariantId || null,
          quantity: parseFloat(String(p.quantity)) || 1,
        })) || []
      );
      setMediaItems(
        basket.media?.map(m => ({
          id: m.id,
          type: m.type as 'image' | 'video',
          url: m.url,
          altText: m.altText || undefined,
          displayOrder: m.displayOrder || 0,
        })) || []
      );
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        type: 'custom',
        stock: 0,
        discount: 0,
        isActive: true,
        archived: false,
        bestseller: false,
        trending: false,
        new: false,
        lowStock: false,
        isSeasonal: false,
      });
      setVariants([emptyFormVariant()]);
      setSelectedProducts([]);
      setMediaItems([]);
    }
    setError('');
    setActiveTab('general');
    setFormTouched(false);
  }, [basket, open]);

  // ─── Variant handlers ────────────────────────────────────
  const addVariant = useCallback(() => {
    const used = new Set(variants.map(v => v.variant));
    const allTypes = ['econom', 'standard', 'premium'] as const;
    const available = allTypes.find(t => !used.has(t));
    if (!available) {
      toast.error('Bütün variant növləri artıq əlavə edilib (econom, standard, premium)');
      return;
    }
    setVariants(p => [...p, { ...emptyFormVariant(), variant: available }]);
    setFormTouched(true);
  }, [variants]);

  const removeVariant = useCallback((index: number) => {
    setVariants(p => (p.length > 1 ? p.filter((_, i) => i !== index) : p));
    setFormTouched(true);
  }, []);

  const updateVariant = useCallback(
    (index: number, field: keyof FormVariant, value: any) => {
      setVariants(p => {
        const updated = [...p];
        updated[index] = { ...updated[index], [field]: value } as FormVariant;
        return updated;
      });
      setFormTouched(true);
    },
    []
  );

  // ─── Product handlers ────────────────────────────────────
  const addProduct = useCallback(
    (productId: string, variantId: string | null, quantity: number) => {
      setSelectedProducts(p => [...p, { productId, variantId, quantity }]);
      setFormTouched(true);
    },
    []
  );

  const removeProduct = useCallback((index: number) => {
    setSelectedProducts(p => p.filter((_, i) => i !== index));
    setFormTouched(true);
  }, []);

  const updateProduct = useCallback(
    (index: number, field: string, value: any) => {
      setSelectedProducts(p => {
        const updated = [...p];
        (updated[index] as any)[field] = value;
        return updated;
      });
      setFormTouched(true);
    },
    []
  );

  // ─── Form field handlers ───────────────────────────────────────
  const handleFieldChange = useCallback(
    (field: keyof Basket, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      setFormTouched(true);
    },
    []
  );

  const handleNumberFieldChange = useCallback(
    (field: keyof Basket, value: string) => {
      setFormData(prev => ({ ...prev, [field]: parseInt(value, 10) || 0 }));
      setFormTouched(true);
    },
    []
  );

  // ─── Media handlers ─────────────────────────────────────
  const addMediaItem = () => {
    if (!newMediaUrl.trim()) {
      toast.error('URL daxil edin');
      return;
    }
    const newItem: MediaItem = {
      id: crypto.randomUUID(),
      type: newMediaType,
      url: newMediaUrl.trim(),
      displayOrder: mediaItems.length,
    };
    setMediaItems(prev => [...prev, newItem]);
    setNewMediaUrl('');
    setFormTouched(true);
  };

  const removeMediaItem = (id: string) => {
    setMediaItems(prev => prev.filter(m => m.id !== id));
    setFormTouched(true);
  };

  // ─── Margin ──────────────────────────────────────────────
  const marginData = useMemo(
    () =>
      calculateBasketMargin(
        formData,
        selectedProducts,
        products,
        productPriceNow
      ),
    [formData, selectedProducts, products, productPriceNow]
  );

  // ─── Submit ──────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      try {
        const variantTypes = variants.map(v => v.variant);
        if (new Set(variantTypes).size !== variantTypes.length) {
          throw new Error('Eyni növ variantdan yalnız bir dəfə əlavə edilə bilər');
        }
        if (!formData.name?.trim()) throw new Error('Səbət adı tələb olunur');
        if (!formData.slug?.trim()) throw new Error('Slug tələb olunur');
        if (
          !formData.description?.trim() ||
          formData.description.length < 10
        ) {
          throw new Error('Təsvir ən azı 10 simvol olmalıdır');
        }

        const preparedVariants = variants.map(v => ({
          id: v.id || undefined,
          variant: v.variant,
          price: String(v.price || '0'),
          originalPrice: v.originalPrice || undefined,
          stock: Number(v.stock) || 0,
          gift: v.gift || undefined,
          contents: (v.contents || []).map((c: string) => ({
            content: c,
            displayOrder: 0,
          })),
          extras: (v.extras || []).map((e: string) => ({
            extra: e,
            displayOrder: 0,
          })),
        }));

        const preparedProducts = selectedProducts
          .filter(p => p.productId)
          .map(p => ({
            productId: p.productId,
            productVariantId: p.variantId || null,
            quantity: String(p.quantity || 1),
            unit: 'əd',
            displayOrder: 0,
          }));

        const preparedMedia = mediaItems.map(m => ({
          type: m.type,
          url: m.url,
          altText: m.altText || '',
          displayOrder: m.displayOrder,
        }));

        await onSave({
          ...formData,
          variants: preparedVariants as any,
          products: preparedProducts as any,
          media: preparedMedia as any,
        });

        toast.success('Səbət uğurla yadda saxlanıldı!');
        onClose();
      } catch (err: any) {
        setError(err?.message || 'Səhv baş verdi');
        toast.error(err?.message || 'Səhv baş verdi');
      } finally {
        setLoading(false);
      }
    },
    [formData, variants, selectedProducts, mediaItems, onSave, onClose]
  );

  // ─── Close confirmation ─────────────────────────────────
  const handleClose = useCallback(() => {
    if (formTouched && basket && Object.keys(basket).length > 1) {
      if (confirm('Dəyişikliklər itəcək. Çıxmaq istədiyinizə əminsiniz?')) {
        onClose();
      }
    } else {
      onClose();
    }
  }, [formTouched, basket, onClose]);

  if (!open) return null;

  // ─── Render ──────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col border border-emerald-100"
          onClick={e => e.stopPropagation()}
        >
          {/* ── Header ─────────────────────────────────── */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-white to-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                {basket && Object.keys(basket).length > 1 ? (
                  <Tag className="w-6 h-6" />
                ) : (
                  <Plus className="w-6 h-6" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {basket && Object.keys(basket).length > 1
                    ? 'Səbəti redaktə et'
                    : 'Yeni səbət yarat'}
                </h2>
                <p className="text-sm text-gray-500">
                  {basket && Object.keys(basket).length > 1
                    ? `${(basket as Basket).name} üçün dəyişikliklər`
                    : 'Premium məhsul səbəti dizayn edin'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {formTouched && (
                <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-full font-medium">
                  Dəyişiklik edildi
                </span>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* ── Tab Navigation ─────────────────────────── */}
          <div className="flex-shrink-0 px-6 py-3 bg-gray-50/80 border-b border-gray-200 flex items-center gap-2 overflow-x-auto">
            <TabButton
              active={activeTab === 'general'}
              onClick={() => setActiveTab('general')}
              icon={<Tag className="w-4 h-4" />}
              label="Əsas məlumatlar"
            />
            <TabButton
              active={activeTab === 'variants'}
              onClick={() => setActiveTab('variants')}
              icon={<Layers className="w-4 h-4" />}
              label="Variantlar"
              count={variants.length}
            />
            <TabButton
              active={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              icon={<ShoppingBag className="w-4 h-4" />}
              label="Məhsullar"
              count={selectedProducts.length}
            />
            <TabButton
              active={activeTab === 'media'}
              onClick={() => setActiveTab('media')}
              icon={<Image className="w-4 h-4" />}
              label="Media"
              count={mediaItems.length}
            />
          </div>

          {/* ── Form Content ───────────────────────────── */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            {error && (
              <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* ── GENERAL TAB ────────────────────── */}
              {activeTab === 'general' && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Səbət adı <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={String(formData.name || '')}
                        onChange={val => handleFieldChange('name', val)}
                        required
                        placeholder="Məs: Yaz səbəti, Premium meyvə dəsti..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Slug <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={String(formData.slug || '')}
                        onChange={val => handleFieldChange('slug', val)}
                        required
                        placeholder="yaz-sebeti"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      Təsvir <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      value={String(formData.description || '')}
                      onChange={e =>
                        handleFieldChange('description', e.target.value)
                      }
                      required
                      rows={4}
                      placeholder="Səbətin tərkibi, faydaları, xüsusiyyətləri haqqında ətraflı..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Minimum 10 simvol. SEO üçün açar sözlər daxil edin.
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      Şüar (tagline)
                    </label>
                    <Input
                      value={String(formData.tagline || '')}
                      onChange={val => handleFieldChange('tagline', val)}
                      placeholder="Qısa təsvir — kartın üstündə görünəcək"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Növ
                      </label>
                      <select
                        value={String(formData.type || 'custom')}
                        onChange={e =>
                          handleFieldChange('type', e.target.value)
                        }
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none bg-white text-gray-700"
                      >
                        <option value="gence">🌅 Gəncə</option>
                        <option value="gedebey">🏔 Gədəbəy</option>
                        <option value="sheki">🏛 Şəki</option>
                        <option value="lenkaran">🌊 Lənkəran</option>
                        <option value="ramazan">🌙 Ramazan</option>
                        <option value="custom">✨ Xüsusi</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Ümumi stok
                      </label>
                      <Input
                        type="number"
                        value={formData.stock ?? 0}
                        onChange={val =>
                          handleNumberFieldChange('stock', String(val))
                        }
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Endirim %
                      </label>
                      <Input
                        type="number"
                        value={formData.discount ?? 0}
                        onChange={val =>
                          handleNumberFieldChange('discount', String(val))
                        }
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Mənşə
                      </label>
                      <Input
                        value={String(formData.origin || '')}
                        onChange={val => handleFieldChange('origin', val)}
                        placeholder="Gədəbəy"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Porsiya
                      </label>
                      <Input
                        value={String(formData.servings || '')}
                        onChange={val => handleFieldChange('servings', val)}
                        placeholder="4-6 nəfər"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Vahid
                      </label>
                      <Input
                        value={String(formData.unit || 'səbət')}
                        onChange={val => handleFieldChange('unit', val)}
                        placeholder="səbət"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                        Təravət
                      </label>
                      <Input
                        value={String(formData.freshness || '')}
                        onChange={val => handleFieldChange('freshness', val)}
                        placeholder="7 gün"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Status & Etiketlər
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.isActive ?? true)}
                          onChange={e =>
                            handleFieldChange('isActive', e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Aktiv</span>
                      </label>
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.bestseller ?? false)}
                          onChange={e =>
                            handleFieldChange('bestseller', e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Bestseller</span>
                      </label>
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.trending ?? false)}
                          onChange={e =>
                            handleFieldChange('trending', e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Trend</span>
                      </label>
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.new ?? false)}
                          onChange={e =>
                            handleFieldChange('new', e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Yeni</span>
                      </label>
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={Boolean(formData.lowStock ?? false)}
                          onChange={e =>
                            handleFieldChange('lowStock', e.target.checked)
                          }
                          className="accent-emerald-500 w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Az qalıb</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                      SEO
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Meta başlıq
                        </label>
                        <Input
                          value={String(formData.metaTitle || '')}
                          onChange={val => handleFieldChange('metaTitle', val)}
                          placeholder="SEO başlığı"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Meta təsvir
                        </label>
                        <Input
                          value={String(formData.metaDescription || '')}
                          onChange={val => handleFieldChange('metaDescription', val)}
                          placeholder="SEO təsviri"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── VARIANTS TAB ────────────────────── */}
              {activeTab === 'variants' && (
                <motion.div
                  key="variants"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 space-y-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">
                        Variant tənzimləmələri
                      </h3>
                      <p className="text-sm text-gray-500">
                        Hər variant üçün fərqli qiymət, stok və bonus təyin edin
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={addVariant}
                      disabled={variants.length >= 3}
                    >
                      <Plus className="w-4 h-4 mr-1" /> Yeni variant
                    </Button>
                  </div>

                  {variants.length >= 3 && (
                    <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-xl">
                      Maksimum 3 variant əlavə edilə bilər (econom, standard, premium)
                    </p>
                  )}

                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <motion.div
                        key={variant._key}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border-2 rounded-2xl p-5 space-y-4 ${
                          variant.variant === 'premium'
                            ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50'
                            : variant.variant === 'standard'
                            ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50'
                            : 'border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                variant.variant === 'premium'
                                  ? 'bg-amber-500 text-white'
                                  : variant.variant === 'standard'
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-gray-400 text-white'
                              }`}
                            >
                              <Layers className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 capitalize text-lg">
                                {variant.variant === 'econom'
                                  ? 'Econom'
                                  : variant.variant === 'standard'
                                  ? 'Standard'
                                  : 'Premium'}
                              </span>
                              <p className="text-xs text-gray-500">
                                {variant.variant === 'premium'
                                  ? 'Ən yüksək keyfiyyətli paket'
                                  : variant.variant === 'standard'
                                  ? 'Balanslı keyfiyyət paketi'
                                  : 'Sərfəli paket'}
                              </p>
                            </div>
                          </div>
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                              Qiymət (₼) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={variant.price}
                              onChange={e =>
                                updateVariant(index, 'price', e.target.value)
                              }
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none bg-white text-gray-700"
                              min="0"
                              step="0.01"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                              Stok
                            </label>
                            <input
                              type="number"
                              value={variant.stock}
                              onChange={e =>
                                updateVariant(
                                  index,
                                  'stock',
                                  Number(e.target.value) || 0
                                )
                              }
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none bg-white text-gray-700"
                              min="0"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-600 mb-1 block">
                              Orijinal qiymət
                            </label>
                            <input
                              type="number"
                              value={variant.originalPrice}
                              onChange={e =>
                                updateVariant(
                                  index,
                                  'originalPrice',
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none bg-white text-gray-700"
                              min="0"
                              step="0.01"
                              placeholder="Endirim göstərmək üçün"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">
                            Hədiyyə / Bonus
                          </label>
                          <input
                            type="text"
                            value={variant.gift}
                            onChange={e =>
                              updateVariant(index, 'gift', e.target.value)
                            }
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none bg-white text-gray-700"
                            placeholder="Məs: 1 kq bal hədiyyə"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">
                            Səbətin məzmunu{' '}
                            <span className="text-gray-400">
                              (hər sətrə bir məhsul)
                            </span>
                          </label>
                          <textarea
                            value={variant.contents.join('\n')}
                            onChange={e =>
                              updateVariant(
                                index,
                                'contents',
                                e.target.value.split('\n').filter(c => c.trim())
                              )
                            }
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none bg-white text-gray-700"
                            rows={3}
                            placeholder="Alma\nArmud\nPortağal\nNar"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-gray-600 mb-1 block">
                            Əlavə bonuslar{' '}
                            <span className="text-gray-400">
                              (hər sətrə bir)
                            </span>
                          </label>
                          <textarea
                            value={variant.extras.join('\n')}
                            onChange={e =>
                              updateVariant(
                                index,
                                'extras',
                                e.target.value.split('\n').filter(ex => ex.trim())
                              )
                            }
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none bg-white text-gray-700"
                            rows={2}
                            placeholder="Bal qabı\nQoz ləpəsi"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── PRODUCTS TAB ────────────────────── */}
              {activeTab === 'products' && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 space-y-6"
                >
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                      Məhsul əlavə et
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Səbətin tərkibinə daxil olan məhsulları seçin
                    </p>
                    <ProductSelector
                      products={products}
                      onAddProduct={addProduct}
                    />
                  </div>

                  {/* Margin info */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-emerald-800">
                        Maliyyə təhlili
                      </p>
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Seçilmiş məhsullara əsasən hesablanır
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Gəlir</p>
                        <p className="text-lg font-black text-emerald-600">
                          {formatCurrency(marginData.totalRevenue)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Maya</p>
                        <p className="text-lg font-black text-gray-600">
                          {formatCurrency(marginData.totalCost)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Mənfəət</p>
                        <p
                          className={`text-lg font-black ${
                            marginData.profit >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {formatCurrency(marginData.profit)}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Marja</p>
                        <p
                          className={`text-lg font-black ${
                            marginData.margin >= 0
                              ? 'text-emerald-600'
                              : 'text-red-600'
                          }`}
                        >
                          {marginData.margin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Selected products list */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-800">
                        Seçilmiş məhsullar ({selectedProducts.length})
                      </h3>
                      {selectedProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                'Bütün məhsulları silmək istədiyinizə əminsiniz?'
                              )
                            ) {
                              setSelectedProducts([]);
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Hamısını sil
                        </button>
                      )}
                    </div>
                    <SelectedProductsList
                      items={selectedProducts}
                      products={products}
                      onRemove={removeProduct}
                      onUpdate={updateProduct}
                    />
                  </div>
                </motion.div>
              )}

              {/* ── MEDIA TAB ─────────────────────── */}
              {activeTab === 'media' && (
                <motion.div
                  key="media"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6 space-y-6"
                >
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">
                      Media əlavə et
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Səbətə aid şəkil və ya video linkləri
                    </p>
                    <div className="flex items-end gap-3 mb-6">
                      <div className="flex-1">
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          URL
                        </label>
                        <input
                          type="text"
                          value={newMediaUrl}
                          onChange={(e) => setNewMediaUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 outline-none bg-white text-gray-700"
                        />
                      </div>
                      <div className="w-32">
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">
                          Tip
                        </label>
                        <select
                          value={newMediaType}
                          onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-emerald-500 outline-none bg-white text-gray-700"
                        >
                          <option value="image">Şəkil</option>
                          <option value="video">Video</option>
                        </select>
                      </div>
                      <Button
                        type="button"
                        onClick={addMediaItem}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Əlavə et
                      </Button>
                    </div>
                  </div>

                  {/* Media list */}
                  {mediaItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mediaItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative group border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          {item.type === 'image' ? (
                            <div className="aspect-video relative bg-gray-100">
                              <img
                                src={item.url}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,...'; // fallback
                                }}
                              />
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 flex items-center justify-center">
                              <Camera className="w-12 h-12 text-gray-400" />
                              <span className="text-xs text-gray-500 ml-2">{item.url}</span>
                            </div>
                          )}
                          <div className="p-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                            <button
                              type="button"
                              onClick={() => removeMediaItem(item.id)}
                              className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm text-gray-500">Hələ media əlavə edilməyib</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Yuxarıdakı formu istifadə edərək şəkil və ya video linki əlavə edin
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* ── Footer ─────────────────────────────────── */}
          <div className="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50/80 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <p className="text-xs text-gray-400">
              {basket && Object.keys(basket).length > 1
                ? 'Dəyişikliklər yadda saxlanacaq'
                : 'Yeni səbət bazaya əlavə olunacaq'}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="px-6"
              >
                Ləğv et
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={loading}
                className="min-w-[160px] bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saxlanılır...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Saxla
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Helper icon (Check) ────────────────────────────────────
function Check({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}