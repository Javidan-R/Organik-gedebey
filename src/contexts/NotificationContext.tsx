// src/contexts/NotificationContext.tsx

'use client';

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type { Notification } from '@/types/notification';
import { subscribeToNotifications, cleanupPusherClient } from '@/lib/pusher/client';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  refetch: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const NOTIFICATIONS_KEY = ['notifications'] as const;
const UNREAD_COUNT_KEY = ['notifications', 'unread-count'] as const;

async function fetchNotifications(limit: number = 50): Promise<Notification[]> {
  const res = await fetch(`/api/notifications?limit=${limit}`, {
    credentials: 'include',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.status}`);
  }
  const data = await res.json();
  return data.notifications as Notification[];
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch('/api/notifications/unread-count', {
    credentials: 'include',
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch unread count: ${res.status}`);
  }
  const data = await res.json();
  return data.count as number;
}

async function markAllAsReadApi(): Promise<{ success: boolean; count: number }> {
  const res = await fetch('/api/notifications/mark-all-read', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to mark all as read: ${res.status}`);
  }
  return res.json();
}

async function dismissApi(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/notifications/${id}/dismiss`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`Failed to dismiss notification: ${res.status}`);
  }
  return res.json();
}

async function markAsReadApi(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to mark as read: ${res.status}`);
  }
  return res.json();
}

async function fetchUserId(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      return data?.user?.id || null;
    }
    return null;
  } catch (error) {
    console.error('[NotificationContext] Failed to fetch user ID:', error);
    return null;
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    fetchUserId().then((id) => {
      if (mounted) {
        setUserId(id);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => fetchNotifications(50),
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
    enabled: !!userId,
  });

  const { data: unreadCount = 0 } = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: fetchUnreadCount,
    staleTime: 1000 * 15,
    gcTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (notification: Notification) => {
      queryClient.setQueryData<Notification[]>(NOTIFICATIONS_KEY, (old = []) => {
        if (old.some((n) => n.id === notification.id)) return old;
        return [notification, ...old].slice(0, 100);
      });
      queryClient.setQueryData<number>(UNREAD_COUNT_KEY, (old = 0) => old + 1);
    });

    return () => {
      unsubscribe();
    };
  }, [userId, queryClient]);

  useEffect(() => {
    return () => {
      if (!userId) {
        cleanupPusherClient();
      }
    };
  }, [userId]);

  const markAllMutation = useMutation({
    mutationFn: markAllAsReadApi,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY });

      const previousNotifications = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_KEY);
      const previousCount = queryClient.getQueryData<number>(UNREAD_COUNT_KEY);

      if (previousNotifications) {
        queryClient.setQueryData(
          NOTIFICATIONS_KEY,
          previousNotifications.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
      }
      queryClient.setQueryData(UNREAD_COUNT_KEY, 0);

      return { previousNotifications, previousCount };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previousNotifications);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, context.previousCount);
      }
      console.error('[NotificationContext] Mark all read error:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissApi(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY });

      const previousNotifications = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_KEY);
      const previousCount = queryClient.getQueryData<number>(UNREAD_COUNT_KEY);

      if (previousNotifications) {
        const removed = previousNotifications.find((n) => n.id === id);
        queryClient.setQueryData(
          NOTIFICATIONS_KEY,
          previousNotifications.filter((n) => n.id !== id)
        );
        if (removed && !removed.isRead) {
          queryClient.setQueryData(UNREAD_COUNT_KEY, Math.max(0, (previousCount || 0) - 1));
        }
      }

      return { previousNotifications, previousCount };
    },
    onError: (err, id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previousNotifications);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, context.previousCount);
      }
      console.error('[NotificationContext] Dismiss error:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsReadApi(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      await queryClient.cancelQueries({ queryKey: UNREAD_COUNT_KEY });

      const previousNotifications = queryClient.getQueryData<Notification[]>(NOTIFICATIONS_KEY);
      const previousCount = queryClient.getQueryData<number>(UNREAD_COUNT_KEY);

      if (previousNotifications) {
        const updated = previousNotifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        );
        queryClient.setQueryData(NOTIFICATIONS_KEY, updated);

        const newCount = updated.filter((n) => !n.isRead).length;
        queryClient.setQueryData(UNREAD_COUNT_KEY, newCount);
      }

      return { previousNotifications, previousCount };
    },
    onError: (err, id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previousNotifications);
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(UNREAD_COUNT_KEY, context.previousCount);
      }
      console.error('[NotificationContext] Mark read error:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    },
  });

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    isError: isError || !!error,
    error: error || null,
    markAllAsRead: useCallback(async () => {
      await markAllMutation.mutateAsync();
    }, [markAllMutation]),
    dismiss: useCallback(async (id: string) => {
      await dismissMutation.mutateAsync(id);
    }, [dismissMutation]),
    markAsRead: useCallback(async (id: string) => {
      await markReadMutation.mutateAsync(id);
    }, [markReadMutation]),
    refetch: useCallback(() => {
      refetch();
      queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
    }, [refetch, queryClient]),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}