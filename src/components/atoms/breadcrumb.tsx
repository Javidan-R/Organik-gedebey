// src/components/ui/Breadcrumb.tsx

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import type { Category } from '@/types/category';
import { cn } from '@/lib/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  categories?: Category[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1 text-sm', className)} aria-label="Breadcrumb">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/"
          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <Home className="w-4 h-4" />
          <span className="sr-only">Ana səhifə</span>
        </Link>
      </motion.div>

      {items.map((item, index) => (
        <motion.div
          key={item.href}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="flex items-center gap-1"
        >
          <ChevronRight className="w-3 h-3 text-slate-300 flex-shrink-0" />
          {item.isCurrent ? (
            <span className="font-medium text-slate-800 dark:text-slate-200" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </motion.div>
      ))}
    </nav>
  );
}

// Kateqoriya üçün breadcrumb generator
export function generateCategoryBreadcrumbs(
  category: Category,
  allCategories: Category[]
): BreadcrumbItem[] {
  const path: Category[] = [];
  let current: Category | undefined = category;

  while (current) {
    path.unshift(current);
    current = allCategories.find((c) => c.id === current?.parentId);
  }

  return path.map((cat, index) => ({
    label: cat.name,
    href: `/category/${cat.slug}`,
    isCurrent: index === path.length - 1,
  }));
}