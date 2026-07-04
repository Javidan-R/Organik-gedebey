// ============================================================
// src/lib/db/schema/users.ts
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
import { addressTypeEnum, userRoleEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 20 }).unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    role: userRoleEnum('role').default('CUSTOMER').notNull(),
    avatarUrl: text('avatar_url'),
    isEmailVerified: boolean('is_email_verified').default(false),
    isPhoneVerified: boolean('is_phone_verified').default(false),
    defaultAddressId: uuid('default_address_id'),
    totalOrders: integer('total_orders').default(0),
    totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
    loyaltyPoints: integer('loyalty_points').default(0),
    isActive: boolean('is_active').default(true),
    isBlocked: boolean('is_blocked').default(false),
    blockedReason: text('blocked_reason'),
    lastLoginAt: timestamp('last_login_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    phoneIdx: index('users_phone_idx').on(table.phone),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

export const addresses = pgTable(
  'addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: addressTypeEnum('type').notNull(),
    label: varchar('label', { length: 100 }),
    fullName: varchar('full_name', { length: 200 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    district: varchar('district', { length: 100 }),
    street: varchar('street', { length: 255 }).notNull(),
    building: varchar('building', { length: 50 }),
    apartment: varchar('apartment', { length: 50 }),
    floor: varchar('floor', { length: 20 }),
    postalCode: varchar('postal_code', { length: 20 }),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    notes: text('notes'),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('addresses_user_idx').on(table.userId),
    cityIdx: index('addresses_city_idx').on(table.city),
  })
);