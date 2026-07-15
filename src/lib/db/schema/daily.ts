// src/lib/db/schema/daily.ts
import { pgTable, uuid, date, integer, numeric, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const dailySummaries = pgTable(
  'daily_summaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    date: date('date').notNull(),
    realCustomers: integer('real_customers').default(0),
    realSales: numeric('real_sales', { precision: 12, scale: 2 }).default('0'),
    realPurchases: numeric('real_purchases', { precision: 12, scale: 2 }).default('0'),
    realExpenses: numeric('real_expenses', { precision: 12, scale: 2 }).default('0'),
    realCashStart: numeric('real_cash_start', { precision: 12, scale: 2 }).default('0'),
    realCashEnd: numeric('real_cash_end', { precision: 12, scale: 2 }).default('0'),
    realPos: numeric('real_pos', { precision: 12, scale: 2 }).default('0'),
    realBank: numeric('real_bank', { precision: 12, scale: 2 }).default('0'),
    note: text('note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueDate: uniqueIndex('daily_summaries_date_idx').on(table.date),
  })
);