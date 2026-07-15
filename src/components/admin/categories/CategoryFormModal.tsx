// src/components/admin/CategoryFormModal.tsx
// Tam, qısaldılmamış, production-ready, react-hot-toast və atoms ilə

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { classNames } from '@/lib/utils/classnames';
import { generateCategorySlug } from '@/lib/category-helpers';
import toast from 'react-hot-toast';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import { Button } from '@/components/atoms/button';
import { Switch } from '@/components/atoms/switch';
import type { Category, CategoryCreateInput } from '@/types/category';

interface CategoryFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: Category | null;
  onClose: () => void;
  onSave: (data: CategoryCreateInput) => Promise<void>;
}

export function CategoryFormModal({
  open,
  mode,
  initialData,
  onClose,
  onSave,
}: CategoryFormModalProps) {
  const [formData, setFormData] = useState<CategoryCreateInput>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    imageId: '',
    imageAlt: '',
    color: '#22C55E',
    icon: 'Folder',
    parentId: null,
    displayOrder: 0,
    isFeatured: false,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [slugLocked, setSlugLocked] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && mode === 'edit' && initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        imageUrl: initialData.imageUrl || '',
        imageId: initialData.imageId || '',
        imageAlt: initialData.imageAlt || '',
        color: initialData.color || '#22C55E',
        icon: initialData.icon || 'Folder',
        parentId: initialData.parentId || null,
        displayOrder: initialData.displayOrder || 0,
        isFeatured: initialData.isFeatured ?? false,
        isActive: initialData.isActive ?? true,
        metaTitle: initialData.metaTitle || '',
        metaDescription: initialData.metaDescription || '',
        metaKeywords: initialData.metaKeywords || '',
      });
      setSlugLocked(true);
    } else if (open && mode === 'create') {
      setFormData({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        imageId: '',
        imageAlt: '',
        color: '#22C55E',
        icon: 'Folder',
        parentId: null,
        displayOrder: 0,
        isFeatured: false,
        isActive: true,
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
      });
      setSlugLocked(false);
      setImageError(false);
    }
  }, [open, mode, initialData]);

  useEffect(() => {
    if (!slugLocked && formData.name) {
      const newSlug = generateCategorySlug(formData.name);
      setFormData((prev) => ({ ...prev, slug: newSlug }));
    }
  }, [formData.name, slugLocked]);

  const handleChange = (field: keyof CategoryCreateInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/categories/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Yükləmə xətası');
      }
      const data = await res.json();
      setFormData((prev) => ({
        ...prev,
        imageUrl: data.imageUrl,
        imageId: data.imageId,
        imageAlt: file.name.split('.')[0] || '',
      }));
      toast.success('Şəkil yükləndi');
    } catch (error: any) {
      toast.error(error.message || 'Şəkil yüklənərkən xəta');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Kateqoriya adı tələb olunur');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('Slug tələb olunur');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      // error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {mode === 'create' ? 'Yeni kateqoriya' : 'Kateqoriyanı redaktə et'}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {mode === 'create' ? 'Mağazaya yeni bölmə əlavə et' : 'Kateqoriya məlumatlarını yenilə'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                <div className="space-y-5">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Kateqoriya şəkli
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden bg-slate-50 flex-shrink-0">
                        {isUploading ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                          </div>
                        ) : formData.imageUrl && !imageError ? (
                          <Image
                            src={formData.imageUrl}
                            alt="Kateqoriya şəkli"
                            fill
                            className="object-cover"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <ImageIcon className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          type="button"
                          variant="soft"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          leftIcon={<Upload className="w-4 h-4" />}
                        >
                          {isUploading ? 'Yüklənir...' : 'Şəkil seç'}
                        </Button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        {formData.imageUrl && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '', imageId: '' }))}
                            className="text-xs text-red-500 hover:text-red-600 text-left"
                          >
                            Şəkli sil
                          </button>
                        )}
                        <p className="text-xs text-slate-400">
                          JPG, PNG, WebP • maks 5MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Name */}
                  <Input
                    label="Kateqoriya adı"
                    name="name"
                    value={formData.name}
                    onChange={(val) => handleChange('name', val)}
                    placeholder="Məs: Təzə tərəvəzlər"
                    required
                  />

                  {/* Slug */}
                  <div>
                    <label className="flex items-center justify-between text-sm font-medium text-slate-700 mb-1">
                      <span>Slug (URL)</span>
                      <button
                        type="button"
                        onClick={() => setSlugLocked(!slugLocked)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        {slugLocked ? '🔒 Avtomatik' : '🔓 Əl ilə'}
                      </button>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">/category/</span>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => handleChange('slug', e.target.value)}
                        disabled={slugLocked}
                        className={classNames(
                          'flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition',
                          slugLocked && 'bg-slate-50 text-slate-500'
                        )}
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">URL dostu olmalıdır, yalnız hərf və tire</p>
                  </div>

                  {/* Description */}
                  <Textarea
                    label="Təsvir"
                    name="description"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    placeholder="Kateqoriya haqqında qısa məlumat"
                  />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Rəng
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={formData.color || '#22C55E'}
                          onChange={(e) => handleChange('color', e.target.value)}
                          className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                        />
                        <Input
                          name="color"
                          value={formData.color || ''}
                          onChange={(val) => handleChange('color', val)}
                          placeholder="#22C55E"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Display Order */}
                    <Input
                      label="Sıra nömrəsi"
                      name="displayOrder"
                      type="number"
                      value={formData.displayOrder || 0}
                      onChange={(val) => handleChange('displayOrder', Number(val))}
                      min={0}
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap gap-4">
                    <Switch
                      label="Önə çıxan"
                      checked={formData.isFeatured || false}
                      onChange={(checked) => handleChange('isFeatured', checked)}
                    />
                    <Switch
                      label="Aktiv"
                      checked={formData.isActive ?? true}
                      onChange={(checked) => handleChange('isActive', checked)}
                    />
                  </div>

                  {/* SEO */}
                  <details className="border-t border-slate-100 pt-4">
                    <summary className="text-sm font-medium text-slate-700 cursor-pointer">
                      SEO məlumatları
                    </summary>
                    <div className="space-y-3 mt-3">
                      <Input
                        label="Meta başlıq"
                        name="metaTitle"
                        value={formData.metaTitle || ''}
                        onChange={(val) => handleChange('metaTitle', val)}
                        placeholder="SEO üçün başlıq"
                      />
                      <Textarea
                        label="Meta təsvir"
                        name="metaDescription"
                        value={formData.metaDescription || ''}
                        onChange={(e) => handleChange('metaDescription', e.target.value)}
                        rows={2}
                        placeholder="SEO üçün təsvir"
                      />
                      <Input
                        label="Meta açar sözlər"
                        name="metaKeywords"
                        value={formData.metaKeywords || ''}
                        onChange={(val) => handleChange('metaKeywords', val)}
                        placeholder="açar söz1, açar söz2, açar söz3"
                      />
                    </div>
                  </details>
                </div>
              </form>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
                <Button variant="ghost" onClick={onClose}>
                  Ləğv et
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  variant="primary"
                  loading={isSubmitting}
                  loadingText="Saxlanılır..."
                >
                  {mode === 'create' ? 'Yarat' : 'Yenilə'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}