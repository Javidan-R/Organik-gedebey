// ============================================================
// src/lib/db/schema/orders.ts
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { addresses } from './users';
import { products } from './products';
import { productVariants } from './products';
import { baskets, basketVariants } from './baskets';
import { orderStatusEnum, paymentStatusEnum, paymentMethodEnum, deliveryStatusEnum } from './enums';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    customerName: varchar('customer_name', { length: 200 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
    deliveryAddressId: uuid('delivery_address_id').references(() => addresses.id),
    deliveryAddressText: text('delivery_address_text').notNull(),
    address: text('address'),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
    deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0'),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    couponCode: varchar('coupon_code', { length: 50 }),
    couponDiscount: decimal('coupon_discount', { precision: 10, scale: 2 }).default('0'),
    status: orderStatusEnum('status').default('PENDING').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').default('UNPAID').notNull(),
    paymentMethod: paymentMethodEnum('payment_method'),
    deliveryDate: timestamp('delivery_date'),
    deliveryTimeSlot: varchar('delivery_time_slot', { length: 50 }),
    courierId: uuid('courier_id').references(() => users.id),
    trackingNumber: varchar('tracking_number', { length: 100 }),
    estimatedDelivery: timestamp('estimated_delivery'),
    actualDelivery: timestamp('actual_delivery'),
    customerNotes: text('customer_notes'),
    adminNotes: text('admin_notes'),
    cancellationReason: text('cancellation_reason'),
    confirmedAt: timestamp('confirmed_at'),
    preparingAt: timestamp('preparing_at'),
    readyAt: timestamp('ready_at'),
    outForDeliveryAt: timestamp('out_for_delivery_at'),
    deliveredAt: timestamp('delivered_at'),
    cancelledAt: timestamp('cancelled_at'),
    rating: integer('rating'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('orders_user_idx').on(table.userId),
    statusIdx: index('orders_status_idx').on(table.status),
    orderNumberIdx: uniqueIndex('orders_number_idx').on(table.orderNumber),
    createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  })
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    basketId: uuid('basket_id').references(() => baskets.id, { onDelete: 'set null' }),
    basketVariantId: uuid('basket_variant_id').references(() => basketVariants.id, { onDelete: 'set null' }),
    productName: varchar('product_name', { length: 255 }).notNull(),
    variantName: varchar('variant_name', { length: 255 }),
    basketName: varchar('basket_name', { length: 255 }),
    basketVariantName: varchar('basket_variant_name', { length: 255 }),
    qty: integer('qty').notNull(),
    unit: varchar('unit', { length: 50 }),
    priceAtOrder: decimal('price_at_order', { precision: 10, scale: 2 }).notNull(),
    costAtOrder: decimal('cost_at_order', { precision: 10, scale: 2 }),
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index('order_items_order_idx').on(table.orderId),
    productIdx: index('order_items_product_idx').on(table.productId),
    basketIdx: index('order_items_basket_idx').on(table.basketId),
  })
);

export const deliveries = pgTable(
  'deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().unique().references(() => orders.id, { onDelete: 'cascade' }),
    courierId: uuid('courier_id').references(() => users.id),
    status: deliveryStatusEnum('status').default('PENDING').notNull(),
    pickupLatitude: decimal('pickup_latitude', { precision: 10, scale: 8 }),
    pickupLongitude: decimal('pickup_longitude', { precision: 11, scale: 8 }),
    deliveryLatitude: decimal('delivery_latitude', { precision: 10, scale: 8 }),
    deliveryLongitude: decimal('delivery_longitude', { precision: 11, scale: 8 }),
    scheduledDate: timestamp('scheduled_date'),
    scheduledTimeSlot: varchar('scheduled_time_slot', { length: 50 }),
    pickedUpAt: timestamp('picked_up_at'),
    deliveredAt: timestamp('delivered_at'),
    estimatedDistanceKm: decimal('estimated_distance_km', { precision: 10, scale: 2 }),
    actualDistanceKm: decimal('actual_distance_km', { precision: 10, scale: 2 }),
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    actualDurationMinutes: integer('actual_duration_minutes'),
    courierNotes: text('courier_notes'),
    customerSignatureUrl: text('customer_signature_url'),
    deliveryPhotoUrl: text('delivery_photo_url'),
    failedReason: text('failed_reason'),
    failedAt: timestamp('failed_at'),
    reattemptCount: integer('reattempt_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    courierIdx: index('deliveries_courier_idx').on(table.courierId),
    statusIdx: index('deliveries_status_idx').on(table.status),
    scheduledDateIdx: index('deliveries_scheduled_date_idx').on(table.scheduledDate),
  })
);

export const deliveryTracking = pgTable(
  'delivery_tracking',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deliveryId: uuid('delivery_id').notNull().references(() => deliveries.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    deliveryIdx: index('delivery_tracking_delivery_idx').on(table.deliveryId),
    createdAtIdx: index('delivery_tracking_created_at_idx').on(table.createdAt),
  })
);