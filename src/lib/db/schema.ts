// lib/db/schema.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  decimal,
  integer,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
 
// ============================================
// ENUMS
// ============================================

export const userRoleEnum = pgEnum('user_role', [
  'CUSTOMER',
  'COURIER',
  'WAREHOUSE_STAFF',
  'MANAGER',
  'ADMIN',
  'SUPERADMIN',
])

export const addressTypeEnum = pgEnum('address_type', [
  'HOME',
  'WORK',
  'OTHER',
])

export const discountTypeEnum = pgEnum('discount_type', [
  'PERCENTAGE',
  'FIXED',
])

export const productGradeEnum = pgEnum('product_grade', [
  'A',
  'B',
  'C',
  'UNSORTED',
])

export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'UNPAID',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
])

export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH_ON_DELIVERY',
  'CARD',
  'BANK_TRANSFER',
])

export const deliveryStatusEnum = pgEnum('delivery_status', [
  'PENDING',
  'ASSIGNED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'FAILED',
  'RETURNED',
])

export const notificationTypeEnum = pgEnum('notification_type', [
  'ORDER',
  'DELIVERY',
  'PRODUCT',
  'SYSTEM',
  'PROMOTION',
])

export const notificationChannelEnum = pgEnum('notification_channel', [
  'APP',
  'EMAIL',
  'SMS',
  'PUSH',
])

export const inventoryLogTypeEnum = pgEnum('inventory_log_type', [
  'PURCHASE',
  'SALE',
  'RETURN',
  'ADJUSTMENT',
  'SPOILAGE',
  'TRANSFER',
])

export const expenseCategoryEnum = pgEnum('expense_category', [
  'SUPPLIES',
  'DELIVERY',
  'RENT',
  'UTILITIES',
  'SALARIES',
  'MARKETING',
  'OTHER',
])


// ============================================
// USERS & AUTH
// ============================================

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
    
    // Statistics
    totalOrders: integer('total_orders').default(0),
    totalSpent: decimal('total_spent', { precision: 10, scale: 2 }).default('0'),
    loyaltyPoints: integer('loyalty_points').default(0),
    
    // Status
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
)

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
)

// ============================================
// PRODUCTS & CATEGORIES
// ============================================

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
)

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    
    description: text('description'),
    shortDescription: varchar('short_description', { length: 500 }),
    
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    
    // Pricing
    basePrice: decimal('base_price', { precision: 10, scale: 2 }).default('0').notNull(),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }).default('0'),
    
    // Discount
    discountType: discountTypeEnum('discount_type'),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }),
    discountStart: timestamp('discount_start'),
    discountEnd: timestamp('discount_end'),
    
    // Unit & Quality
    unit: varchar('unit', { length: 50 }).default('ədəd').notNull(),
    grade: productGradeEnum('grade').default('A').notNull(),
    
    // Stock
    minStock: integer('min_stock').default(10),
    
    // Origin
    originRegion: varchar('origin_region', { length: 100 }),
    supplier: varchar('supplier', { length: 255 }),
    
    // Freshness
    shelfLifeDays: integer('shelf_life_days'),
    storageConditions: text('storage_conditions'),
    
    // Product attributes
    isOrganic: boolean('is_organic').default(false),
    isGlutenFree: boolean('is_gluten_free').default(false),
    isVegan: boolean('is_vegan').default(false),
    
    // Nutritional (per 100g)
    caloriesPer100g: integer('calories_per_100g'),
    proteinPer100g: decimal('protein_per_100g', { precision: 5, scale: 2 }),
    carbsPer100g: decimal('carbs_per_100g', { precision: 5, scale: 2 }),
    fatPer100g: decimal('fat_per_100g', { precision: 5, scale: 2 }),
    
    // Status
    archived: boolean('archived').default(false),
    isFeatured: boolean('is_featured').default(false),
    isNewArrival: boolean('is_new_arrival').default(false),
    
    // SEO
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    metaKeywords: text('meta_keywords').array(),
    
    // Analytics
    viewCount: integer('view_count').default(0),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
    categoryIdx: index('products_category_idx').on(table.categoryId),
    archivedIdx: index('products_archived_idx').on(table.archived),
  })
)

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
)

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
    
    // Batch info
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
)

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
)

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    
    rating: integer('rating').notNull(), // 1-5
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
)

