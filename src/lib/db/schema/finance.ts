// ============================================================
// src/lib/db/schema/finance.ts
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
} from 'drizzle-orm/pg-core';
import { products } from './products';
import { productVariants } from './products';
import { accountTypeEnum } from './enums';

export const financeSuppliers = pgTable(
  'finance_suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }),
    email: varchar('email', { length: 255 }),
    address: text('address'),
    note: text('note'),
    paymentTermDays: integer('payment_term_days').default(7),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('finance_suppliers_name_idx').on(table.name),
  })
);

export const financeAccounts = pgTable(
  'finance_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    type: accountTypeEnum('type').notNull(),
    currency: varchar('currency', { length: 10 }).default('AZN'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    typeIdx: index('finance_accounts_type_idx').on(table.type),
  })
);

export const financePurchases = pgTable(
  'finance_purchases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: timestamp('date').notNull(),
    supplierId: uuid('supplier_id').notNull().references(() => financeSuppliers.id),
    productId: uuid('product_id').references(() => products.id),
    variantId: uuid('variant_id').references(() => productVariants.id),
    qty: integer('qty').notNull(),
    unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).notNull(),
    accountId: uuid('account_id').references(() => financeAccounts.id),
    paid: decimal('paid', { precision: 10, scale: 2 }).default('0'),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    supplierIdx: index('finance_purchases_supplier_idx').on(table.supplierId),
    productIdx: index('finance_purchases_product_idx').on(table.productId),
    dateIdx: index('finance_purchases_date_idx').on(table.date),
  })
);

export const financePayments = pgTable(
  'finance_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: timestamp('date').notNull(),
    supplierId: uuid('supplier_id').notNull().references(() => financeSuppliers.id),
    accountId: uuid('account_id').notNull().references(() => financeAccounts.id),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    supplierIdx: index('finance_payments_supplier_idx').on(table.supplierId),
    accountIdx: index('finance_payments_account_idx').on(table.accountId),
    dateIdx: index('finance_payments_date_idx').on(table.date),
  })
);

export const financeLedger = pgTable(
  'finance_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: timestamp('date').notNull(),
    accountId: uuid('account_id').notNull().references(() => financeAccounts.id),
    type: varchar('type', { length: 10 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    refKind: varchar('ref_kind', { length: 50 }),
    refId: uuid('ref_id'),
    memo: text('memo'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    accountIdx: index('finance_ledger_account_idx').on(table.accountId),
    dateIdx: index('finance_ledger_date_idx').on(table.date),
    refIdx: index('finance_ledger_ref_idx').on(table.refKind, table.refId),
  })
);

export const financeBatches = pgTable(
  'finance_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id),
    variantId: uuid('variant_id').references(() => productVariants.id),
    date: timestamp('date').notNull(),
    qty: integer('qty').notNull(),
    unitCost: decimal('unit_cost', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('finance_batches_product_idx').on(table.productId),
    dateIdx: index('finance_batches_date_idx').on(table.date),
  })
);