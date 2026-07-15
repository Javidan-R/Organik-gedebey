// src/components/ui/CategorySelect.tsx
// Tam, qısaldılmamış, production-ready

'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, X, Search, Check, Folder } from 'lucide-react';
import { classNames } from '@/lib/utils/classnames';
import { Input } from '@/components/atoms/input';
import type { Category } from '@/types/category';

interface CategorySelectProps {
  categories: Category[];
  value?: string | null;
  onChange?: (id: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

export function CategorySelect({
  categories,
  value,
  onChange,
  placeholder = 'Kateqoriya seçin',
  className = '',
  disabled = false,
  error = '',
}: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedCategory = useMemo(() => {
    return categories.find((cat) => cat.id === value);
  }, [categories, value]);

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const term = search.toLowerCase().trim();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term)
    );
  }, [categories, search]);

  const handleSelect = useCallback(
    (id: string) => {
      onChange?.(id);
      setIsOpen(false);
      setSearch('');
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange?.(null);
  }, [onChange]);

  return (
    <div className={classNames('relative', className)}>
      {/* Trigger */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={classNames(
          'w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border bg-white text-sm transition-all',
          disabled && 'opacity-60 cursor-not-allowed',
          error ? 'border-red-400 ring-2 ring-red-100' : 'border-slate-200 hover:border-slate-300',
          isOpen && 'border-emerald-400 ring-2 ring-emerald-100'
        )}
      >
        <span className="truncate text-left flex items-center gap-2">
          {selectedCategory ? (
            <>
              {selectedCategory.imageUrl ? (
                <img
                  src={selectedCategory.imageUrl}
                  alt=""
                  className="w-5 h-5 rounded object-cover flex-shrink-0"
                />
              ) : (
                <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className="truncate">{selectedCategory.name}</span>
            </>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
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

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

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
                  name="category-select-search"
                  value={search}
                  onChange={(val) => setSearch(val)}
                  placeholder="Kateqoriya axtar..."
                  className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition w-full"
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
                  const isSelected = cat.id === value;
                  return (
                    <motion.button
                      key={cat.id}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.02 }}
                      onClick={() => handleSelect(cat.id)}
                      className={classNames(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left',
                        isSelected
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      {cat.imageUrl ? (
                        <img
                          src={cat.imageUrl}
                          alt=""
                          className="w-6 h-6 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="truncate flex-1">{cat.name}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}