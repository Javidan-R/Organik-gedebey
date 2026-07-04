import { useMutation, useQueryClient, MutationFunction, UseMutationOptions } from '@tanstack/react-query';

/**
 * Optimistic mutation hook with automatic rollback on error
 * This provides instant UI feedback while the mutation is in progress
 */ 
export function useOptimisticMutation<TData, TError, TVariables, TContext = unknown>(
  mutationFn: MutationFunction<TData, TVariables>,
  options: {
    queryKey: unknown[];
    optimisticUpdate: (oldData: unknown, variables: TVariables) => unknown;
    onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
    onError?: (error: TError, variables: TVariables, context: TContext) => void;
  } & Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: options.queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(options.queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData(options.queryKey, (old: unknown) =>
        options.optimisticUpdate(old, variables)
      );

      // Return context with previous data for rollback
      return { previousData } as TContext;
    },
    onError: (error, variables, context) => {
      // Rollback to previous value on error
      if (context && 'previousData' in context) {
        queryClient.setQueryData(options.queryKey, (context as { previousData: unknown }).previousData);
      }
      options.onError?.(error, variables, context as TContext);
    },
    onSettled: (data, error, variables, context) => {
      // Refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: options.queryKey });
      if (!error && options.onSuccess) {
        options.onSuccess(data, variables, context as TContext);
      }
    },
    ...options,
  });
}

/**
 * Optimistic mutation for array operations (add, update, delete)
 */
export function useArrayOptimisticMutation<TItem, TError, TVariables, TContext = unknown>(
  mutationFn: MutationFunction<TItem, TVariables>,
  options: {
    queryKey: unknown[];
    operation: 'add' | 'update' | 'delete';
    getItemId?: (item: TItem) => string;
    onSuccess?: (data: TItem, variables: TVariables, context: TContext) => void;
    onError?: (error: TError, variables: TVariables, context: TContext) => void;
  } & Omit<UseMutationOptions<TItem, TError, TVariables, TContext>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previousData = queryClient.getQueryData<TItem[]>(options.queryKey);

      queryClient.setQueryData<TItem[]>(options.queryKey, (old = []) => {
        switch (options.operation) {
          case 'add':
            return [...old, variables as unknown as TItem];
          case 'update':
            return old.map((item) =>
              options.getItemId && options.getItemId(item) === options.getItemId(variables as unknown as TItem)
                ? (variables as unknown as TItem)
                : item
            );
          case 'delete':
            return old.filter((item) =>
              options.getItemId && options.getItemId(item) !== (variables as { id: string }).id
            );
          default:
            return old;
        }
      });

      return { previousData } as TContext;
    },
    onError: (error, variables, context) => {
      if (context && 'previousData' in context) {
        queryClient.setQueryData(options.queryKey, (context as { previousData: unknown }).previousData);
      }
      options.onError?.(error, variables, context as TContext);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({ queryKey: options.queryKey });
      if (!error && options.onSuccess) {
        options.onSuccess(data, variables, context as TContext);
      }
    },
    ...options,
  });
}
