// src/app/admin/baskets/page.tsx
'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, LayoutGrid, Rows3, SlidersHorizontal, PackageSearch, BarChart3 } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Select } from '@/components/atoms/select';
import BasketCard from '@/components/admin/baskets/BasketCard';
import BasketEditModal from '@/components/admin/baskets/BasketEditModal';
import { SkeletonGrid } from '@/components/admin/molecules/SkeletonGrid';
import type { Basket, FilterState } from '@/types/basket';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminBaskets() {
  const { user } = useAdminAuth(); // sadəcə token üçün deyil, istifadəçi varsa panel yüklənir
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [editingBasket, setEditingBasket] = useState<Basket | null>(null);
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    type: '',
    showArchived: false,
    stockFilter: 'all',
    discountOnly: false,
    sortKey: 'newest',
  });

  const fetchBaskets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: filters.searchTerm,
        type: filters.type,
        showArchived: String(filters.showArchived),
      });
      // Cookie avtomatik göndərilir, amma biz yenə də credentials əlavə edirik
      const res = await fetch(`/api/admin/baskets?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Məlumat yüklənə bilmədi');
      const data = await res.json();
      setBaskets(data.baskets || []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Səbətlər yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  }, [filters.searchTerm, filters.type, filters.showArchived]);

  useEffect(() => {
    fetchBaskets();
  }, [fetchBaskets]);

  const filteredBaskets = useMemo(() => {
    let result = [...baskets];
    if (filters.stockFilter !== 'all') {
      result = result.filter(b => {
        const stock = b.stock || 0;
        if (filters.stockFilter === 'in_stock') return stock > 0;
        if (filters.stockFilter === 'low_stock') return stock > 0 && stock < 10;
        if (filters.stockFilter === 'out_of_stock') return stock === 0;
        return true;
      });
    }
    if (filters.discountOnly) result = result.filter(b => Number(b.discount ?? 0) > 0);
    if (filters.sortKey === 'price_asc') result.sort((a,b) => (Number(a.variants?.[0]?.price) ?? 0) - (Number(b.variants?.[0]?.price) ?? 0));
    if (filters.sortKey === 'price_desc') result.sort((a,b) => (Number(b.variants?.[0]?.price) ?? 0) - (Number(a.variants?.[0]?.price) ?? 0));
    if (filters.sortKey === 'name') result.sort((a,b) => a.name.localeCompare(b.name));
    if (filters.sortKey === 'newest') result.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [baskets, filters]);

  const handleArchive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/baskets/${id}/archive`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Arxivləşdirmə alınmadı');
      toast.success('Səbət arxivləşdirildi');
      fetchBaskets();
    } catch (error) { toast.error('Xəta baş verdi'); }
  };

  const handleUnarchive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/baskets/${id}/unarchive`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Arxivdən çıxarma alınmadı');
      toast.success('Səbət arxivdən çıxarıldı');
      fetchBaskets();
    } catch (error) { toast.error('Xəta baş verdi'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Səbəti silmək istədiyinizə əminsiniz? Bu əməliyyat geri qayıdılmazdır.')) return;
    try {
      const res = await fetch(`/api/admin/baskets/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Silinmə alınmadı');
      toast.success('Səbət silindi');
      fetchBaskets();
    } catch (error) { toast.error('Xəta baş verdi'); }
  };

  const activeCount = baskets.filter(b => !b.archived).length;
  const archivedCount = baskets.filter(b => b.archived).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-emerald-100/50 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Səbətlər</h1>
              <p className="text-sm text-gray-600 mt-1">{activeCount} aktiv • {archivedCount} arxivlənmiş</p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/admin/baskets/analytics">
                <Button variant="secondary"><BarChart3 className="w-4 h-4 mr-2" /> Analitik</Button>
              </Link>
              <Button onClick={() => setEditingBasket({} as Basket)}>
                <Plus className="w-4 h-4 mr-2" /> Yeni Səbət
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Filter Card */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-100/50 bg-white/80 shadow-lg backdrop-blur-sm">
          <div className="p-5">
            <div className="flex flex-col gap-4 md:flex-row">
              <Input
                label="Axtarış"
                name="search"
                value={filters.searchTerm}
                onChange={(v) => setFilters(prev => ({ ...prev, searchTerm: v }))}
                placeholder="Ad, təsvir, şüar..."
                icon={<Search className="h-4 w-4" />}
                className="flex-1"
              />
              <Select
                label="Növ"
                name="type"
                value={filters.type}
                onChange={(v) => setFilters(prev => ({ ...prev, type: v as any }))}
                options={[
                  { value: '', label: 'Bütün növlər' },
                  { value: 'gence', label: '🌅 Səhər' },
                  { value: 'gedebey', label: '🏔 Gədəbəy' },
                  { value: 'sheki', label: '🏛 Şəki' },
                  { value: 'lenkaran', label: '🌊 Lənkəran' },
                  { value: 'ramazan', label: '🌙 Ramazan' },
                  { value: 'custom', label: '✨ Xüsusi' },
                ]}
                className="w-56"
              />
              <div className="flex items-end gap-2">
                <Button variant="soft" onClick={() => setAdvancedOpen(!advancedOpen)} className="flex items-center gap-1">
                  <SlidersHorizontal className="h-4 w-4" /> Ətraflı
                </Button>
                <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <button onClick={() => setViewMode('grid')} className={`p-2 transition ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid className="h-4 w-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 transition ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:text-slate-600'}`}><Rows3 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {advancedOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="grid gap-5 border-t border-emerald-100 pt-5 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">Stok vəziyyəti</label>
                      <select
                        value={filters.stockFilter}
                        onChange={(e) => setFilters(prev => ({ ...prev, stockFilter: e.target.value as any }))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="all">Hamısı</option>
                        <option value="in_stock">Stokda var</option>
                        <option value="low_stock">Az stok (&lt;10)</option>
                        <option value="out_of_stock">Stokda yoxdur</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="discountOnly"
                        checked={filters.discountOnly}
                        onChange={(e) => setFilters(prev => ({ ...prev, discountOnly: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor="discountOnly" className="text-sm font-medium text-slate-700">Yalnız endirimlilər</label>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">Sırala</label>
                      <select
                        value={filters.sortKey}
                        onChange={(e) => setFilters(prev => ({ ...prev, sortKey: e.target.value as any }))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-sm shadow-sm focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="newest">Ən yeni</option>
                        <option value="price_asc">Qiymət (artan)</option>
                        <option value="price_desc">Qiymət (azalan)</option>
                        <option value="name">Ad (A-Z)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <SkeletonGrid viewMode={viewMode} />
        ) : filteredBaskets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-white/60 p-12 text-center">
            <PackageSearch className="h-16 w-16 text-emerald-300" />
            <h3 className="mt-4 text-xl font-semibold text-slate-800">Heç bir səbət tapılmadı</h3>
            <p className="mt-1 text-sm text-slate-500">Filtirləri dəyişdirin və ya yeni səbət yaradın.</p>
            <Button variant="primary" onClick={() => setEditingBasket({} as Basket)} className="mt-6">
              <Plus className="h-4 w-4" /> Yeni səbət
            </Button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredBaskets.map((basket) => (
              <BasketCard
                key={basket.id}
                basket={basket}
                onEdit={setEditingBasket}
                onArchive={handleArchive}
                onUnarchive={handleUnarchive}
                onDelete={handleDelete}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </main>

      <AnimatePresence>
        {editingBasket && (
          <BasketEditModal
            open={editingBasket !== null}
            basket={editingBasket}
            onClose={() => setEditingBasket(null)}
            onSave={fetchBaskets}
          />
        )}
      </AnimatePresence>
    </div>
  );
}