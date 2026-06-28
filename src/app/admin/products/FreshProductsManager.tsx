// src/app/admin/products/FreshProductsManager.tsx
'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Search } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';

export default function FreshProductsManager() {
  const products = useApp((s) => s.products ?? []);
  const updateProduct = useApp((s) => s.updateProduct);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'fresh' | 'upcoming'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredProducts = products.filter(p => {
    if (p.archived) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    if (filter === 'fresh') return p.isNewArrival;
    if (filter === 'upcoming') return p.statusTags?.includes('upcoming');
    return true;
  });

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleFresh = useCallback((id: string, isFresh: boolean) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    // ✅ DÜZƏLİŞ: updateProduct 1 arqument gözləyir
    updateProduct({ ...product, isNewArrival: isFresh });
  }, [products, updateProduct]);

  const toggleUpcoming = useCallback((id: string, isUpcoming: boolean) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const statusTags = isUpcoming
      ? [...(product.statusTags || []), 'upcoming']
      : (product.statusTags || []).filter(t => t !== 'upcoming');
    
    // ✅ DÜZƏLİŞ: updateProduct 1 arqument gözləyir
    updateProduct({ ...product, statusTags });
  }, [products, updateProduct]);

  const bulkSetFresh = useCallback(() => {
    selectedIds.forEach(id => {
      const product = products.find(p => p.id === id);
      if (!product) return;
      updateProduct({ ...product, isNewArrival: true });
    });
    setSelectedIds(new Set());
  }, [selectedIds, products, updateProduct]);

  const bulkSetUpcoming = useCallback(() => {
    selectedIds.forEach(id => {
      const product = products.find(p => p.id === id);
      if (!product) return;
      const statusTags = [...(product.statusTags || []), 'upcoming'];
      updateProduct({ ...product, statusTags });
    });
    setSelectedIds(new Set());
  }, [selectedIds, products, updateProduct]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Təzə Məhsulların İdarə Edilməsi
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            "Təzə Gəldi" səhifəsində görünən məhsulları idarə edin
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Məhsul axtar..."
          value={searchTerm}
          onChange={setSearchTerm}
          icon={<Search className="w-4 h-4" />}
          className="w-64"
        />
        
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(['all', 'fresh', 'upcoming'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                filter === f
                  ? 'bg-white shadow text-emerald-600'
                  : 'text-slate-600 hover:bg-white/50'
              }`}
            >
              {f === 'all' ? 'Hamısı' : f === 'fresh' ? 'Təzə' : 'Gələcək'}
            </button>
          ))}
        </div>

        {selectedIds.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="primary"
              onClick={bulkSetFresh}
              className="flex items-center gap-2 text-xs px-3 py-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Təzə kimi qeyd et ({selectedIds.size})
            </Button>
            <Button
              variant="secondary"
              onClick={bulkSetUpcoming}
              className="flex items-center gap-2 text-xs px-3 py-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              Gələcək kimi qeyd et ({selectedIds.size})
            </Button>
          </div>
        )}
      </div>

      {/* Products List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 font-bold">Məhsul tapılmadı</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => toggleSelection(product.id)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  {product.images?.[0] && (
                    <img
                      src={typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-slate-500">
                    {product.categoryId} · {product.price} AZN
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFresh(product.id, !product.isNewArrival)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      product.isNewArrival
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    Təzə
                  </button>
                  
                  <button
                    onClick={() => toggleUpcoming(product.id, !product.statusTags?.includes('upcoming'))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      product.statusTags?.includes('upcoming')
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    Gələcək
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}