// src/components/admin/organisms/StockTab.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, Plus, Trash2, DollarSign, Package,
  Calendar, AlertCircle, TrendingUp, Wallet,
} from 'lucide-react';
import { Product, ID, Variant } from '@/types/products';
import { Input, Select, Button } from '@/components/atoms';

// ─── Sabit seçimlər ─────────────────────────────────────
const UNIT_OPTIONS = [
  { value: 'ədəd', label: 'ədəd' },
  { value: 'kq', label: 'kq' },
  { value: 'qram', label: 'qram' },
  { value: 'litr', label: 'litr' },
  { value: 'ml', label: 'ml' },
  { value: 'qutu', label: 'qutu' },
  { value: 'set', label: 'set' },
  { value: 'paket', label: 'paket' },
  { value: 'banka', label: 'banka' },
  { value: 'balon', label: 'balon' },
  { value: 'meşov', label: 'meşov' },
];

const GRADE_OPTIONS = [
  { value: 'A', label: 'A – Premium' },
  { value: 'B', label: 'B – Yaxşı' },
  { value: 'C', label: 'C – Standart' },
  { value: 'Unsorted', label: 'Çeşidlənməmiş' },
];

// ─── Props ──────────────────────────────────────────────
interface StockTabProps {
  product: Product;
  updateVariant: (index: number, key: keyof Variant, rawValue: string) => void;
  addVariant: () => void;
  removeVariant: (id: ID) => void;
}

// ─── Təkrar istifadəyə yararlı VariantCard komponenti ──
export const VariantCard = ({
  variant,
  index,
  isPrimary,
  onUpdate,
  onRemove,
}: {
  variant: Variant;
  index: number;
  isPrimary: boolean;
  onUpdate: (index: number, key: keyof Variant, value: string) => void;
  onRemove: (id: ID) => void;
}) => {
  const id = variant.id!;

  const handleSelectChange = (key: keyof Variant) => (value: string) => {
    onUpdate(index, key, value);
  };

  const handleInputChange = (key: keyof Variant) => (value: string) => {
    onUpdate(index, key, value);
  };

  const handleDateChange = (key: keyof Variant) => (value: string) => {
    if (value) {
      onUpdate(index, key, new Date(value).toISOString());
    } else {
      onUpdate(index, key, '');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border-2 p-4 sm:p-5 shadow-sm ${
        isPrimary
          ? 'border-emerald-300 bg-gradient-to-br from-emerald-50 to-green-50'
          : 'border-gray-200 bg-white hover:border-emerald-200'
      }`}
    >
      {/* Başlıq sətri */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
            {index + 1}
          </div>
          <div>
            <input
              type="text"
              value={variant.name}
              onChange={(e) => onUpdate(index, 'name', e.target.value)}
              placeholder="Variant adı"
              disabled={isPrimary}
              className={`text-sm font-bold bg-transparent border-b border-dashed border-gray-300 focus:border-emerald-500 outline-none px-1 py-0.5 w-40 ${
                isPrimary ? 'text-emerald-700' : 'text-gray-800'
              }`}
            />
            {isPrimary && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold ml-2">
                <Package className="w-3 h-3" /> Əsas
              </span>
            )}
          </div>
        </div>

        {!isPrimary && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(id)}
            className="text-red-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Variantı sil"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Input grid – mobil uyğun */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Input
          label="Qiymət (₼)"
          type="number"
          step="0.01"
          min="0"
          value={variant.price ?? ''}
          onChange={handleInputChange('price')}
          placeholder="0.00"
          icon={<DollarSign className="h-4 w-4" />}
          required
          error={variant.price <= 0 ? 'Müsbət qiymət daxil edin' : undefined}
        />
        <Input
          label="Stok"
          type="number"
          step="1"
          min="0"
          value={variant.stock ?? ''}
          onChange={handleInputChange('stock')}
          placeholder="0"
          icon={<Package className="h-4 w-4" />}
        />
        <Input
          label="Maya dəyəri (₼)"
          type="number"
          step="0.01"
          min="0"
          value={variant.costPrice ?? ''}
          onChange={handleInputChange('costPrice')}
          placeholder="0.00"
          icon={<Wallet className="h-4 w-4" />}
        />
        <Input
          label="Alış / Daşınma (₼)"
          type="number"
          step="0.01"
          min="0"
          value={variant.arrivalCost ?? ''}
          onChange={handleInputChange('arrivalCost')}
          placeholder="0.00"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Input
          label="Min. stok"
          type="number"
          step="1"
          min="0"
          value={variant.minStock ?? ''}
          onChange={handleInputChange('minStock')}
          placeholder="10"
          icon={<AlertCircle className="h-4 w-4" />}
        />
        <Input
          label="Partiya tarixi"
          type="date"
          value={variant.batchDate ? variant.batchDate.slice(0, 10) : ''}
          onChange={handleDateChange('batchDate')}
          icon={<Calendar className="h-4 w-4" />}
        />

        <Select
          label="Vahid"
          value={variant.unit ?? 'ədəd'}
          onChange={handleSelectChange('unit')}
          options={UNIT_OPTIONS}
        />
        <Select
          label="Keyfiyyət dərəcəsi"
          value={variant.grade ?? 'A'}
          onChange={handleSelectChange('grade')}
          options={GRADE_OPTIONS}
        />
      </div>
    </motion.div>
  );
};

// ─── Əsas StockTab komponenti ──────────────────────────
export default function StockTab({
  product,
  updateVariant,
  addVariant,
  removeVariant,
}: StockTabProps) {
  if (!product.variants || product.variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">Hələ variant əlavə edilməyib.</p>
        <Button onClick={addVariant} variant="primary" className="mt-4">
          <Plus className="h-4 w-4" /> İlk Variantı Əlavə Et
        </Button>
      </div>
    );
  }

  const totalStock = product.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const totalValue = product.variants.reduce(
    (sum, v) => sum + (Number(v.price) || 0) * (Number(v.stock) || 0),
    0
  );
  const avgPrice =
    product.variants.length > 0
      ? product.variants.reduce((sum, v) => sum + (Number(v.price) || 0), 0) / product.variants.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Başlıq & Əlavə et */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-800">Stok & Variantlar</h3>
          <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5">
            {product.variants.length}
          </span>
        </div>
        <Button onClick={addVariant} variant="secondary" size="sm">
          <Plus className="h-4 w-4" /> Yeni Variant
        </Button>
      </div>

      {/* Variant siyahısı */}
      <div className="space-y-4">
        <AnimatePresence>
          {product.variants.map((variant, idx) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              index={idx}
              isPrimary={idx === 0}
              onUpdate={updateVariant}
              onRemove={removeVariant}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Ümumi statistika */}
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Ümumi Stok</p>
            <p className="text-2xl font-extrabold text-emerald-700">{totalStock}</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Toplam Dəyər</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {totalValue.toFixed(2)} ₼
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Orta Qiymət</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {avgPrice.toFixed(2)} ₼
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Variant Sayı</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {product.variants.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}