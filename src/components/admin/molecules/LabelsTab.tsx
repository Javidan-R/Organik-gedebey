// src/components/admin/organisms/LabelsTab.tsx
'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Tag,
  Stars,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Product, ProductStatus } from '@/types/products';
import {
  Switch,
  ArrayFieldInput,
  Button,
  Tooltip,
} from '@/components/atoms';

interface LabelsTabProps {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
}

export function LabelsTab({ product, setProduct }: LabelsTabProps) {
  const handleStatusTagToggle = useCallback((tag: ProductStatus) => {
    const current = product.statusTags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setProduct((prev) => ({ ...prev, statusTags: updated }));
  }, [product.statusTags, setProduct]);

  return (
    <div className="space-y-8">
      {/* Status Etiketləri */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Stars className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-800">Status Etiketləri</h3>
          <Tooltip content="Məhsulun vitrində hansı statuslarla göstəriləcəyini təyin edin">
            <Button variant="ghost" size="xs" iconOnly>
              <AlertCircle className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: 'newArrival' as ProductStatus, label: 'Yeni gələn', description: 'Son 7 gün ərzində əlavə olunub' },
            { key: 'featured' as ProductStatus, label: 'Seçilmiş', description: 'Ana səhifədə vurğulanır' },
            { key: 'seasonal' as ProductStatus, label: 'Mövsümi', description: 'Cari mövsümə uyğun məhsul' },
            { key: 'bestSeller' as ProductStatus, label: 'Çox satılan', description: 'Ən çox satılan məhsullar arasında' },
            { key: 'limited' as ProductStatus, label: 'Məhdud sayda', description: 'Stok məhduddur, tez bitə bilər' },
          ].map(({ key, label, description }) => {
            const active = (product.statusTags || []).includes(key);
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <Switch
                  label={label}
                  checked={active}
                  onChange={() => handleStatusTagToggle(key)}
                  description={description}
                  className="border-0 bg-transparent p-0 shadow-none"
                />
                {active && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Aktiv
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Xüsusi Etiketlər (tags) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-800">Xüsusi Etiketlər</h3>
          <Tooltip content="Məhsul üçün əlavə etiketlər (məsələn: organik, təbii, gluten-free)">
            <Button variant="ghost" size="xs" iconOnly>
              <AlertCircle className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <ArrayFieldInput
          label="Etiketlər"
          items={product.tags || []}
          setItems={(newTags) => setProduct((prev) => ({ ...prev, tags: newTags }))}
          placeholder="Məs: organik, təbii, gluten-free"
          icon={<Tag className="h-4 w-4" />}
          limit={15}
        />
        <p className="text-xs text-slate-500">
          Bu etiketlər məhsulun axtarışda və filtrlərdə tapılmasına kömək edir.
        </p>
      </div>

      {/* Açar Sözlər (SEO) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-bold text-slate-800">Açar Sözlər (SEO)</h3>
          <Tooltip content="Axtarış motorları üçün açar sözlər">
            <Button variant="ghost" size="xs" iconOnly>
              <AlertCircle className="h-4 w-4" />
            </Button>
          </Tooltip>
        </div>
        <ArrayFieldInput
          label="Meta Açar Sözlər"
          items={product.metaKeywords || []}
          setItems={(newKeywords) => setProduct((prev) => ({ ...prev, metaKeywords: newKeywords }))}
          placeholder="organik, təbii, bal, Gədəbəy"
          icon={<Sparkles className="h-4 w-4" />}
          limit={15}
        />
        <p className="text-xs text-slate-500">
          Bu açar sözlər axtarış motorlarında məhsulun daha yaxşı tapılmasına kömək edir.
        </p>
      </div>
    </div>
  );
}

export default LabelsTab;