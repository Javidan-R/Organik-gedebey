// src/hooks/usePusher.ts
'use client';

import { useEffect, useRef, useCallback } from 'react';
import Pusher from 'pusher-js';

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

export function usePusher(userId: string | null) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (!userId || !pusherKey) return;

    // Pusher client initialize et
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(pusherKey, {
        cluster: pusherCluster,
        authEndpoint: '/api/pusher/auth',
        forceTLS: true,
      });
    }

    return () => {
      // Cleanup
      channelsRef.current.forEach((channel, name) => {
        channel.unbind_all();
        pusherRef.current?.unsubscribe(name);
      });
      channelsRef.current.clear();
      pusherRef.current?.disconnect();
      pusherRef.current = null;
    };
  }, [userId]);

  const subscribe = useCallback((channelName: string, eventName: string, callback: (data: any) => void) => {
    if (!pusherRef.current) return () => {};

    const channel = pusherRef.current.subscribe(channelName);
    channel.bind(eventName, callback);

    channelsRef.current.set(channelName, channel);

    return () => {
      channel.unbind(eventName, callback);
      pusherRef.current?.unsubscribe(channelName);
      channelsRef.current.delete(channelName);
    };
  }, []);

  return { subscribe };
}