// ============================================
// ORDERS
// ============================================

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    
    // Customer info (for guest checkout)
    customerName: varchar('customer_name', { length: 200 }).notNull(),
    customerEmail: varchar('customer_email', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
    
    // Address
    deliveryAddressId: uuid('delivery_address_id').references(() => addresses.id),
    deliveryAddressText: text('delivery_address_text').notNull(),
    address: text('address'), // Additional address field for compatibility
    
    // Financials
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0'),
    deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0'),
    total: decimal('total', { precision: 10, scale: 2 }).notNull(),
    
    // Coupon
    couponCode: varchar('coupon_code', { length: 50 }),
    couponDiscount: decimal('coupon_discount', { precision: 10, scale: 2 }).default('0'),
    
    // Status
    status: orderStatusEnum('status').default('PENDING').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').default('UNPAID').notNull(),
    paymentMethod: paymentMethodEnum('payment_method'),
    
    // Delivery
    deliveryDate: timestamp('delivery_date'),
    deliveryTimeSlot: varchar('delivery_time_slot', { length: 50 }),
    courierId: uuid('courier_id').references(() => users.id),
    
    // Tracking
    trackingNumber: varchar('tracking_number', { length: 100 }),
    estimatedDelivery: timestamp('estimated_delivery'),
    actualDelivery: timestamp('actual_delivery'),
    
    // Notes
    customerNotes: text('customer_notes'),
    adminNotes: text('admin_notes'),
    cancellationReason: text('cancellation_reason'),
    
    // Timeline
    confirmedAt: timestamp('confirmed_at'),
    preparingAt: timestamp('preparing_at'),
    readyAt: timestamp('ready_at'),
    outForDeliveryAt: timestamp('out_for_delivery_at'),
    deliveredAt: timestamp('delivered_at'),
    cancelledAt: timestamp('cancelled_at'),
    
    // Rating
    rating: integer('rating'), // 1-5 rating for delivered orders
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('orders_user_idx').on(table.userId),
    statusIdx: index('orders_status_idx').on(table.status),
    orderNumberIdx: uniqueIndex('orders_number_idx').on(table.orderNumber),
    createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  })
)

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    basketId: uuid('basket_id').references(() => baskets.id, { onDelete: 'set null' }),
    basketVariantId: uuid('basket_variant_id').references(() => basketVariants.id, { onDelete: 'set null' }),
    
    // Snapshot
    productName: varchar('product_name', { length: 255 }).notNull(),
    variantName: varchar('variant_name', { length: 255 }),
    basketName: varchar('basket_name', { length: 255 }),
    basketVariantName: varchar('basket_variant_name', { length: 255 }),
    
    qty: integer('qty').notNull(),
    unit: varchar('unit', { length: 50 }),
    
    priceAtOrder: decimal('price_at_order', { precision: 10, scale: 2 }).notNull(),
    costAtOrder: decimal('cost_at_order', { precision: 10, scale: 2 }),
    
    subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    orderIdx: index('order_items_order_idx').on(table.orderId),
    productIdx: index('order_items_product_idx').on(table.productId),
    basketIdx: index('order_items_basket_idx').on(table.basketId),
  })
)

// ============================================
// DELIVERIES
// ============================================

export const deliveries = pgTable(
  'deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().unique().references(() => orders.id, { onDelete: 'cascade' }),
    
    courierId: uuid('courier_id').references(() => users.id),
    
    status: deliveryStatusEnum('status').default('PENDING').notNull(),
    
    // Geolocation
    pickupLatitude: decimal('pickup_latitude', { precision: 10, scale: 8 }),
    pickupLongitude: decimal('pickup_longitude', { precision: 11, scale: 8 }),
    deliveryLatitude: decimal('delivery_latitude', { precision: 10, scale: 8 }),
    deliveryLongitude: decimal('delivery_longitude', { precision: 11, scale: 8 }),
    
    // Scheduling
    scheduledDate: timestamp('scheduled_date'),
    scheduledTimeSlot: varchar('scheduled_time_slot', { length: 50 }),
    pickedUpAt: timestamp('picked_up_at'),
    deliveredAt: timestamp('delivered_at'),
    
    // Distance & Duration
    estimatedDistanceKm: decimal('estimated_distance_km', { precision: 10, scale: 2 }),
    actualDistanceKm: decimal('actual_distance_km', { precision: 10, scale: 2 }),
    estimatedDurationMinutes: integer('estimated_duration_minutes'),
    actualDurationMinutes: integer('actual_duration_minutes'),
    
    // Notes & Proof
    courierNotes: text('courier_notes'),
    customerSignatureUrl: text('customer_signature_url'),
    deliveryPhotoUrl: text('delivery_photo_url'),
    
    // Failed delivery
    failedReason: text('failed_reason'),
    failedAt: timestamp('failed_at'),
    reattemptCount: integer('reattempt_count').default(0),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    courierIdx: index('deliveries_courier_idx').on(table.courierId),
    statusIdx: index('deliveries_status_idx').on(table.status),
    scheduledDateIdx: index('deliveries_scheduled_date_idx').on(table.scheduledDate),
  })
)

