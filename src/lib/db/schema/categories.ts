// src/lib/db/schema/categories.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    // Şəkil sahələri
    imageUrl: text('image_url'),
    imageId: text('image_id'), // Cloudinary public ID və ya S3 key
    imageAlt: varchar('image_alt', { length: 255 }),
    // Görünüş
    color: varchar('color', { length: 7 }),
    icon: varchar('icon', { length: 50 }),
    // Təşkilat
    parentId: uuid('parent_id').references(() => categories.id, { onDelete: 'set null' }),
    displayOrder: integer('display_order').default(0),
    // Vəziyyət
    isFeatured: boolean('is_featured').default(false),
    isActive: boolean('is_active').default(true),
    archived: boolean('archived').default(false),
    // SEO
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    metaKeywords: text('meta_keywords'),
    // Tarixlər və izləmə
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    updatedBy: uuid('updated_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => ({
    slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
    parentIdx: index('categories_parent_idx').on(table.parentId),
    activeIdx: index('categories_active_idx').on(table.isActive),
    archivedIdx: index('categories_archived_idx').on(table.archived),
    featuredIdx: index('categories_featured_idx').on(table.isFeatured),
    displayOrderIdx: index('categories_display_order_idx').on(table.displayOrder),
    createdAtIdx: index('categories_created_at_idx').on(table.createdAt),
    activeFeaturedIdx: index('categories_active_featured_idx').on(table.isActive, table.isFeatured),
    parentActiveIdx: index('categories_parent_active_idx').on(table.parentId, table.isActive),
  })
);