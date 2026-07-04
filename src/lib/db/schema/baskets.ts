// ============================================================
// src/lib/db/schema/baskets.ts
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
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { basketTypeEnum, basketVariantEnum } from './enums';
import { categories } from './categories';
import { orders, products, productVariants, users } from '.';

export const baskets = pgTable(
  'baskets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    tagline: varchar('tagline', { length: 500 }),
    description: text('description').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    type: basketTypeEnum('type').notNull(),
    servings: varchar('servings', { length: 100 }),
    unit: varchar('unit', { length: 50 }).default('səbət'),
    origin: varchar('origin', { length: 255 }),
    freshness: varchar('freshness', { length: 255 }),
    nutrition: text('nutrition').array(),
    bestseller: boolean('bestseller').default(false),
    trending: boolean('trending').default(false),
    new: boolean('new').default(false),
    lowStock: boolean('low_stock').default(false),
    stock: integer('stock').default(0),
    discount: integer('discount').default(0),
    highlights: text('highlights').array(),
    displayOrder: integer('display_order').default(0),
    isActive: boolean('is_active').default(true),
    archived: boolean('archived').default(false),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    viewCount: integer('view_count').default(0),
    soldCount: integer('sold_count').default(0),
    averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
    reviewCount: integer('review_count').default(0),
    favoriteCount: integer('favorite_count').default(0),
    seasonalStart: timestamp('seasonal_start'),
    seasonalEnd: timestamp('seasonal_end'),
    isSeasonal: boolean('is_seasonal').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('baskets_slug_idx').on(table.slug),
    categoryIdx: index('baskets_category_idx').on(table.categoryId),
    typeIdx: index('baskets_type_idx').on(table.type),
    archivedIdx: index('baskets_archived_idx').on(table.archived),
    createdAtIdx: index('baskets_created_at_idx').on(table.createdAt),
  })
);

export const basketMedia = pgTable(
  'basket_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 20 }).notNull(),
    url: text('url').notNull(),
    altText: varchar('alt_text', { length: 255 }),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basketIdx: index('basket_media_basket_idx').on(table.basketId),
  })
);

export const basketVariants = pgTable(
  'basket_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    variant: basketVariantEnum('variant').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
    stock: integer('stock').default(0),
    gift: text('gift'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    basketIdx: index('basket_variants_basket_idx').on(table.basketId),
    uniqueBasketVariant: uniqueIndex('basket_variants_unique').on(table.basketId, table.variant),
  })
);

export const basketContents = pgTable(
  'basket_contents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketVariantId: uuid('basket_variant_id').notNull().references(() => basketVariants.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basketVariantIdx: index('basket_contents_basket_variant_idx').on(table.basketVariantId),
  })
);

export const basketExtras = pgTable(
  'basket_extras',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketVariantId: uuid('basket_variant_id').notNull().references(() => basketVariants.id, { onDelete: 'cascade' }),
    extra: text('extra').notNull(),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basketVariantIdx: index('basket_extras_basket_variant_idx').on(table.basketVariantId),
  })
);

export const basketFavorites = pgTable(
  'basket_favorites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('basket_favorites_user_idx').on(table.userId),
    basketIdx: index('basket_favorites_basket_idx').on(table.basketId),
    uniqueUserBasket: uniqueIndex('basket_favorites_unique').on(table.userId, table.basketId),
  })
);

export const basketReviews = pgTable(
  'basket_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
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
    basketIdx: index('basket_reviews_basket_idx').on(table.basketId),
    userIdx: index('basket_reviews_user_idx').on(table.userId),
    approvedIdx: index('basket_reviews_approved_idx').on(table.isApproved),
  })
);

export const basketProducts = pgTable(
  'basket_products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    basketVariantId: uuid('basket_variant_id').references(() => basketVariants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    productVariantId: uuid('product_variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 50 }),
    displayOrder: integer('display_order').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basketIdx: index('basket_products_basket_idx').on(table.basketId),
    basketVariantIdx: index('basket_products_basket_variant_idx').on(table.basketVariantId),
    productIdx: index('basket_products_product_idx').on(table.productId),
  })
);

export const basketAnalytics = pgTable(
  'basket_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    sessionId: varchar('session_id', { length: 255 }),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basketIdx: index('basket_analytics_basket_idx').on(table.basketId),
    userIdx: index('basket_analytics_user_idx').on(table.userId),
    eventTypeIdx: index('basket_analytics_event_type_idx').on(table.eventType),
    createdAtIdx: index('basket_analytics_created_at_idx').on(table.createdAt),
  })
);