export const deliveryTracking = pgTable(
  'delivery_tracking',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deliveryId: uuid('delivery_id').notNull().references(() => deliveries.id, { onDelete: 'cascade' }),
    
    status: varchar('status', { length: 50 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    deliveryIdx: index('delivery_tracking_delivery_idx').on(table.deliveryId),
    createdAtIdx: index('delivery_tracking_created_at_idx').on(table.createdAt),
  })
)

// ============================================
// COUPONS
// ============================================

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    code: varchar('code', { length: 50 }).notNull().unique(),
    
    discountType: discountTypeEnum('discount_type').notNull(),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).notNull(),
    
    // Limits
    minOrderAmount: decimal('min_order_amount', { precision: 10, scale: 2 }),
    maxDiscountAmount: decimal('max_discount_amount', { precision: 10, scale: 2 }),
    usageLimit: integer('usage_limit'),
    usagePerUser: integer('usage_per_user').default(1),
    
    // Applicability
    applicableTo: varchar('applicable_to', { length: 50 }).default('all'),
    categoryIds: text('category_ids').array(),
    productIds: text('product_ids').array(),
    
    // Dates
    validFrom: timestamp('valid_from'),
    validUntil: timestamp('valid_until'),
    
    // Status
    isActive: boolean('is_active').default(true),
    
    // Stats
    totalUsed: integer('total_used').default(0),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('coupons_code_idx').on(table.code),
    activeIdx: index('coupons_active_idx').on(table.isActive),
  })
)

export const couponUsage = pgTable(
  'coupon_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    couponId: uuid('coupon_id').notNull().references(() => coupons.id, { onDelete: 'cascade' }),
    
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    
    discountApplied: decimal('discount_applied', { precision: 10, scale: 2 }).notNull(),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    couponIdx: index('coupon_usage_coupon_idx').on(table.couponId),
    userIdx: index('coupon_usage_user_idx').on(table.userId),
  })
)

// ============================================
// NOTIFICATIONS & COMMUNICATIONS
// ============================================

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    
    type: notificationTypeEnum('type').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    
    refType: varchar('ref_type', { length: 50 }),
    refId: uuid('ref_id'),
    
    channel: notificationChannelEnum('channel').default('APP'),
    
    isRead: boolean('is_read').default(false),
    readAt: timestamp('read_at'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('notifications_user_idx').on(table.userId),
    readIdx: index('notifications_read_idx').on(table.isRead),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  })
)

export const whatsappMessages = pgTable(
  'whatsapp_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    userId: uuid('user_id').references(() => users.id),
    phone: varchar('phone', { length: 20 }).notNull(),
    
    direction: varchar('direction', { length: 10 }).notNull(), // INBOUND, OUTBOUND
    messageType: varchar('message_type', { length: 50 }),
    content: text('content'),
    mediaUrl: text('media_url'),
    
    status: varchar('status', { length: 50 }), // SENT, DELIVERED, READ, FAILED
    
    orderId: uuid('order_id').references(() => orders.id),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    phoneIdx: index('whatsapp_messages_phone_idx').on(table.phone),
    userIdx: index('whatsapp_messages_user_idx').on(table.userId),
    createdAtIdx: index('whatsapp_messages_created_at_idx').on(table.createdAt),
  })
)

// ============================================
// INVENTORY & FINANCE
// ============================================

