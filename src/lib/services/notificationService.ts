// src/lib/services/notificationService.ts

import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { NotificationType, NotificationChannel } from '@/types/notification';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  refType?: string | null;
  refId?: string | null;
  channel?: NotificationChannel;
  data?: Record<string, any>;
};

export class NotificationService {
  /**
   * Yeni notification yaradır, DB-yə insert edir və real-time trigger göndərir.
   */
  static async create(input: CreateNotificationInput) {
    const values: any = {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      refType: input.refType || null,
      refId: input.refId || null,
      channel: input.channel || 'APP',
      isRead: false,
      createdAt: new Date(),
    };


    const [notification] = await db
      .insert(notifications)
      .values(values as any)
      .returning();

    // Pusher trigger
    if (process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET && process.env.PUSHER_CLUSTER) {
      try {
        const Pusher = require('pusher');
        const pusher = new Pusher({
          appId: process.env.PUSHER_APP_ID,
          key: process.env.PUSHER_KEY,
          secret: process.env.PUSHER_SECRET,
          cluster: process.env.PUSHER_CLUSTER,
          useTLS: true,
        });
        await pusher.trigger(`private-user-${input.userId}`, 'notification', notification);
      } catch (error) {
        console.error('Pusher trigger error:', error);
      }
    }

    return notification;
  }

  /**
   * Tək bir notification-ı oxunmuş kimi işarələyir.
   */
  static async markAsRead(userId: string, notificationId: string) {
    const updated = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return updated;
  }

  /**
   * İstifadəçinin bütün oxunmamış notification-larını oxunmuş kimi işarələyir.
   */
  static async markAllAsRead(userId: string) {
    try {
      const updated = await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
        .returning({ id: notifications.id });
      return updated;
    } catch (error) {
      console.error('[NotificationService] Mark all as read error:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * Müəyyən notification-ı silir (dismiss).
   */
  static async dismiss(userId: string, notificationId: string) {
    const deleted = await db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });
    return deleted;
  }

  /**
   * İstifadəçinin bütün notification-larını (limit ilə) qaytarır.
   */
  static async getForUser(userId: string, limit: number = 50) {
    try {
      return db
        .select({
          id: notifications.id,
          userId: notifications.userId,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          refType: notifications.refType,
          refId: notifications.refId,
          channel: notifications.channel,
          isRead: notifications.isRead,
          readAt: notifications.readAt,
          createdAt: notifications.createdAt,
        })
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    } catch (error) {
      console.error('[NotificationService] Get for user error:', error);
      throw new Error('Failed to fetch notifications');
    }
  }

  /**
   * Oxunmamış notification sayını qaytarır.
   *
   * BUGFIX: əvvəlki versiya bütün oxunmamış SƏTİRLƏRİ DB-dən çəkib
   * `result.length` ilə sayırdı — bir istifadəçidə minlərlə oxunmamış
   * bildiriş olsa, hər badge yenilənməsində (adətən bir neçə saniyədə bir
   * çağırılır) bütün sətirlər şəbəkədən keçirdi. İndi Postgres tərəfində
   * `COUNT(*)` istifadə olunur — DB-dən yalnız bir ədəd qayıdır.
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const [row] = await db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
      return row?.count ?? 0;
    } catch (error) {
      console.error('[NotificationService] Get unread count error:', error);
      return 0; // Return 0 on error instead of throwing
    }
  }
}
