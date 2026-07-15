// src/components/admin/products/VariantSelector.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { resolveVariant, type ResolvedVariant } from '@/lib/utils/variant-utils';
import { Input, Select, Button, Tooltip } from '@/components/atoms';
import { Plus, Trash2, Package, Layers } from 'lucide-react';

interface VariantSelectorProps {
  productId: string;
  selectedVariantId: string | null;
  onVariantChange: (variant: ResolvedVariant) => void;
  onVariantAdd?: () => void;
  onVariantRemove?: (variantId: string) => void;
  disabled?: boolean;
}

export function VariantSelector({
  productId,
  selectedVariantId,
  onVariantChange,
  onVariantAdd,
  onVariantRemove,
  disabled = false,
}: VariantSelectorProps) {
  const [variants, setVariants] = useState<ResolvedVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ResolvedVariant | null>(null);

  // Load variants
  useEffect(() => {
    async function loadVariants() {
      setLoading(true);
      try {
        const { db } = await import('@/lib/db');
        const { productVariants } = await import('@/lib/db/schema');
        const { eq } = await import('drizzle-orm');

        const variantsData = await db.query.productVariants.findMany({
          where: eq(productVariants.productId, productId),
          with: { product: true },
        });

        const resolved = variantsData.map((v) => ({
          variantId: v.id,
          productId: v.productId,
          price: parseFloat(v.basePrice || '0'),
          stock: v.stock || 0,
          costPrice: v.costPrice ? parseFloat(v.costPrice) : undefined,
          unit: v.unit || 'ədəd',
          isDefault: v.isDefault || false,
          isProductFallback: false,
        }));

        setVariants(resolved);

        // Find selected variant
        if (selectedVariantId) {
          const found = resolved.find((v) => v.variantId === selectedVariantId);
          if (found) {
            setSelected(found);
            onVariantChange(found);
          }
        } else {
          // Select default variant
          const defaultVariant = resolved.find((v) => v.isDefault) || resolved[0];
          if (defaultVariant) {
            setSelected(defaultVariant);
            onVariantChange(defaultVariant);
          }
        }
      } catch (error) {
        console.error('Error loading variants:', error);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      loadVariants();
    }
  }, [productId, selectedVariantId, onVariantChange]);

  const handleSelect = useCallback(
    (variantId: string) => {
      const variant = variants.find((v) => v.variantId === variantId);
      if (variant) {
        setSelected(variant);
        onVariantChange(variant);
      }
    },
    [variants, onVariantChange]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
        <Package className="mx-auto h-8 w-8 text-slate-300" />
        <p>Bu məhsul üçün variant yoxdur</p>
        {onVariantAdd && (
          <Button variant="secondary" size="sm" onClick={onVariantAdd} className="mt-2">
            <Plus className="h-4 w-4" /> Variant əlavə et
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Layers className="h-4 w-4 text-emerald-600" />
          Variant seçin
        </label>
        {onVariantAdd && (
          <Button variant="secondary" size="sm" onClick={onVariantAdd}>
            <Plus className="h-3 w-3" /> Yeni variant
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {variants.map((variant) => {
          const isSelected = selected?.variantId === variant.variantId;
          const stock = variant.stock;
          const isLowStock = stock > 0 && stock <= 5;

          return (
            <button
              key={variant.variantId}
              onClick={() => handleSelect(variant.variantId)}
              disabled={disabled}
              className={`relative rounded-xl border-2 p-3 text-left transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
              } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-800">
                    {variant.isDefault ? (
                      <span className="flex items-center gap-1">
                        {variant.variantId.slice(0, 8)}
                        <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          Əsas
                        </span>
                      </span>
                    ) : (
                      variant.variantId.slice(0, 8)
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {variant.unit} · {variant.price.toFixed(2)} ₼
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  {isLowStock && (
                    <span className="text-[10px] font-bold text-orange-500">
                      Son {stock} ədəd
                    </span>
                  )}
                  {stock === 0 && (
                    <span className="text-[10px] font-bold text-red-500">Stoksuz</span>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-3 w-3" />
                </div>
              )}

              {onVariantRemove && !variant.isDefault && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVariantRemove(variant.variantId);
                  }}
                  className="absolute -bottom-1 -right-1 rounded-full bg-red-100 p-1 text-red-500 hover:bg-red-200"
                  aria-label="Sil"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}