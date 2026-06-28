// lib/pusher/server.ts
import Pusher from 'pusher'

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER;

if (!appId || !key || !secret || !cluster) {
  throw new Error('Missing required Pusher environment variables: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER');
}

export const pusher = new Pusher({
  appId,
  key,
  secret,
  cluster,
  useTLS: true,
})

/**
 * Send real-time notification to user
 */
export async function sendRealtimeNotification(
  userId: string,
  notification: {
    type: string
    title: string
    message: string
    refId?: string
  }
) {
  try {
    await pusher.trigger(
      `user-${userId}`,
      'new-notification',
      notification
    )
  } catch (error) {
    console.error("Pusher error:", error)
  }
}

/**
 * Broadcast order update to all admins
 */
export async function broadcastOrderUpdate(order: any) {
  try {
    await pusher.trigger(
      'admin-orders',
      'order-updated',
      order
    )
  } catch (error) {
    console.error("Pusher broadcast error:", error)
  }
}