export const inventoryLogs = pgTable(
  'inventory_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    
    type: inventoryLogTypeEnum('type').notNull(),
    
    qtyChange: integer('qty_change').notNull(),
    qtyBefore: integer('qty_before').notNull(),
    qtyAfter: integer('qty_after').notNull(),
    
    unit: varchar('unit', { length: 50 }),
    
    // Reference
    refType: varchar('ref_type', { length: 50 }),
    refId: uuid('ref_id'),
    
    costPerUnit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }),
    
    notes: text('notes'),
    createdBy: uuid('created_by').references(() => users.id),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    productIdx: index('inventory_logs_product_idx').on(table.productId),
    typeIdx: index('inventory_logs_type_idx').on(table.type),
    createdAtIdx: index('inventory_logs_created_at_idx').on(table.createdAt),
  })
)

export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    
    category: expenseCategoryEnum('category').notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    
    date: timestamp('date').notNull(),
    
    paymentMethod: varchar('payment_method', { length: 50 }),
    receiptUrl: text('receipt_url'),
    
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index('expenses_category_idx').on(table.category),
    dateIdx: index('expenses_date_idx').on(table.date),
  })
)

// ============================================
// SYSTEM
// ============================================

export const adminLogs = pgTable(
  'admin_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id),
    
    action: varchar('action', { length: 100 }).notNull(),
    
    entityType: varchar('entity_type', { length: 50 }),
    entityId: uuid('entity_id'),
    
    details: jsonb('details'),
    ipAddress: varchar('ip_address', { length: 50 }),
    userAgent: text('user_agent'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('admin_logs_user_idx').on(table.userId),
    actionIdx: index('admin_logs_action_idx').on(table.action),
    createdAtIdx: index('admin_logs_created_at_idx').on(table.createdAt),
  })
)


export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const wishlist = pgTable(
  'wishlist',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index('wishlist_user_idx').on(table.userId),
    productIdIdx: index('wishlist_product_idx').on(table.productId),
    uniqueUserProduct: uniqueIndex('wishlist_unique_user_product').on(table.userId, table.productId),
  })
)

// ============================================
// RELATIONS (for TypeScript types)
// ============================================

export const usersRelations = relations(users, ({ many, one }) => ({
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  basketFavorites: many(basketFavorites),
  basketReviews: many(basketReviews),
  notifications: many(notifications),
  wishlist: many(wishlist),
  defaultAddress: one(addresses, {
    fields: [users.defaultAddressId],
    references: [addresses.id],
  }),
}))

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  baskets: many(baskets),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
}))

export const productsRelations = relations(products, ({ many, one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants),
  tags: many(productTags),
  reviews: many(reviews),
  wishlist: many(wishlist),
}))
// src/lib/db/schema.ts faylının sonuna əlavə edin

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
}))

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
}))
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}))

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}))

export const ordersRelations = relations(orders, ({ many, one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  delivery: one(deliveries),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}))

export const deliveriesRelations = relations(deliveries, ({ one, many }) => ({
  order: one(orders, {
    fields: [deliveries.orderId],
    references: [orders.id],
  }),
  courier: one(users, {
    fields: [deliveries.courierId],
    references: [users.id],
  }),
  tracking: many(deliveryTracking),
}))

// ============================================
// BASKETS
// ============================================

export const basketTypeEnum = pgEnum('basket_type', [
  'gence',
  'gedebey',
  'sheki',
  'lenkaran',
  'ramazan',
  'custom',
])

export const basketVariantEnum = pgEnum('basket_variant', [
  'econom',
  'standard',
  'premium',
])

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
    
    // Origin & Freshness
    origin: varchar('origin', { length: 255 }),
    freshness: varchar('freshness', { length: 255 }),
    
    // Nutrition info
    nutrition: text('nutrition').array(),
    
    // Status flags
    bestseller: boolean('bestseller').default(false),
    trending: boolean('trending').default(false),
    new: boolean('new').default(false),
    lowStock: boolean('low_stock').default(false),
    
    // Stock
    stock: integer('stock').default(0),
    
    // Discount
    discount: integer('discount').default(0),
    
    // Highlights
    highlights: text('highlights').array(),
    
    // Display order
    displayOrder: integer('display_order').default(0),
    isActive: boolean('is_active').default(true),
    archived: boolean('archived').default(false),
    
    // SEO
    metaTitle: varchar('meta_title', { length: 255 }),
    metaDescription: text('meta_description'),
    
    // Analytics
    viewCount: integer('view_count').default(0),
    soldCount: integer('sold_count').default(0),
    averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
    reviewCount: integer('review_count').default(0),
    favoriteCount: integer('favorite_count').default(0),
    
    // Seasonal
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
  })
)

