// ============================================================
// src/lib/db/schema/categories.ts
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    description: text('description'),
    imageUrl: text('image_url'),
    icon: varchar('icon', { length: 50 }),
    parentId: uuid('parent_id'),
    displayOrder: integer('display_order').default(0),
    isFeatured: boolean('is_featured').default(false),
    isActive: boolean('is_active').default(true),
    archived: boolean('archived').default(false),
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
    parentIdx: index('categories_parent_idx').on(table.parentId),
  })
);