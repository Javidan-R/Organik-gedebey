import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
}
 
export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

/**
 * Optimistic cart operations hook
 * Provides instant UI feedback for cart actions
 */
export function useOptimisticCart() {
  const queryClient = useQueryClient();

  // Fetch cart data
  const { data: cart, isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await fetch('/api/cart');
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json() as Promise<Cart>;
    },
  });

  // Add item to cart with optimistic update
  const addToCart = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        const existingItem = old.items.find((item) => item.productId === productId);
        const newItems = existingItem
          ? old.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          : [...old.items, { productId, quantity, name: '', price: 0, image: '' }];

        const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        return { items: newItems, total, itemCount };
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Update item quantity with optimistic update
  const updateQuantity = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error('Failed to update quantity');
      return response.json();
    },
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        const newItems = old.items.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        ).filter((item) => item.quantity > 0);

        const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        return { items: newItems, total, itemCount };
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Remove item from cart with optimistic update
  const removeFromCart = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/cart/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove from cart');
      return response.json();
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], (old) => {
        if (!old) return old;
        const newItems = old.items.filter((item) => item.productId !== productId);
        const total = newItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        return { items: newItems, total, itemCount };
      });

      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Clear cart with optimistic update
  const clearCart = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to clear cart');
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<Cart>(['cart']);

      queryClient.setQueryData<Cart>(['cart'], () => ({
        items: [],
        total: 0,
        itemCount: 0,
      }));

      return { previousCart };
    },
    onError: (error, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  return {
    cart,
    isLoading,
    error,
    addToCart: addToCart.mutate,
    updateQuantity: updateQuantity.mutate,
    removeFromCart: removeFromCart.mutate,
    clearCart: clearCart.mutate,
    isAdding: addToCart.isPending,
    isUpdating: updateQuantity.isPending,
    isRemoving: removeFromCart.isPending,
    isClearing: clearCart.isPending,
  };
}
