// lib/pusher/server.ts
import Pusher from 'pusher'

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
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