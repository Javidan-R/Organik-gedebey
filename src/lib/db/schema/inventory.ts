// ============================================================
// src/lib/db/schema/inventory.ts
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  decimal,
  index,
} from 'drizzle-orm/pg-core';
import { products } from './products';
import { productVariants } from './products';
import { users } from './users';
import { inventoryLogTypeEnum, expenseCategoryEnum } from './enums';

export const inventoryLogs = pgTable(
  'inventory_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    type: inventoryLogTypeEnum('type').notNull(),
    qtyChange: integer('qty_change').notNull(),
    qtyBefore: integer('qty_before').notNull(),
    qtyAfter: integer('qty_after').notNull(),
    unit: varchar('unit', { length: 50 }),
    refType: varchar('ref_type', { length: 50 }),
    refId: uuid('ref_id'),
    costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('inventory_logs_product_idx').on(table.productId),
    typeIdx: index('inventory_logs_type_idx').on(table.type),
    createdAtIdx: index('inventory_logs_created_at_idx').on(table.createdAt),
  })
);

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    category: expenseCategoryEnum('category').notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    date: timestamp('date').notNull(),
    paymentMethod: varchar('payment_method', { length: 50 }),
    receiptUrl: text('receipt_url'),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('expenses_category_idx').on(table.category),
    dateIdx: index('expenses_date_idx').on(table.date),
  })
);