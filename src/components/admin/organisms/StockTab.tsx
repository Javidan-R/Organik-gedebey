// src/components/admin/organisms/StockTab.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  Trash2,
  DollarSign,
  Package,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Product, ID, Variant } from '@/types/products';
import {
  Input,
  Select,
  Button,
  Tooltip,
} from '@/components/atoms';

// ─── Variant Item Component ──────────────────────────────────────
interface VariantItemProps {
  variant: Variant;
  index: number;
  isPrimary: boolean;
  onUpdate: (index: number, key: keyof Variant, value: string | number | boolean) => void;
  onRemove: (id: ID) => void;
  unitOptions: string[];
  gradeOptions: string[];
}

const VariantItem = ({
  variant,
  index,
  isPrimary,
  onUpdate,
  onRemove,
  unitOptions,
  gradeOptions,
}: VariantItemProps) => {
  const handleChange = (key: keyof Variant, rawValue: string) => {
    let value: string | number = rawValue;
    if (['price', 'stock', 'costPrice', 'arrivalCost', 'minStock'].includes(key)) {
      const num = parseFloat(rawValue);
      value = isNaN(num) ? 0 : num;
    }
    onUpdate(index, key, value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-2xl border p-4 shadow-sm transition-all ${
        isPrimary
          ? 'border-emerald-300 bg-emerald-50/70'
          : 'border-slate-200 bg-white hover:border-emerald-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* Variant Adı */}
          <div className="space-y-1">
            <Input
              label={isPrimary ? 'Əsas Variant' : 'Variant Adı'}
              name={`variant-${index}-name`}
              value={variant.name || ''}
              onChange={(val) => handleChange('name', val)}
              placeholder="Məs: 1 kq, 500 q"
              className="border-2"
              disabled={isPrimary}
            />
          </div>

          {/* Qiymət */}
          <div className="space-y-1">
            <Input
              label="Qiymət (₼)"
              name={`variant-${index}-price`}
              type="number"
              step="0.01"
              min="0"
              value={variant.price ?? ''}
              onChange={(val) => handleChange('price', val)}
              placeholder="0.00"
              icon={<DollarSign className="h-4 w-4" />}
              className="border-2"
            />
          </div>

          {/* Stok */}
          <div className="space-y-1">
            <Input
              label="Stok"
              name={`variant-${index}-stock`}
              type="number"
              step="1"
              min="0"
              value={variant.stock ?? ''}
              onChange={(val) => handleChange('stock', val)}
              placeholder="0"
              icon={<Package className="h-4 w-4" />}
              className="border-2"
            />
          </div>

          {/* Maya Dəyəri */}
          <div className="space-y-1">
            <Input
              label="Maya Dəyəri (₼)"
              name={`variant-${index}-costPrice`}
              type="number"
              step="0.01"
              min="0"
              value={variant.costPrice ?? ''}
              onChange={(val) => handleChange('costPrice', val)}
              placeholder="0.00"
              className="border-2"
            />
          </div>

          {/* Daşınma Xərci */}
          <div className="space-y-1">
            <Input
              label="Daşınma / Alış Xərci (₼)"
              name={`variant-${index}-arrivalCost`}
              type="number"
              step="0.01"
              min="0"
              value={variant.arrivalCost ?? ''}
              onChange={(val) => handleChange('arrivalCost', val)}
              placeholder="0.00"
              className="border-2"
            />
          </div>

          {/* Minimum Stok */}
          <div className="space-y-1">
            <Input
              label="Minimum Stok"
              name={`variant-${index}-minStock`}
              type="number"
              step="1"
              min="0"
              value={variant.minStock ?? ''}
              onChange={(val) => handleChange('minStock', val)}
              placeholder="10"
              className="border-2"
            />
          </div>

          {/* Unit */}
          <div className="space-y-1">
            <Select
              label="Vahid"
              value={variant.unit || 'ədəd'}
              onChange={(val) => handleChange('unit', val)}
              options={unitOptions.map((u) => ({ value: u, label: u }))}
              className="border-2"
            />
          </div>

          {/* Grade */}
          <div className="space-y-1">
            <Select
              label="Grade"
              value={variant.grade || 'A'}
              onChange={(val) => handleChange('grade', val)}
              options={gradeOptions.map((g) => ({ value: g, label: g }))}
              className="border-2"
            />
          </div>

          {/* Batch Tarixi */}
          <div className="space-y-1">
            <Input
              label="Batch Tarixi"
              name={`variant-${index}-batchDate`}
              type="date"
              value={variant.batchDate || ''}
              onChange={(val) => handleChange('batchDate', val)}
              icon={<Calendar className="h-4 w-4" />}
              className="border-2"
            />
          </div>
        </div>

        {/* Silmə Düyməsi */}
        {!isPrimary && (
          <Tooltip content="Variantı sil">
            <Button
              variant="danger"
              size="sm"
              iconOnly
              onClick={() => onRemove(variant.id!)}
              className="mt-6 flex-shrink-0"
              aria-label="Variantı sil"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        )}
      </div>

      {isPrimary && (
        <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Əsas variant - silinə bilməz
        </p>
      )}
    </motion.div>
  );
};

// ─── StockTab Props ─────────────────────────────────────────────
interface StockTabProps {
  product: Product;
  updateVariant: (index: number, key: keyof Variant, rawValue: string) => void;
  addVariant: () => void;
  removeVariant: (id: ID) => void;
}

// ─── Main StockTab Component ──────────────────────────────────
export function StockTab({
  product,
  updateVariant,
  addVariant,
  removeVariant,
}: StockTabProps) {
  const unitOptions = [
    'ədəd', 'kq', 'qram', 'litr', 'ml',
    'qutu', 'set', 'paket', 'banka',
    'balon', 'meşov', 'ramka', 'dəst',
  ];

  const gradeOptions = ['A', 'B', 'C', 'Premium'];

  const handleVariantUpdate = (index: number, key: keyof Variant, value: string | number | boolean) => {
    updateVariant(index, key, String(value));
  };

  const primaryVariant = product.variants?.[0];

  if (!primaryVariant) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <AlertCircle className="h-12 w-12 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">Hələ variant əlavə edilməyib.</p>
        <Button onClick={addVariant} variant="primary" className="mt-4">
          <Plus className="h-4 w-4" />
          İlk Variantı Əlavə Et
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Başlıq */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-800">Stok və Variantlar</h3>
          <Tooltip content="Məhsulun müxtəlif çeşidləri (çəki, ölçü, rəng və s.)">
            <Button variant="ghost" size="xs" iconOnly>
              <AlertCircle className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <Button onClick={addVariant} variant="secondary" size="sm">
          <Plus className="h-4 w-4" />
          Yeni Variant
        </Button>
      </div>

      {/* Variantların Siyahısı */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {product.variants.map((variant, idx) => (
            <VariantItem
              key={variant.id}
              variant={variant}
              index={idx}
              isPrimary={idx === 0}
              onUpdate={handleVariantUpdate}
              onRemove={removeVariant}
              unitOptions={unitOptions}
              gradeOptions={gradeOptions}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Ümumi Stok Məlumatı */}
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Ümumi Stok</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {product.variants.reduce((sum, v) => sum + (v.stock || 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Variant Sayı</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {product.variants.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Orta Qiymət</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {(product.variants.reduce((sum, v) => sum + (v.price || 0), 0) / product.variants.length).toFixed(2)} ₼
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Minimum Stok</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {product.variants.reduce((min, v) => Math.min(min, v.minStock || 10), Infinity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockTab;