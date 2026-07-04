import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

export interface WishlistItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  addedAt: string;
}
 
/**
 * Optimistic wishlist operations hook
 * Provides instant UI feedback for wishlist actions
 */
export function useOptimisticWishlist() {
  const queryClient = useQueryClient();

  // Fetch wishlist data
  const { data: wishlist, isLoading, error } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await fetch('/api/account/wishlist');
      if (!response.ok) throw new Error('Failed to fetch wishlist');
      return response.json() as Promise<WishlistItem[]>;
    },
  });

  // Add item to wishlist with optimistic update
  const addToWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/account/wishlist/${productId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to add to wishlist');
      return response.json();
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist']);

      queryClient.setQueryData<WishlistItem[]>(['wishlist'], (old = []) => {
        if (old.some((item) => item.productId === productId)) {
          return old;
        }
        return [
          ...old,
          {
            productId,
            name: '',
            price: 0,
            image: '',
            addedAt: new Date().toISOString(),
          },
        ];
      });

      return { previousWishlist };
    },
    onError: (error, variables, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  // Remove item from wishlist with optimistic update
  const removeFromWishlist = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/account/wishlist/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to remove from wishlist');
      return response.json();
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist']);

      queryClient.setQueryData<WishlistItem[]>(['wishlist'], (old = []) =>
        old.filter((item) => item.productId !== productId)
      );

      return { previousWishlist };
    },
    onError: (error, variables, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  // Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlist?.some((item) => item.productId === productId) ?? false;
  };

  return {
    wishlist,
    isLoading,
    error,
    addToWishlist: addToWishlist.mutate,
    removeFromWishlist: removeFromWishlist.mutate,
    isInWishlist,
    isAdding: addToWishlist.isPending,
    isRemoving: removeFromWishlist.isPending,
  };
}
