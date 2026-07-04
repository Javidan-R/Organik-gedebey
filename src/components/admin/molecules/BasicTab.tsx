// src/components/admin/molecules/BasicTab.tsx
'use client';

import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Tag,
  MapPin,
  Leaf,
  Crown,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Star,
  Sparkles,
  FileText,
  Link2,
} from 'lucide-react';
import { Product, Category, ProductStatus } from '@/types/products';
import {
  Input,
  Textarea,
  Button,
  Switch,
  ArrayFieldInput,
  Tooltip,
  Select,
} from '@/components/atoms';

interface BasicTabProps {
  product: Product;
  setProduct: React.Dispatch<React.SetStateAction<Product>>;
  categories: Category[];
  submitted: boolean;
  generateSlug: () => void;
}

export function BasicTab({
  product,
  setProduct,
  categories,
  submitted,
  generateSlug,
}: BasicTabProps) {
  const nameValid = product.name.trim().length > 0;
  const categoryValid = !!product.categoryId;
  const baseValid = nameValid && categoryValid;

  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Kateqoriya seçin' },
      ...categories.map((c) => ({ value: c.id, label: c.name })),
    ],
    [categories]
  );

  const handleFieldChange = useCallback(
    <K extends keyof Product>(field: K, value: Product[K]) => {
      setProduct((prev) => ({ ...prev, [field]: value }));
      if (field === 'name' && !product.slug) {
        generateSlug();
      }
    },
    [product.slug, setProduct, generateSlug]
  );

  const handleStatusTagToggle = useCallback((tag: ProductStatus) => {
    const current = product.statusTags || [];
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    setProduct((prev) => ({ ...prev, statusTags: updated }));
  }, [product.statusTags, setProduct]);

  return (
    <div className="space-y-8">
      {/* Xəta mesajı */}
      {submitted && !baseValid && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <AlertCircle className="h-5 w-5" />
          <span>Ad və kateqoriya mütləq doldurulmalıdır.</span>
        </motion.div>
      )}

      {/* ─── Bölmə 1: Əsas Məlumatlar ───────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
          <Package className="h-5 w-5 text-emerald-600" />
          Əsas Məlumatlar
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Ad */}
          <Input
            label="Məhsul Adı"
            name="name"
            value={product.name}
            onChange={(value) => handleFieldChange('name', value)}
            placeholder="Məs: Gədəbəy Dağ Balı"
            required
            error={submitted && !nameValid ? 'Ad mütləqdir' : undefined}
            icon={<Package className="h-4 w-4" />}
            className="border-2"
          />

          {/* Slug */}
          <div className="space-y-1">
            <Input
              label="Slug (URL üçün)"
              name="slug"
              value={product.slug}
              onChange={(value) => handleFieldChange('slug', value)}
              placeholder="məs: gedebey-dag-bali"
              icon={<Link2 className="h-4 w-4" />}
              className="border-2"
              helper="Məhsulun URL-də istifadə olunacaq unikal identifikator"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={generateSlug}
              className="mt-1"
            >
              Ad əsasında avtomatik yarat
            </Button>
          </div>
        </div>

        {/* Kateqoriya */}
        <div className="mt-4 max-w-md">
          <Select
            label="Kateqoriya"
            value={product.categoryId || ''}
            onChange={(value) => handleFieldChange('categoryId', value)}
            options={categoryOptions}
            required
            error={submitted && !categoryValid ? 'Kateqoriya mütləqdir' : undefined}
          />
        </div>
      </div>

      {/* ─── Bölmə 2: Təsvir ────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          Təsvir
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Textarea
            label="Qısa Təsvir (meta)"
            name="shortDescription"
            value={product.shortDescription || ''}
            onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
            placeholder="Məhsul haqqında qısa məlumat (SEO üçün)"
            rows={2}
            className="border-2"
          />
          <Textarea
            label="Tam Təsvir"
            name="description"
            value={product.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Məhsul haqqında ətraflı məlumat"
            rows={4}
            className="border-2"
          />
        </div>
      </div>

      {/* ─── Bölmə 3: Mənşə və Xüsusiyyətlər ───────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-600" />
          Mənşə və Xüsusiyyətlər
        </h3>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Mənşə Regionu */}
          <Input
            label="Mənşə Regionu"
            name="originRegion"
            value={product.originRegion || ''}
            onChange={(value) => handleFieldChange('originRegion', value)}
            placeholder="Məs: Gədəbəy, Şəki"
            icon={<MapPin className="h-4 w-4" />}
            className="border-2"
          />

          {/* Etiketlər */}
          <ArrayFieldInput
            label="Etiketlər"
            items={product.tags || []}
            setItems={(newTags) => handleFieldChange('tags', newTags)}
            placeholder="Məs: organik, təbii, bal"
            icon={<Tag className="h-4 w-4" />}
            limit={10}
          />
        </div>

        {/* Status Etiketləri */}
        <div className="mt-5">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-amber-500" />
            Status Etiketləri
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { key: 'newArrival' as ProductStatus, label: 'Yeni gələn', icon: <Leaf className="h-4 w-4" /> },
              { key: 'featured' as ProductStatus, label: 'Seçilmiş', icon: <Crown className="h-4 w-4" /> },
              { key: 'seasonal' as ProductStatus, label: 'Mövsümi', icon: <Calendar className="h-4 w-4" /> },
            ].map(({ key, label, icon }) => {
              const active = (product.statusTags || []).includes(key);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600">{icon}</span>
                    <span className="text-sm font-medium text-slate-700">{label}</span>
                  </div>
                  <Switch
                    label=""
                    checked={active}
                    onChange={() => handleStatusTagToggle(key)}
                    className="border-0 bg-transparent p-0 shadow-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Bölmə 4: Xüsusi Xüsusiyyətlər ────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-slate-800 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          Xüsusi Xüsusiyyətlər
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Switch
            label="Organik"
            checked={product.isOrganic || false}
            onChange={(checked) => handleFieldChange('isOrganic', checked)}
            description="100% təbii, kimyəvi gübrəsiz"
            className="border-slate-200 bg-white"
          />
          <Switch
            label="Qlütensiz"
            checked={product.isGlutenFree || false}
            onChange={(checked) => handleFieldChange('isGlutenFree', checked)}
            className="border-slate-200 bg-white"
          />
          <Switch
            label="Vegan"
            checked={product.isVegan || false}
            onChange={(checked) => handleFieldChange('isVegan', checked)}
            className="border-slate-200 bg-white"
          />
        </div>
      </div>

      {/* ─── Bölmə 5: SEO (yığıla bilən) ────────────────────────── */}
      <details className="rounded-2xl border border-slate-200 bg-white/50 p-4 shadow-sm transition hover:shadow-md">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Tag className="h-4 w-4 text-slate-500" />
          SEO Parametrləri
          <span className="ml-auto text-xs text-slate-400">(meta title & description)</span>
        </summary>
        <div className="mt-4 space-y-5">
          <Input
            label="Meta Title"
            name="metaTitle"
            value={product.metaTitle || ''}
            onChange={(value) => handleFieldChange('metaTitle', value)}
            placeholder="Səhifə başlığı (70 simvol)"
            className="border-2"
          />
          <Textarea
            label="Meta Description"
            name="metaDescription"
            value={product.metaDescription || ''}
            onChange={(e) => handleFieldChange('metaDescription', e.target.value)}
            placeholder="Səhifə təsviri (160 simvol)"
            rows={2}
            className="border-2"
          />
          <ArrayFieldInput
            label="Meta Açar Sözlər"
            items={product.metaKeywords || []}
            setItems={(newKeywords) => handleFieldChange('metaKeywords', newKeywords)}
            placeholder="organik, təbii, bal"
            icon={<Tag className="h-4 w-4" />}
            limit={10}
          />
        </div>
      </details>

      {/* ─── Xülasə ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-emerald-50/50 p-4 text-xs text-slate-600">
        <p className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Bütün dəyişikliklər avtomatik olaraq yadda saxlanılır.
          {!baseValid && submitted && (
            <span className="text-rose-600">Zəhmət olmasa ad və kateqoriyanı doldurun.</span>
          )}
        </p>
      </div>
    </div>
  );
}

export default BasicTab;