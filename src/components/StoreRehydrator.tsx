'use client';
import { useEffect } from 'react';
import { useApp } from '@/lib/store';

export function StoreRehydrator() {
  const updateStorefrontConfig = useApp((state) => state.updateStorefrontConfig);
  
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }
        const config = await response.json();
        console.log('Loaded storefront config from API:', config);
        updateStorefrontConfig(config);
      } catch (err) {
        console.error('Failed to load settings:', err);
        // Don't throw - let the app use default config from store
      }
    };

    loadSettings();
  }, [updateStorefrontConfig]);
  
  return null;
}