// ============================================================
// src/lib/db/schema/aboutUs.ts
// ============================================================

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

export const aboutUsSections = pgTable(
  'about_us_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    subtitle: varchar('subtitle', { length: 500 }),
    description: text('description').notNull(),
    imageUrl: text('image_url'),
    videoUrl: text('video_url'),
    displayOrder: integer('display_order').default(0),
    isActive: boolean('is_active').default(true),
    sectionType: varchar('section_type', { length: 50 }).notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    displayOrderIdx: index('about_us_sections_display_order_idx').on(table.displayOrder),
    sectionTypeIdx: index('about_us_sections_section_type_idx').on(table.sectionType),
    activeIdx: index('about_us_sections_active_idx').on(table.isActive),
  })
);

export const aboutUsRegions = pgTable(
  'about_us_regions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    featuredProducts: text('featured_products').array(),
    displayOrder: integer('display_order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    displayOrderIdx: index('about_us_regions_display_order_idx').on(table.displayOrder),
    activeIdx: index('about_us_regions_active_idx').on(table.isActive),
  })
);

export const aboutUsStats = pgTable(
  'about_us_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    label: varchar('label', { length: 100 }).notNull(),
    value: varchar('value', { length: 100 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 50 }),
    displayOrder: integer('display_order').default(0),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    displayOrderIdx: index('about_us_stats_display_order_idx').on(table.displayOrder),
    activeIdx: index('about_us_stats_active_idx').on(table.isActive),
  })
);