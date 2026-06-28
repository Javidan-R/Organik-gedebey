// src/hooks/useBaskets.ts
import { useState, useEffect } from 'react';

export interface BasketVariant {
  id: string;
  variant: 'econom' | 'standard' | 'premium';
  price: string;
  originalPrice?: string;
  stock: number;
  contents?: Array<{
    id: string;
    content: string;
    displayOrder: number;
  }>;
  extras?: Array<{
    id: string;
    extra: string;
    displayOrder: number;
  }>;
}

export interface BasketMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  altText?: string;
  displayOrder: number;
}

export interface Basket {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  type: 'gence' | 'gedebey' | 'sheki' | 'lenkaran' | 'ramazan' | 'custom';
  servings?: string;
  unit?: string;
  origin?: string;
  freshness?: string;
  nutrition?: string[];
  bestseller?: boolean;
  trending?: boolean;
  new?: boolean;
  lowStock?: boolean;
  stock?: number;
  discount?: number;
  highlights?: string[];
  displayOrder?: number;
  isActive?: boolean;
  archived?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  viewCount?: number;
  soldCount?: number;
  createdAt: string;
  updatedAt: string;
  media?: BasketMedia[];
  variants?: BasketVariant[];
}

export function useBaskets() {
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBaskets() {
      try {
        setLoading(true);
        const res = await fetch('/api/baskets');
        const data = await res.json();
        setBaskets(data.baskets || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch baskets:', err);
        setError('Failed to load baskets');
      } finally {
        setLoading(false);
      }
    }

    fetchBaskets();
  }, []);

  return { baskets, loading, error, refetch: () => fetch('/api/baskets').then(res => res.json()).then(data => setBaskets(data.baskets || [])) };
}
