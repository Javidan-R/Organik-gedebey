// lib/db/types.ts
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm'
import * as schema from './schema'

// SELECT types (database-dən oxumaq)
export type User = InferSelectModel<typeof schema.users>
export type Product = InferSelectModel<typeof schema.products>
export type Order = InferSelectModel<typeof schema.orders>
export type OrderItem = InferSelectModel<typeof schema.orderItems>
export type ProductVariant = InferSelectModel<typeof schema.productVariants>
export type Category = InferSelectModel<typeof schema.categories>
export type Address = InferSelectModel<typeof schema.addresses>
export type Delivery = InferSelectModel<typeof schema.deliveries>
export type Review = InferSelectModel<typeof schema.reviews>
export type Coupon = InferSelectModel<typeof schema.coupons>
export type Notification = InferSelectModel<typeof schema.notifications>

// INSERT types (database-ə yazmaq)
export type NewUser = InferInsertModel<typeof schema.users>
export type NewProduct = InferInsertModel<typeof schema.products>
export type NewOrder = InferInsertModel<typeof schema.orders>
export type NewOrderItem = InferInsertModel<typeof schema.orderItems>

// Custom types with relations
export type ProductWithDetails = Product & {
  category: Category | null
  images: ProductImage[]
  variants: ProductVariant[]
  reviews: Review[]
}

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product | null
    variant: ProductVariant | null
  })[]
  user: User | null
}