export const basketMedia = pgTable(
  'basket_media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    
    type: varchar('type', { length: 20 }).notNull(), // 'image' or 'video'
    url: text('url').notNull(),
    altText: varchar('alt_text', { length: 255 }),
    displayOrder: integer('display_order').default(0),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basketIdx: index('basket_media_basket_idx').on(table.basketId),
  })
)

export const basketVariants = pgTable(
  'basket_variants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    variant: basketVariantEnum('variant').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    originalPrice: decimal('original_price', { precision: 10, scale: 2 }),
    stock: integer('stock').default(0),
    gift: text('gift'), // 🎁 Hədiyyə məlumatı (məsələn "Bal qabı")
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    basketIdx: index('basket_variants_basket_idx').on(table.basketId),
    uniqueBasketVariant: uniqueIndex('basket_variants_unique').on(table.basketId, table.variant),
  })
)

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
)

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
)

// ============================================
// BASKET RELATIONS
// ============================================

export const basketsRelations = relations(baskets, ({ one, many }) => ({
  category: one(categories, {
    fields: [baskets.categoryId],
    references: [categories.id],
  }),
  media: many(basketMedia),
  variants: many(basketVariants),
  favorites: many(basketFavorites),
  reviews: many(basketReviews),
  products: many(basketProducts),
  analytics: many(basketAnalytics),
}))

export const basketMediaRelations = relations(basketMedia, ({ one }) => ({
  basket: one(baskets, {
    fields: [basketMedia.basketId],
    references: [baskets.id],
  }),
}))

export const basketVariantsRelations = relations(basketVariants, ({ one, many }) => ({
  basket: one(baskets, {
    fields: [basketVariants.basketId],
    references: [baskets.id],
  }),
  contents: many(basketContents),
  extras: many(basketExtras),
}))

export const basketContentsRelations = relations(basketContents, ({ one }) => ({
  basketVariant: one(basketVariants, {
    fields: [basketContents.basketVariantId],
    references: [basketVariants.id],
  }),
}))

export const basketExtrasRelations = relations(basketExtras, ({ one }) => ({
  basketVariant: one(basketVariants, {
    fields: [basketExtras.basketVariantId],
    references: [basketVariants.id],
  }),
}))

// ============================================
// BASKET FAVORITES
// ============================================

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
)

export const basketFavoritesRelations = relations(basketFavorites, ({ one }) => ({
  user: one(users, {
    fields: [basketFavorites.userId],
    references: [users.id],
  }),
  basket: one(baskets, {
    fields: [basketFavorites.basketId],
    references: [baskets.id],
  }),
}))

// ============================================
// BASKET REVIEWS
// ============================================

export const basketReviews = pgTable(
  'basket_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    
    rating: integer('rating').notNull(), // 1-5
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
)

export const basketReviewsRelations = relations(basketReviews, ({ one }) => ({
  basket: one(baskets, {
    fields: [basketReviews.basketId],
    references: [baskets.id],
  }),
  user: one(users, {
    fields: [basketReviews.userId],
    references: [users.id],
  }),
}))

// ============================================
// BASKET PRODUCTS (Composition)
// ============================================

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
)

export const basketProductsRelations = relations(basketProducts, ({ one }) => ({
  basket: one(baskets, {
    fields: [basketProducts.basketId],
    references: [baskets.id],
  }),
  basketVariant: one(basketVariants, {
    fields: [basketProducts.basketVariantId],
    references: [basketVariants.id],
  }),
  product: one(products, {
    fields: [basketProducts.productId],
    references: [products.id],
  }),
  productVariant: one(productVariants, {
    fields: [basketProducts.productVariantId],
    references: [productVariants.id],
  }),
}))

// ============================================
// BASKET ANALYTICS
// ============================================

