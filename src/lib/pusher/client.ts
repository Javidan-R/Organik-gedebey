// lib/pusher/client.ts
'use client'

import PusherClient from 'pusher-js'

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
)

/**
 * Subscribe to user notifications
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notification: any) => void
) {
  const channel = pusherClient.subscribe(`user-${userId}`)
  
  channel.bind('new-notification', callback)
  
  return () => {
    channel.unbind('new-notification', callback)
    pusherClient.unsubscribe(`user-${userId}`)
  }
}