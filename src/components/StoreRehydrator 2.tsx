'use client';
import { useEffect } from 'react';
import { useApp } from '@/lib/store';

export function StoreRehydrator() {
  const updateStorefrontConfig = useApp((state) => state.updateStorefrontConfig);
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((config) => {
        updateStorefrontConfig(config);
      })
      .catch((err) => console.error('Failed to load settings', err));
  }, [updateStorefrontConfig]);
  return null;
}