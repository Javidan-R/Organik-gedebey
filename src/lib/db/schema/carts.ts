// ============================================================
// 1. src/lib/db/schema/carts.ts – ƏLAVƏ SAHƏLƏR
// ============================================================
import { pgTable, uuid, varchar, text, timestamp, decimal, integer, boolean } from 'drizzle-orm/pg-core';
import { users } from './users';
import { products } from './products';
import { productVariants } from './products';

export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('active'), // active, ordered, completed, custom
  isCustom: boolean('is_custom').default(false), // ✅ əlavə: custom basket flag
  customNote: text('custom_note'), // ✅ istifadəçinin əlavə qeydi
  deliveryDate: timestamp('delivery_date'),
  deliveryTimeSlot: varchar('delivery_time_slot', { length: 50 }),
  customerNote: text('customer_note'),
  adminNote: text('admin_note'), // ✅ admin qeydi
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
  customName: varchar('custom_name', { length: 255 }),
  customPrice: decimal('custom_price', { precision: 10, scale: 2 }),
  quantity: integer('quantity').default(1),
  note: text('note'),
  isCustomItem: boolean('is_custom_item').default(false), // ✅ bu item customdursa
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});