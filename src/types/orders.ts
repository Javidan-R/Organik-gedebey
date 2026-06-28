// =====================================================================
// ORDER TYPES - Match Database Schema
// =====================================================================

import { ID } from "./products";

// --- Database Enum Types (Uppercase to match DB) ---
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_DELIVERY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus = "UNPAID" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED";

export type PaymentMethod = "CASH_ON_DELIVERY" | "CARD" | "BANK_TRANSFER";

export type DeliveryStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "FAILED"
  | "RETURNED";

// --- Frontend Display Types (Lowercase for UI) ---
export type OrderStatusDisplay =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refunded";

export type PaymentMethodDisplay = "cash" | "card" | "mixed";

// --- Order Item ---
export type OrderItem = {
  id: ID;
  productId: ID;
  variantId: ID | null;
  productName: string;
  variantName: string | null;
  qty: number;
  unit: string | null;
  priceAtOrder: string; // Decimal in DB as string
  costAtOrder: string | null;
  subtotal: string; // Decimal in DB as string
  createdAt: string;
};

// --- Order (matches database schema) ---
export type Order = {
  id: ID;
  address: string | null; // Additional address field for compatibility
  orderNumber: string;
  userId: ID | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryAddressId: ID | null;
  deliveryAddressText: string;
  subtotal: string; // Decimal in DB as string
  discountAmount: string; // Decimal in DB as string
  deliveryFee: string; // Decimal in DB as string
  total: string; // Decimal in DB as string
  couponCode: string | null;
  couponDiscount: string; // Decimal in DB as string
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  courierId: ID | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  cancellationReason: string | null;
  rating: number | null; // 1-5 rating for delivered orders
  // Timeline timestamps
  confirmedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  items: OrderItem[];
  note: string | null;
  user?: {
    id: ID;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  delivery?: {
    id: ID;
    courierId: ID | null;
    status: DeliveryStatus;
  } | null;
};

// --- Order with computed fields for frontend ---
export type OrderWithTotal = OrderFull & {
  itemCount: number; // Computed from items length
};

// --- OrderFull: Frontend-friendly order with display types ---
// This is the main type used in frontend components
export type OrderFull = {
  // All Order fields but with display types
  id: ID;
  orderNumber: string;
  userId: ID | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryAddressId: ID | null;
  deliveryAddressText: string;
  subtotal: number; // Converted to number
  discountAmount: number; // Converted to number
  deliveryFee: number; // Converted to number
  total: number; // Converted to number
  couponCode: string | null;
  couponDiscount: number; // Converted to number
  status: OrderStatusDisplay; // Display type (lowercase)
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodDisplay; // Display type
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  courierId: ID | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  cancellationReason: string | null;
  rating: number | null; // 1-5 rating for delivered orders
  // Timeline timestamps
  confirmedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  items: OrderItem[];
  user?: {
    id: ID;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  delivery?: {
    id: ID;
    courierId: ID | null;
    status: DeliveryStatus;
  } | null;
  // Computed fields
  itemCount: number;
  // Payment breakdown for mixed payments
  cashAmount: number;
  cardAmount: number;
  note?: string;
  address?: string;
};

// --- Sorting & Filtering ---
export type SortKey = "createdAt" | "total" | "itemCount";
export type SortDirection = "asc" | "desc";

export type ColumnVisibility = {
  id: boolean;
  customer: boolean;
  itemCount: boolean;
  total: boolean;
  status: boolean;
  date: boolean;
  actions: boolean;
};

// --- API Response Types ---
export type OrdersResponse = {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
