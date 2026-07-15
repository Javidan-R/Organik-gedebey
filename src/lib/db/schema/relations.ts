// src/lib/db/schema/relations.ts
import { relations } from 'drizzle-orm';
import {
  users,
  addresses,
  categories,
  products,
  productImages,
  productVariants,
  productTags,
  reviews,
  orders,
  orderItems,
  deliveries,
  deliveryTracking,
  baskets,
  basketMedia,
  basketVariants,
  basketContents,
  basketExtras,
  basketFavorites,
  basketReviews,
  basketProducts,
  basketAnalytics,
  coupons,
  couponUsage,
  notifications,
  whatsappMessages,
  inventoryLogs,
  expenses,
  financeSuppliers,
  financeAccounts,
  financePurchases,
  financePayments,
  financeLedger,
  financeBatches,
  aboutUsSections,
  aboutUsRegions,
  aboutUsStats,
  settings,
  wishlist,
} from '../schema';

// ═══════════════════════════════════════════════════════════════
// 1. USERS & ADDRESSES
// ═══════════════════════════════════════════════════════════════
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
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 2. CATEGORIES
// ═══════════════════════════════════════════════════════════════
export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  baskets: many(baskets),
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
  }),
  children: many(categories),
}));

// ═══════════════════════════════════════════════════════════════
// 3. PRODUCTS & RELATED (🛑 ƏN VACİB HİSSƏ)
// ═══════════════════════════════════════════════════════════════
export const productsRelations = relations(products, ({ many, one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
  variants: many(productVariants), // ✅ Bu relation store-da variants-ı doldurur
  tags: many(productTags),
  reviews: many(reviews),
  wishlist: many(wishlist),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const productTagsRelations = relations(productTags, ({ one }) => ({
  product: one(products, {
    fields: [productTags.productId],
    references: [products.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 4. REVIEWS
// ═══════════════════════════════════════════════════════════════
export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 5. ORDERS & ORDER ITEMS
// ═══════════════════════════════════════════════════════════════
export const ordersRelations = relations(orders, ({ many, one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  delivery: one(deliveries),
}));

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
  basket: one(baskets, {
    fields: [orderItems.basketId],
    references: [baskets.id],
  }),
  basketVariant: one(basketVariants, {
    fields: [orderItems.basketVariantId],
    references: [basketVariants.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 6. DELIVERIES & TRACKING
// ═══════════════════════════════════════════════════════════════
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
}));

export const deliveryTrackingRelations = relations(deliveryTracking, ({ one }) => ({
  delivery: one(deliveries, {
    fields: [deliveryTracking.deliveryId],
    references: [deliveries.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 7. BASKETS & RELATED
// ═══════════════════════════════════════════════════════════════
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
}));

export const basketMediaRelations = relations(basketMedia, ({ one }) => ({
  basket: one(baskets, {
    fields: [basketMedia.basketId],
    references: [baskets.id],
  }),
}));

export const basketVariantsRelations = relations(basketVariants, ({ one, many }) => ({
  basket: one(baskets, {
    fields: [basketVariants.basketId],
    references: [baskets.id],
  }),
  contents: many(basketContents),
  extras: many(basketExtras),
}));

export const basketContentsRelations = relations(basketContents, ({ one }) => ({
  basketVariant: one(basketVariants, {
    fields: [basketContents.basketVariantId],
    references: [basketVariants.id],
  }),
}));

export const basketExtrasRelations = relations(basketExtras, ({ one }) => ({
  basketVariant: one(basketVariants, {
    fields: [basketExtras.basketVariantId],
    references: [basketVariants.id],
  }),
}));

export const basketFavoritesRelations = relations(basketFavorites, ({ one }) => ({
  user: one(users, {
    fields: [basketFavorites.userId],
    references: [users.id],
  }),
  basket: one(baskets, {
    fields: [basketFavorites.basketId],
    references: [baskets.id],
  }),
}));

export const basketReviewsRelations = relations(basketReviews, ({ one }) => ({
  basket: one(baskets, {
    fields: [basketReviews.basketId],
    references: [baskets.id],
  }),
  user: one(users, {
    fields: [basketReviews.userId],
    references: [users.id],
  }),
}));

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
}));

export const basketAnalyticsRelations = relations(basketAnalytics, ({ one }) => ({
  basket: one(baskets, {
    fields: [basketAnalytics.basketId],
    references: [baskets.id],
  }),
  user: one(users, {
    fields: [basketAnalytics.userId],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 8. COUPONS & USAGE
// ═══════════════════════════════════════════════════════════════
export const couponsRelations = relations(coupons, ({ many }) => ({
  usage: many(couponUsage),
}));

export const couponUsageRelations = relations(couponUsage, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsage.couponId],
    references: [coupons.id],
  }),
  user: one(users, {
    fields: [couponUsage.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [couponUsage.orderId],
    references: [orders.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 9. NOTIFICATIONS & WHATSAPP
// ═══════════════════════════════════════════════════════════════
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const whatsappMessagesRelations = relations(whatsappMessages, ({ one }) => ({
  user: one(users, {
    fields: [whatsappMessages.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [whatsappMessages.orderId],
    references: [orders.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 10. INVENTORY & EXPENSES
// ═══════════════════════════════════════════════════════════════
// src/lib/db/schema/relations.ts (mövcud fayla bu relation əlavə olunsun)
export const inventoryLogsRelations = relations(inventoryLogs, ({ one }) => ({
  product: one(products, {
    fields: [inventoryLogs.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [inventoryLogs.variantId],
    references: [productVariants.id],
  }),
  createdBy: one(users, {             // ✅ bu relation əlavə olunmalıdır
    fields: [inventoryLogs.createdBy],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  createdBy: one(users, {
    fields: [expenses.createdBy],
    references: [users.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 11. FINANCE
// ═══════════════════════════════════════════════════════════════
export const financeSuppliersRelations = relations(financeSuppliers, ({ many }) => ({
  purchases: many(financePurchases),
  payments: many(financePayments),
}));

export const financeAccountsRelations = relations(financeAccounts, ({ many }) => ({
  purchases: many(financePurchases),
  payments: many(financePayments),
  ledger: many(financeLedger),
}));

export const financePurchasesRelations = relations(financePurchases, ({ one }) => ({
  supplier: one(financeSuppliers, {
    fields: [financePurchases.supplierId],
    references: [financeSuppliers.id],
  }),
  account: one(financeAccounts, {
    fields: [financePurchases.accountId],
    references: [financeAccounts.id],
  }),
  product: one(products, {
    fields: [financePurchases.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [financePurchases.variantId],
    references: [productVariants.id],
  }),
}));

export const financePaymentsRelations = relations(financePayments, ({ one }) => ({
  supplier: one(financeSuppliers, {
    fields: [financePayments.supplierId],
    references: [financeSuppliers.id],
  }),
  account: one(financeAccounts, {
    fields: [financePayments.accountId],
    references: [financeAccounts.id],
  }),
}));

export const financeLedgerRelations = relations(financeLedger, ({ one }) => ({
  account: one(financeAccounts, {
    fields: [financeLedger.accountId],
    references: [financeAccounts.id],
  }),
}));

export const financeBatchesRelations = relations(financeBatches, ({ one }) => ({
  product: one(products, {
    fields: [financeBatches.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [financeBatches.variantId],
    references: [productVariants.id],
  }),
}));

// ═══════════════════════════════════════════════════════════════
// 12. ABOUT US (single tables, no relations)
// ═══════════════════════════════════════════════════════════════
export const aboutUsSectionsRelations = relations(aboutUsSections, () => ({}));
export const aboutUsRegionsRelations = relations(aboutUsRegions, () => ({}));
export const aboutUsStatsRelations = relations(aboutUsStats, () => ({}));

// ═══════════════════════════════════════════════════════════════
// 13. WISHLIST
// ═══════════════════════════════════════════════════════════════
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
}));


