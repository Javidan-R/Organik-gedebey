// src/components/admin/organisms/DiscountTab.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Percent,
  Trash2,
  AlertTriangle,
  Calendar,
  DollarSign,
  Tag,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Product } from '@/types/products';
import {
  Input,
  Select,
  Button,
  Tooltip,
  Switch,
} from '@/components/atoms';

interface DiscountTabProps {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
  discountError: string;
  finalPricePreview: number;
  primaryPrice: number;
}

export function DiscountTab({
  product,
  setProduct,
  discountError,
  finalPricePreview,
  primaryPrice,
}: DiscountTabProps) {
  const isDiscountActive = !!(product.discountType && product.discountValue && product.discountValue > 0);

  const clearDiscount = useCallback(() => {
    setProduct((s) => ({
      ...s,
      discountType: undefined,
      discountValue: undefined,
      discountStart: undefined,
      discountEnd: undefined,
    }));
  }, [setProduct]);

  const handleDiscountTypeChange = useCallback((value: string) => {
    setProduct((s) => ({
      ...s,
      discountType: value ? (value as 'percentage' | 'fixed') : undefined,
    }));
  }, [setProduct]);

  const handleDiscountValueChange = useCallback((value: string) => {
    const num = parseFloat(value);
    setProduct((s) => ({
      ...s,
      discountValue: isNaN(num) ? undefined : num,
    }));
  }, [setProduct]);

  const handleDiscountStartChange = useCallback((value: string) => {
    setProduct((s) => ({
      ...s,
      discountStart: value ? new Date(value).toISOString() : undefined,
    }));
  }, [setProduct]);

  const handleDiscountEndChange = useCallback((value: string) => {
    setProduct((s) => ({
      ...s,
      discountEnd: value ? new Date(value).toISOString() : undefined,
    }));
  }, [setProduct]);

  const discountTypeOptions = [
    { value: '', label: 'Seçilmir' },
    { value: 'percentage', label: 'Faiz (%)' },
    { value: 'fixed', label: 'Sabit məbləğ (₼)' },
  ];

  const formatDateForInput = (dateString?: string | null) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const discountPreview = useMemo(() => {
    if (!isDiscountActive) return null;
    const discount = product.discountValue || 0;
    const type = product.discountType;
    if (type === 'percentage') {
      return `${discount}% endirim`;
    } else if (type === 'fixed') {
      return `${discount.toFixed(2)} ₼ endirim`;
    }
    return null;
  }, [isDiscountActive, product.discountType, product.discountValue]);

  return (
    <div className="space-y-6">
      {/* Başlıq və clear düyməsi */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-rose-600" />
          <h3 className="text-lg font-bold text-slate-800">Endirim Ayarları</h3>
          <Tooltip content="Məhsul üçün vaxtı məhdud endirim təyin edin">
            <Button variant="ghost" size="xs" iconOnly>
              <AlertTriangle className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        {isDiscountActive && (
          <Button variant="danger" size="sm" onClick={clearDiscount} >
            Endirimi sil
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Xəta mesajı */}
      {discountError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="h-5 w-5" />
          {discountError}
        </motion.div>
      )}

      {/* Aktiv endirim göstəricisi */}
      {isDiscountActive && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
          <span>
            Endirim aktivdir: <strong>{discountPreview}</strong>
            {product.discountStart && product.discountEnd && (
              <span className="ml-2 text-xs text-emerald-600">
                ({new Date(product.discountStart).toLocaleDateString('az-AZ')} -{' '}
                {new Date(product.discountEnd).toLocaleDateString('az-AZ')})
              </span>
            )}
          </span>
        </div>
      )}

      {/* Endirim növü və dəyəri */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Select
          label="Endirim növü"
          value={product.discountType || ''}
          onChange={handleDiscountTypeChange}
          options={discountTypeOptions}
          className="border-2"
        />
        <Input
          label="Endirim dəyəri"
          name="discountValue"
          type="number"
          step="0.01"
          min="0"
          value={product.discountValue ?? ''}
          onChange={handleDiscountValueChange}
          placeholder="Məs: 10 (faiz) və ya 5.00 (sabit)"
          icon={<Tag className="h-4 w-4" />}
          className="border-2"
          disabled={!product.discountType}
          helper={product.discountType === 'percentage' ? 'Faiz dəyəri (0-100)' : 'Sabit məbləğ (₼)'}
        />
      </div>

      {/* Tarix aralığı */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          label="Başlama tarixi"
          name="discountStart"
          type="datetime-local"
          value={formatDateForInput(product.discountStart)}
          onChange={handleDiscountStartChange}
          icon={<Calendar className="h-4 w-4" />}
          className="border-2"
          helper="Endirimin başlama vaxtı"
        />
        <Input
          label="Bitiş tarixi"
          name="discountEnd"
          type="datetime-local"
          value={formatDateForInput(product.discountEnd)}
          onChange={handleDiscountEndChange}
          icon={<Calendar className="h-4 w-4" />}
          className="border-2"
          helper="Endirimin bitmə vaxtı"
        />
      </div>

      {/* Qiymət önizləməsi */}
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Əsas qiymət</p>
            <p className="text-xl font-extrabold text-slate-700">{primaryPrice.toFixed(2)} ₼</p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Endirim</p>
            <p className="text-xl font-extrabold text-rose-600">
              {isDiscountActive
                ? product.discountType === 'percentage'
                  ? `${product.discountValue}%`
                  : `${product.discountValue?.toFixed(2)} ₼`
                : '-'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-500">Endirimdən sonra</p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {isDiscountActive ? `${finalPricePreview.toFixed(2)} ₼` : `${primaryPrice.toFixed(2)} ₼`}
            </p>
          </div>
        </div>
        {isDiscountActive && (
          <div className="mt-2 text-center text-xs text-emerald-600">
            Qənaət: {(primaryPrice - finalPricePreview).toFixed(2)} ₼
          </div>
        )}
      </div>

      {/* Endirim statusu toggle (aktiv/deaktiv) */}
      {isDiscountActive && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-semibold text-slate-800">Endirimi aktiv et</p>
            <p className="text-xs text-slate-500">Endirimin hazırda aktiv olub-olmadığını tənzimlə</p>
          </div>
          <Switch
            label="Aktiv"
            checked={isDiscountActive}
            onChange={(checked) => {
              if (!checked) {
                clearDiscount();
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

export default DiscountTab;