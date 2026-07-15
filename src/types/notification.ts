// src/types/notification.ts

export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_PAID'
  | 'ORDER_CONFIRMED'
  | 'ORDER_SHIPPED'
  | 'ORDER_DELIVERED'
  | 'ORDER_CANCELLED'
  | 'ORDER_STATUS_CHANGED'
  | 'NEW_PRODUCT'
  | 'PRODUCT_UPDATED'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'STOCK_RESTOCKED'
  | 'NEW_MESSAGE'
  | 'SYSTEM'
  | 'PROMOTION'
  | 'CUSTOMER_REGISTERED'
  | 'DELIVERY_STARTED'
  | 'DELIVERY_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'COUPON_USED'
  | 'WAREHOUSE_ALERT'
  | 'PRICE_CHANGE';

export type NotificationChannel = 'APP' | 'EMAIL' | 'WHATSAPP' | 'SMS';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  refType: string | null;
  refId: string | null;
  channel: NotificationChannel;
  isRead: boolean;
  readAt: string | null;
  data: Record<string, any> | null;
  createdAt: string;
  // Frontend helper
  read?: boolean;
  desc?: string;
  time?: string;
}