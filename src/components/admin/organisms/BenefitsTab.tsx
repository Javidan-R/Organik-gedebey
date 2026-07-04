// src/components/admin/organisms/BenefitsTab.tsx
'use client';

import React, { useCallback } from 'react';
import {
  Info,
  Lightbulb,
  ShieldCheck,
  AlertTriangle,
  Box,
} from 'lucide-react';
import { Product } from '@/types/products';
import {
  ArrayFieldInput,
  Button,
  Tooltip,
} from '@/components/atoms';

interface BenefitsTabProps {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
}

export function BenefitsTab({ product, setProduct }: BenefitsTabProps) {
  const handleFieldChange = useCallback(
    <K extends keyof Product>(field: K, value: Product[K]) => {
      setProduct((prev) => ({ ...prev, [field]: value }));
    },
    [setProduct]
  );

  return (
    <div className="space-y-8">
      {/* Faydalar (Benefits) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Info className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-800">Faydalar</h3>
          <Tooltip content="Məhsulun sağlamlıq və digər faydalarını qeyd edin">
            <Button variant="ghost" size="xs" iconOnly>
              <Info className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <ArrayFieldInput
          label="Faydalar"
          items={product.benefits || []}
          setItems={(newItems) => handleFieldChange('benefits', newItems)}
          placeholder="Məs: İmmuniteti gücləndirir, Enerji verir"
          icon={<Info className="h-4 w-4" />}
          limit={10}
        />
        <p className="text-xs text-slate-500">
          Məhsulun əsas üstünlükləri – müştərilərə çatdırmaq üçün.
        </p>
      </div>

      {/* İstifadə Məsləhətləri (Usage Tips) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-800">İstifadə Məsləhətləri</h3>
          <Tooltip content="Məhsulun düzgün istifadəsi üçün tövsiyələr">
            <Button variant="ghost" size="xs" iconOnly>
              <Lightbulb className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <ArrayFieldInput
          label="Məsləhətlər"
          items={product.usageTips || []}
          setItems={(newItems) => handleFieldChange('usageTips', newItems)}
          placeholder="Məs: Səhər ac qarına 1 xörək qaşığı, Gündə 2 dəfə"
          icon={<Lightbulb className="h-4 w-4" />}
          limit={10}
        />
        <p className="text-xs text-slate-500">
          Müştərilərə məhsulu necə istifadə edəcəkləri barədə məlumat.
        </p>
      </div>

      {/* Sertifikatlar (Certificates) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-800">Sertifikatlar / Keyfiyyət Nişanları</h3>
          <Tooltip content="Məhsulun malik olduğu sertifikatlar və keyfiyyət nişanları">
            <Button variant="ghost" size="xs" iconOnly>
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <ArrayFieldInput
          label="Sertifikatlar"
          items={product.certificates || []}
          setItems={(newItems) => handleFieldChange('certificates', newItems)}
          placeholder="Məs: ISO 22000, Orqanik Sertifikat №123"
          icon={<ShieldCheck className="h-4 w-4" />}
          limit={10}
        />
        <p className="text-xs text-slate-500">
          Məhsulun etibarlılığını təsdiqləyən sənədlər və nişanlar.
        </p>
      </div>

      {/* Allergenlər */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <h3 className="text-lg font-bold text-slate-800">Allergenlər</h3>
          <Tooltip content="Məhsulda ola biləcək allergenlər barədə xəbərdarlıq">
            <Button variant="ghost" size="xs" iconOnly>
              <AlertTriangle className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <ArrayFieldInput
          label="Allergenlər"
          items={product.allergens || []}
          setItems={(newItems) => handleFieldChange('allergens', newItems)}
          placeholder="Məs: Süd məhsulu, Qoz-fındıq izi ola bilər"
          icon={<AlertTriangle className="h-4 w-4" />}
          limit={10}
        />
        <p className="text-xs text-rose-600">
          Allergik reaksiyaları olan müştərilər üçün vacib məlumat.
        </p>
      </div>

      {/* Saxlanma Qeydləri */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <Box className="h-5 w-5 text-slate-600" />
          <h3 className="text-lg font-bold text-slate-800">Saxlanma Qeydləri</h3>
          <Tooltip content="Məhsulun saxlanma şərtləri və tövsiyələri">
            <Button variant="ghost" size="xs" iconOnly>
              <Box className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <ArrayFieldInput
          label="Saxlanma Qeydləri"
          items={product.storageNotes || []}
          setItems={(newItems) => handleFieldChange('storageNotes', newItems)}
          placeholder="Məs: +4…+6°C arasında saxlayın, Günəş işığından uzaq tutun"
          icon={<Box className="h-4 w-4" />}
          limit={10}
        />
        <p className="text-xs text-slate-500">
          Məhsulun təzəliyini qorumaq üçün saxlanma tövsiyələri.
        </p>
      </div>

      {/* Xülasə */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-600">
          <span className="font-semibold">Ümumi məlumat:</span>{' '}
          {[
            (product.benefits?.length || 0) > 0 ? `${product.benefits?.length} fayda` : null,
            (product.usageTips?.length || 0) > 0 ? `${product.usageTips?.length} məsləhət` : null,
            (product.certificates?.length || 0) > 0 ? `${product.certificates?.length} sertifikat` : null,
            (product.allergens?.length || 0) > 0 ? `${product.allergens?.length} allergen` : null,
            (product.storageNotes?.length || 0) > 0 ? `${product.storageNotes?.length} saxlama qeydi` : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Hələ heç bir məlumat əlavə edilməyib'}
        </p>
      </div>
    </div>
  );
}

export default BenefitsTab;