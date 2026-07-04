// ============================================================
// src/lib/db/schema/coupons.ts
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { orders } from './orders';
import { discountTypeEnum } from './enums';

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    discountType: discountTypeEnum('discount_type').notNull(),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
    minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
    maxDiscountAmount: decimal('max_discount_amount', { precision: 10, scale: 2 }),
    usageLimit: integer('usage_limit'),
    usagePerUser: integer('usage_per_user').default(1),
    applicableTo: varchar('applicable_to', { length: 50 }).default('all'),
    categoryIds: text('category_ids').array(),
    productIds: text('product_ids').array(),
    validFrom: timestamp('valid_from'),
    validUntil: timestamp('valid_until'),
    isActive: boolean('is_active').default(true),
    totalUsed: integer('total_used').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('coupons_code_idx').on(table.code),
    activeIdx: index('coupons_active_idx').on(table.isActive),
  })
);

export const couponUsage = pgTable(
  'coupon_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    discountApplied: decimal('discount_applied', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    couponIdx: index('coupon_usage_coupon_idx').on(table.couponId),
    userIdx: index('coupon_usage_user_idx').on(table.userId),
  })
);