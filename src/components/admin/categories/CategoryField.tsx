// src/components/admin/ProductForm/CategoryField.tsx

'use client';

import { useEffect, useState } from 'react';
import type { Category } from '@/types/category';
import { CategorySelect } from './CategorySelect';

interface CategoryFieldProps {
  value?: string | null;
  onChange: (id: string | null) => void;
  error?: string;
  disabled?: boolean;
}

export function CategoryField({ value, onChange, error, disabled }: CategoryFieldProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/categories?limit=100&isActive=true&archived=false');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setCategories(data.items || []);
      } catch (error) {
        console.error('Fetch categories error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  return (
    <CategorySelect
      categories={categories}
      value={value}
      onChange={onChange}
      placeholder="Kateqoriya seçin"
      disabled={disabled}
      error={error}
    />
  );
}