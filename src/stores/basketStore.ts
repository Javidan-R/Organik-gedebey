// src/stores/basketStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface BasketCartItem {
  basketId: string;
  variantId: string;
  basketName: string;
  variantName: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  image: string;
  stock: number;
  contents: string[];
  extras: string[];
}

interface BasketStore {
  items: BasketCartItem[];
  addItem: (item: Omit<BasketCartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (basketId: string, variantId: string) => void;
  updateQuantity: (basketId: string, variantId: string, quantity: number) => void;
  clearItems: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  itemCount: () => number;
  getItem: (basketId: string, variantId: string) => BasketCartItem | undefined;
  syncWithLocalStorage: () => void;
}

export const useBasketStore = create<BasketStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.basketId === item.basketId && i.variantId === item.variantId
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.basketId === item.basketId && i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: item.quantity || 1,
              },
            ],
          };
        });
      },

      removeItem: (basketId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.basketId === basketId && i.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (basketId, variantId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.basketId === basketId && i.variantId === variantId
              ? { ...i, quantity: Math.max(1, quantity) }
              : i
          ),
        }));
      },

      clearItems: () => set({ items: [] }),

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      totalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },

      itemCount: () => {
        return get().items.length;
      },

      getItem: (basketId, variantId) => {
        return get().items.find(
          (i) => i.basketId === basketId && i.variantId === variantId
        );
      },

      syncWithLocalStorage: () => {
        // Force sync – local storage-dan oxuyub state-i yeniləyir
        try {
          const stored = localStorage.getItem('organik-gedebey-basket-store');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.state?.items) {
              set({ items: parsed.state.items });
            }
          }
        } catch (e) {
          console.error('Basket sync error:', e);
        }
      },
    }),
    {
      name: 'organik-gedebey-basket-store',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return window.localStorage;
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        items: state.items,
      }),
    }
  )
);