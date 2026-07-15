// src/lib/db/schema/notifications.ts

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './users';
import { orders } from './orders';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    refType: varchar('ref_type', { length: 50 }),
    refId: uuid('ref_id'),
    channel: varchar('channel', { length: 20 }).default('APP').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    typeIdx: index('notifications_type_idx').on(table.type),
    channelIdx: index('notifications_channel_idx').on(table.channel),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
  })
);

// whatsappMessages table olduğu kimi qalır
export const whatsappMessages = pgTable(
  'whatsapp_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    phone: varchar('phone', { length: 20 }).notNull(),
    direction: varchar('direction', { length: 10 }).notNull(),
    messageType: varchar('message_type', { length: 50 }),
    content: text('content'),
    mediaUrl: text('media_url'),
    status: varchar('status', { length: 50 }),
    orderId: uuid('order_id').references(() => orders.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    phoneIdx: index('whatsapp_messages_phone_idx').on(table.phone),
    userIdx: index('whatsapp_messages_user_idx').on(table.userId),
    createdAtIdx: index('whatsapp_messages_created_at_idx').on(table.createdAt),
  })
);