export const basketAnalytics = pgTable(
  'basket_analytics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    basketId: uuid('basket_id').notNull().references(() => baskets.id, { onDelete: 'cascade' }),
    
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    sessionId: varchar('session_id', { length: 255 }),
    
    eventType: varchar('event_type', { length: 50 }).notNull(), // view, click, add_to_cart, purchase
    metadata: jsonb('metadata'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    basketIdx: index('basket_analytics_basket_idx').on(table.basketId),
    userIdx: index('basket_analytics_user_idx').on(table.userId),
    eventTypeIdx: index('basket_analytics_event_type_idx').on(table.eventType),
    createdAtIdx: index('basket_analytics_created_at_idx').on(table.createdAt),
  })
)

export const basketAnalyticsRelations = relations(basketAnalytics, ({ one }) => ({
  basket: one(baskets, {
    fields: [basketAnalytics.basketId],
    references: [baskets.id],
  }),
  user: one(users, {
    fields: [basketAnalytics.userId],
    references: [users.id],
  }),
}))

// ============================================
// FINANCE
// ============================================

export const accountTypeEnum = pgEnum('account_type', [
  'cash',
  'bank',
  'pos',
  'wallet',
])

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
)

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
)

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
)

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
)

export const financeLedger = pgTable(
  'finance_ledger',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: timestamp('date').notNull(),
    accountId: uuid('account_id').notNull().references(() => financeAccounts.id),
    type: varchar('type', { length: 10 }).notNull(), // 'in' or 'out'
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    refKind: varchar('ref_kind', { length: 50 }), // 'expense', 'purchase', 'payment', 'arpayment', 'order'
    refId: uuid('ref_id'),
    memo: text('memo'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    accountIdx: index('finance_ledger_account_idx').on(table.accountId),
    dateIdx: index('finance_ledger_date_idx').on(table.date),
    refIdx: index('finance_ledger_ref_idx').on(table.refKind, table.refId),
  })
)

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
)

// ============================================
// FINANCE RELATIONS
// ============================================

export const financeSuppliersRelations = relations(financeSuppliers, ({ many }) => ({
  purchases: many(financePurchases),
  payments: many(financePayments),
}))

export const financeAccountsRelations = relations(financeAccounts, ({ many }) => ({
  purchases: many(financePurchases),
  payments: many(financePayments),
  ledger: many(financeLedger),
}))

export const financePurchasesRelations = relations(financePurchases, ({ one }) => ({
  supplier: one(financeSuppliers, {
    fields: [financePurchases.supplierId],
    references: [financeSuppliers.id],
  }),
  account: one(financeAccounts, {
    fields: [financePurchases.accountId],
    references: [financeAccounts.id],
  }),
}))

export const financePaymentsRelations = relations(financePayments, ({ one }) => ({
  supplier: one(financeSuppliers, {
    fields: [financePayments.supplierId],
    references: [financeSuppliers.id],
  }),
  account: one(financeAccounts, {
    fields: [financePayments.accountId],
    references: [financeAccounts.id],
  }),
}))

// ============================================
// ABOUT US PAGE
// ============================================

export const aboutUsSections = pgTable(
  'about_us_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    subtitle: varchar('subtitle', { length: 500 }),
    description: text('description').notNull(),
    
    // Media
    imageUrl: text('image_url'),
    videoUrl: text('video_url'),
    
    // Display
    displayOrder: integer('display_order').default(0),
    isActive: boolean('is_active').default(true),
    
    // Section type: hero, story, values, regions, team, cta
    sectionType: varchar('section_type', { length: 50 }).notNull(),
    
    // Additional data (JSON for flexible content)
    metadata: jsonb('metadata'),
    
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    displayOrderIdx: index('about_us_sections_display_order_idx').on(table.displayOrder),
    sectionTypeIdx: index('about_us_sections_section_type_idx').on(table.sectionType),
    activeIdx: index('about_us_sections_active_idx').on(table.isActive),
  })
)

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
)

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
)

// ============================================
// ABOUT US RELATIONS
// ============================================

export const aboutUsSectionsRelations = relations(aboutUsSections, () => ({
  // Add relations if needed in the future
}))

export const aboutUsRegionsRelations = relations(aboutUsRegions, () => ({
  // Add relations if needed in the future
}))

export const aboutUsStatsRelations = relations(aboutUsStats, () => ({
  // Add relations if needed in the future
}))

export const wishlistRelations = relations(wishlist, ({ one }) => ({
  user: one(users, {
    fields: [wishlist.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlist.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [wishlist.variantId],
    references: [productVariants.id],
  }),
}))

