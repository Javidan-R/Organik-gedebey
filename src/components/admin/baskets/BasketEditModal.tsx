'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Textarea } from '@/components/atoms/textarea';
import type { Basket, FormVariant, emptyFormVariant, toFormVariant } from '@/types/basket';

interface BasketEditModalProps {
  open: boolean;
  onClose: () => void;
  basket: Basket | null;
  onSave: (basket: Partial<Basket>) => Promise<void>;
}

export default function BasketEditModal({ open, onClose, basket, onSave }: BasketEditModalProps) {
  const [formData, setFormData] = useState<Partial<Basket>>({
    name: '',
    slug: '',
    description: '',
    type: 'custom',
    stock: 0,
    discount: 0,
    isActive: true,
    archived: false,
  });
  const [variants, setVariants] = useState<FormVariant[]>([emptyFormVariant()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (basket) {
      setFormData(basket);
      if (basket.variants && basket.variants.length > 0) {
        setVariants(basket.variants.map(toFormVariant));
      } else {
        setVariants([emptyFormVariant()]);
      }
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
      });
      setVariants([emptyFormVariant()]);
    }
    setError('');
  }, [basket, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSave({
        ...formData,
        variants: variants.map(v => ({
          variant: v.variant,
          price: v.price,
          originalPrice: v.originalPrice || null,
          stock: v.stock,
          gift: v.gift || null,
          contents: v.contents,
          extras: v.extras,
        })),
      });
      onClose();
    } catch (err) {
      setError('Səhv baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, emptyFormVariant()]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: keyof FormVariant, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {basket ? 'Səbəti redaktə et' : 'Yeni səbət yarat'}
              </h2>
              <Button
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ad</label>
                <Input
                  value={formData.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Səbət adı"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Slug</label>
                <Input
                  value={formData.slug || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  placeholder="səbət-slug"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Təsvir</label>
              <Textarea
                value={formData.description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                placeholder="Səbət təsviri"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Növ</label>
                <select
                  value={formData.type || 'custom'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="gence">Gəncə</option>
                  <option value="gedebey">Gədəbəy</option>
                  <option value="sheki">Şəki</option>
                  <option value="lenkaran">Lənkəran</option>
                  <option value="ramazan">Ramazan</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Stok</label>
                <Input
                  type="number"
                  value={formData.stock || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Endirim (%)</label>
                <Input
                  type="number"
                  value={formData.discount || 0}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Kategoriya ID</label>
                <Input
                  value={formData.categoryId || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, categoryId: e.target.value })}
                  placeholder="Kategoriya ID"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Qeyri-aktiv</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mövsümi Başlanğıc</label>
                <Input
                  type="datetime-local"
                  value={formData.seasonalStart ? formData.seasonalStart.slice(0, 16) : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, seasonalStart: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Mövsümi Bitiş</label>
                <Input
                  type="datetime-local"
                  value={formData.seasonalEnd ? formData.seasonalEnd.slice(0, 16) : ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, seasonalEnd: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isSeasonal"
                checked={formData.isSeasonal || false}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, isSeasonal: e.target.checked })}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="isSeasonal" className="text-sm font-medium text-gray-700">
                Mövsümi məhsul
              </label>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Variantlar</h3>
                <Button type="button" variant="secondary" onClick={addVariant}>
                  Variant əlavə et
                </Button>
              </div>

              {variants.map((variant, index) => (
                <div key={variant._key} className="p-4 border border-gray-200 rounded-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Variant {index + 1}</h4>
                    {variants.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => removeVariant(index)}
                      >
                        Sil
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Növ</label>
                      <select
                        value={variant.variant}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateVariant(index, 'variant', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="econom">Econom</option>
                        <option value="standard">Standard</option>
                        <option value="premium">Premium</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Qiymət</label>
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariant(index, 'price', e.target.value)}
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Stok</label>
                      <Input
                        type="number"
                        value={variant.stock}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                        required
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Orijinal Qiymət</label>
                      <Input
                        type="number"
                        value={variant.originalPrice}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariant(index, 'originalPrice', e.target.value)}
                        min="0"
                        step="0.01"
                        placeholder="Orijinal qiymət (ixtiyari)"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Hədiyyə</label>
                      <Input
                        value={variant.gift}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateVariant(index, 'gift', e.target.value)}
                        placeholder="Hədiyyə məhsul (ixtiyari)"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Məzmun (hər sətrə bir element)</label>
                    <Textarea
                      value={variant.contents.join('\n')}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateVariant(index, 'contents', e.target.value.split('\n').filter(c => c.trim()))}
                      rows={3}
                      placeholder="Alma\nNarıngi\nBanan"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Əlavələr (hər sətrə bir element)</label>
                    <Textarea
                      value={variant.extras.join('\n')}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateVariant(index, 'extras', e.target.value.split('\n').filter(e => e.trim()))}
                      rows={2}
                      placeholder="Bal\nSarımsaq"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Ləğv et
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Yüklənir...' : 'Yadda saxla'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
