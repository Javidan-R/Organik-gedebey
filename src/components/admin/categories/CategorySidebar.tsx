// src/components/ui/CategorySidebar.tsx
// Tam, qısaldılmamış, production-ready

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, ChevronDown, Folder, Star } from 'lucide-react';
import { classNames } from '@/lib/utils/classnames';
import type { Category } from '@/types/category';

interface CategorySidebarProps {
  categories: Category[];
  activeId?: string | null;
  className?: string;
}

export function CategorySidebar({
  categories,
  activeId,
  className = '',
}: CategorySidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (activeId) {
      const findPath = (cats: Category[], targetId: string): string[] => {
        for (const cat of cats) {
          if (cat.id === targetId) return [cat.id];
          if (cat.children) {
            const path = findPath(cat.children, targetId);
            if (path.length > 0) return [cat.id, ...path];
          }
        }
        return [];
      };
      const path = findPath(categories, activeId);
      setExpandedIds(new Set(path));
    }
  }, [activeId, categories]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderCategoryTree = (items: Category[], depth: number = 0) => {
    return items.map((cat) => {
      const hasChildren = cat.children && cat.children.length > 0;
      const isActive = cat.id === activeId;
      const isExpanded = expandedIds.has(cat.id);

      return (
        <div key={cat.id}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: depth * 0.02 }}
            className="relative"
          >
            <Link
              href={`/category/${cat.slug}`}
              className={classNames(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all w-full',
                isActive
                  ? 'bg-emerald-50 text-emerald-700 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
              style={{ paddingLeft: `${depth * 16 + 12}px` }}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleExpand(cat.id);
                  }}
                  className="flex-shrink-0 p-0.5 rounded hover:bg-slate-200 transition"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              ) : (
                <div className="w-5 flex-shrink-0" />
              )}
              {cat.imageUrl ? (
                <img
                  src={cat.imageUrl}
                  alt=""
                  className="w-5 h-5 rounded object-cover flex-shrink-0"
                />
              ) : (
                <Folder className="w-4 h-4 text-slate-400 flex-shrink-0" />
              )}
              <span className="truncate flex-1 text-left">{cat.name}</span>
              {cat.isFeatured && (
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 flex-shrink-0" />
              )}
              {cat._count?.products ? (
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {cat._count.products}
                </span>
              ) : null}
            </Link>
          </motion.div>
          {hasChildren && isExpanded && (
            <div className="ml-2">{renderCategoryTree(cat.children || [], depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className={classNames('space-y-1', className)}>
      <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
        Kateqoriyalar
      </div>
      {categories.length === 0 ? (
        <div className="text-sm text-slate-400 px-3 py-4">Heç bir kateqoriya yoxdur</div>
      ) : (
        renderCategoryTree(categories)
      )}
    </div>
  );
}