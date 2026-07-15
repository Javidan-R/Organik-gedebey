// src/components/ui/CategoryFilter.tsx
// Tam, qısaldılmamış, production-ready, react-hot-toast, atoms ilə

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Search, Check } from 'lucide-react';
import { classNames } from '@/lib/utils/classnames';
import { Input } from '@/components/atoms/input';
import { Button } from '@/components/atoms/button';
import type { Category } from '@/types/category';

interface CategoryFilterProps {
  categories: Category[];
  selectedIds?: string[];
  onSelect?: (ids: string[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
  className?: string;
}

export function CategoryFilter({
  categories,
  selectedIds = [],
  onSelect,
  multiSelect = false,
  placeholder = 'Kateqoriya seçin',
  className = '',
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const term = search.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term)
    );
  }, [categories, search]);

  const selectedNames = useMemo(() => {
    return categories
      .filter((cat) => selectedIds.includes(cat.id))
      .map((cat) => cat.name);
  }, [categories, selectedIds]);

  const handleToggle = useCallback(
    (id: string) => {
      if (!onSelect) return;
      if (multiSelect) {
        const newIds = selectedIds.includes(id)
          ? selectedIds.filter((i) => i !== id)
          : [...selectedIds, id];
        onSelect(newIds);
      } else {
        onSelect(selectedIds.includes(id) ? [] : [id]);
        setIsOpen(false);
      }
    },
    [selectedIds, onSelect, multiSelect]
  );

  const handleClear = useCallback(() => {
    onSelect?.([]);
  }, [onSelect]);

  return (
    <div className={classNames('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={classNames(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border bg-white text-sm transition-all',
          isOpen
            ? 'border-emerald-400 ring-2 ring-emerald-100'
            : 'border-slate-200 hover:border-slate-300'
        )}
      >
        <span className="truncate text-left">
          {selectedIds.length > 0 ? (
            <span className="flex items-center gap-1">
              <span className="font-medium">{selectedIds.length} seçilib</span>
              <span className="text-slate-400">({selectedNames.join(', ')})</span>
            </span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          {selectedIds.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-0.5 rounded hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 max-h-[400px] flex flex-col"
          >
            {/* Search */}
            <div className="p-2 border-b border-slate-100 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  name="category-filter-search"
                  value={search}
                  onChange={(val) => setSearch(val)}
                  placeholder="Kateqoriya axtar..."
                  className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition w-full"
                  icon={<Search className="w-4 h-4" />}
                  iconPosition="left"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-1">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-4 text-sm text-slate-400">
                  Kateqoriya tapılmadı
                </div>
              ) : (
                filteredCategories.map((cat, index) => {
                  const isSelected = selectedIds.includes(cat.id);
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                      onClick={() => handleToggle(cat.id)}
                      className={classNames(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left',
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      <div
                        className={classNames(
                          'w-5 h-5 rounded border flex items-center justify-center transition flex-shrink-0',
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300'
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="truncate flex-1">{cat.name}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {cat._count?.products || 0}
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-2 border-t border-slate-100 flex-shrink-0">
              <Button variant="ghost" size="xs" onClick={handleClear}>
                Təmizlə
              </Button>
              <Button
                variant="primary"
                size="xs"
                onClick={() => setIsOpen(false)}
              >
                Tətbiq et
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}