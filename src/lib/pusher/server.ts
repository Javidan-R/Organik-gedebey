// lib/pusher/server.ts
import Pusher from 'pusher'

const appId = process.env.PUSHER_APP_ID || ''
const key = process.env.PUSHER_KEY || ''
const secret = process.env.PUSHER_SECRET || ''
const cluster = process.env.PUSHER_CLUSTER || ''

if (!appId || !key || !secret || !cluster) {
  console.error('[Pusher] Missing required environment variables: PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER')
}

const pusher = new Pusher({
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
    refType?: string
    data?: Record<string, any>
  }
) {
  try {
    await pusher.trigger(
      `private-user-${userId}`,
      'new-notification',
      notification
    )
    console.log(`[Pusher] Notification sent to user ${userId}`)
  } catch (error) {
    console.error('[Pusher] Failed to send notification:', error)
    // Don't throw - notification is still saved in DB
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
    console.log('[Pusher] Order update broadcasted')
  } catch (error) {
    console.error('[Pusher] Failed to broadcast order update:', error)
  }
}

/**
 * Broadcast to all admins
 */
export async function broadcastToAdmins(
  event: string,
  data: any
) {
  try {
    await pusher.trigger(
      'admin-channel',
      event,
      data
    )
    console.log(`[Pusher] Event "${event}" broadcasted to admins`)
  } catch (error) {
    console.error('[Pusher] Failed to broadcast to admins:', error)
  }
}