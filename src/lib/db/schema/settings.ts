// ============================================================
// src/lib/db/schema/settings.ts
// ============================================================

import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { products } from './products';
import { productVariants } from './products';

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const wishlist = pgTable(
  'wishlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('wishlist_user_idx').on(table.userId),
    productIdIdx: index('wishlist_product_idx').on(table.productId),
    uniqueUserProduct: uniqueIndex('wishlist_unique_user_product').on(table.userId, table.productId),
  })
);