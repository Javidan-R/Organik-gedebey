// lib/pusher/client.ts
'use client'

import PusherClient from 'pusher-js'

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';

if (!pusherKey) {
  console.warn('NEXT_PUBLIC_PUSHER_KEY is not set. Real-time features will be disabled.');
}

export const pusherClient = pusherKey ? new PusherClient(
  pusherKey,
  {
    cluster: pusherCluster,
  }
) : null;

/**
 * Subscribe to user notifications
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: any) => void
) {
  if (!pusherClient) {
    console.warn('Pusher client is not initialized. Notifications are disabled.');
    return () => {};
  }

  const channel = pusherClient.subscribe(`user-${userId}`)
  
  channel.bind('new-notification', callback)
  
  return () => {
    channel.unbind('new-notification', callback)
    pusherClient.unsubscribe(`user-${userId}`)
  }
}