// ============================================================
// src/lib/db/schema/enums.ts
// ============================================================

// src/lib/db/schema/enums.ts

import { pgEnum } from 'drizzle-orm/pg-core';

export const notificationTypeEnum = pgEnum('notification_type', [
  'ORDER_CREATED',
  'ORDER_PAID',
  'ORDER_CONFIRMED',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'ORDER_CANCELLED',
  'ORDER_STATUS_CHANGED',
  'NEW_PRODUCT',
  'PRODUCT_UPDATED',
  'LOW_STOCK',
  'OUT_OF_STOCK',
  'STOCK_RESTOCKED',
  'NEW_MESSAGE',
  'SYSTEM',
  'PROMOTION',
  'CUSTOMER_REGISTERED',
  'DELIVERY_STARTED',
  'DELIVERY_COMPLETED',
  'PAYMENT_RECEIVED',
  'COUPON_USED',
  'WAREHOUSE_ALERT',
  'PRICE_CHANGE',
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'APP',
  'EMAIL',
  'WHATSAPP',
  'SMS',
]);


export const userRoleEnum = pgEnum('user_role', [
  'CUSTOMER',
  'COURIER',
  'WAREHOUSE_STAFF',
  'MANAGER',
  'ADMIN',
  'SUPERADMIN',
]);

export const addressTypeEnum = pgEnum('address_type', [
  'HOME',
  'WORK',
  'OTHER',
]);

export const discountTypeEnum = pgEnum('discount_type', [
  'PERCENTAGE',
  'FIXED',
]);

export const productGradeEnum = pgEnum('product_grade', [
  'A',
  'B',
  'C',
  'UNSORTED',
]);

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'UNPAID',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH_ON_DELIVERY',
  'CARD',
  'BANK_TRANSFER',
]);

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'PENDING',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'RETURNED',
]);


export const inventoryLogTypeEnum = pgEnum('inventory_log_type', [
  'PURCHASE',
  'SALE',
  'RETURN',
  'ADJUSTMENT',
  'SPOILAGE',
  'TRANSFER',
]);

export const expenseCategoryEnum = pgEnum('expense_category', [
  'SUPPLIES',
  'DELIVERY',
  'RENT',
  'UTILITIES',
  'SALARIES',
  'MARKETING',
  'OTHER',
]);

export const basketTypeEnum = pgEnum('basket_type', [
  'gence',
  'gedebey',
  'sheki',
  'lenkaran',
  'ramazan',
  'custom',
]);

export const basketVariantEnum = pgEnum('basket_variant', [
  'econom',
  'standard',
  'premium',
]);

export const accountTypeEnum = pgEnum('account_type', [
  'cash',
  'bank',
  'pos',
  'wallet',
]);
