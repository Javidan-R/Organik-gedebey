// ============================================================
// src/lib/db/schema/products.ts
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
import { categories } from './categories';
import { users } from './users';
import { orders } from './orders';
import { discountTypeEnum, productGradeEnum } from './enums';

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    shortDescription: varchar('short_description', { length: 500 }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    basePrice: decimal('base_price', { precision: 10, scale: 2 }).default('0').notNull(),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }).default('0'),
    discountType: discountTypeEnum('discount_type'),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }),
    discountStart: timestamp('discount_start'),
    discountEnd: timestamp('discount_end'),
    unit: varchar('unit', { length: 50 }).default('ədəd').notNull(),
    grade: productGradeEnum('grade').default('A').notNull(),
    minStock: integer('min_stock').default(10),
    originRegion: varchar('origin_region', { length: 100 }),
    supplier: varchar('supplier', { length: 255 }),
    shelfLifeDays: integer('shelf_life_days'),
    storageConditions: text('storage_conditions'),
    isOrganic: boolean('is_organic').default(false),
    isGlutenFree: boolean('is_gluten_free').default(false),
    isVegan: boolean('is_vegan').default(false),
    caloriesPer100g: integer('calories_per_100g'),
    proteinPer100g: decimal('protein_per_100g', { precision: 5, scale: 2 }),
    carbsPer100g: decimal('carbs_per_100g', { precision: 5, scale: 2 }),
    fatPer100g: decimal('fat_per_100g', { precision: 5, scale: 2 }),
    archived: boolean('archived').default(false),
    isFeatured: boolean('is_featured').default(false),
    isNewArrival: boolean('is_new_arrival').default(false),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    metaKeywords: text('meta_keywords').array(),
    viewCount: integer('view_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
    categoryIdx: index('products_category_idx').on(table.categoryId),
    archivedIdx: index('products_archived_idx').on(table.archived),
  })
);

export const productImages = pgTable(
  'product_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    altText: varchar('alt_text', { length: 255 }),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('product_images_product_idx').on(table.productId),
  })
);

export const productVariants = pgTable(
  'product_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    sku: varchar('sku', { length: 100 }).unique(),
    basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }),
    arrivalCost: decimal('arrival_cost', { precision: 10, scale: 2 }),
    stock: integer('stock').default(0).notNull(),
    minStock: integer('min_stock').default(10),
    unit: varchar('unit', { length: 50 }).default('ədəd'),
    grade: productGradeEnum('grade').default('A'),
    batchDate: timestamp('batch_date'),
    batchNumber: varchar('batch_number', { length: 100 }),
    expiryDate: timestamp('expiry_date'),
    weight: decimal('weight', { precision: 10, scale: 3 }),
    dimensions: varchar('dimensions', { length: 100 }),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('product_variants_product_idx').on(table.productId),
    skuIdx: uniqueIndex('product_variants_sku_idx').on(table.sku),
  })
);

export const productTags = pgTable(
  'product_tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    tag: varchar('tag', { length: 100 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('product_tags_product_idx').on(table.productId),
    tagIdx: index('product_tags_tag_idx').on(table.tag),
    uniqueProductTag: uniqueIndex('product_tags_unique').on(table.productId, table.tag),
  })
);

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    rating: integer('rating').notNull(),
    title: varchar('title', { length: 255 }),
    comment: text('comment'),
    images: text('images').array(),
    isVerifiedPurchase: boolean('is_verified_purchase').default(false),
    isApproved: boolean('is_approved').default(false),
    helpfulCount: integer('helpful_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('reviews_product_idx').on(table.productId),
    userIdx: index('reviews_user_idx').on(table.userId),
    approvedIdx: index('reviews_approved_idx').on(table.isApproved),
  })
);