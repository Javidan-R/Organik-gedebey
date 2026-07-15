// src/lib/pusher/client.ts
'use client';

import Pusher from 'pusher-js';

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

if (!pusherKey) {
  console.warn('NEXT_PUBLIC_PUSHER_KEY is not set. Real-time features will be disabled.');
}

let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (!pusherKey) return null;

  if (!pusherClient) {
    pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      forceTLS: true,
    });

    pusherClient.connection.bind('connected', () => {
      console.log('[Pusher] Connected');
    });

    pusherClient.connection.bind('disconnected', () => {
      console.log('[Pusher] Disconnected');
    });

    pusherClient.connection.bind('error', (err: any) => {
      console.error('[Pusher] Connection error:', err);
    });
  }

  return pusherClient;
}

export function subscribeToNotifications(
  userId: string,
  callback: (notification: any) => void
) {
  const client = getPusherClient();
  if (!client) {
    console.warn('[Pusher] Client is not initialized. Notifications are disabled.');
    return () => {};
  }

  const channelName = `private-user-${userId}`;
  const channel = client.subscribe(channelName);
  channel.bind('new-notification', callback);

  return () => {
    channel.unbind('new-notification', callback);
    client.unsubscribe(channelName);
  };
}

export function cleanupPusherClient() {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}