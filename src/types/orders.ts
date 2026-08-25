// src/types/orders.ts

import { ID } from "./products";
import type { PickupSlot, PickupStatus } from "./pickup";

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
  priceAtOrder: string;
  costAtOrder: string | null;
  subtotal: string;
  createdAt: string;
};

// ─── PICKUP SAHƏLƏRİ ───
export interface OrderPickupInfo {
  pickupDate: string | null;
  pickupTime: string | null;
  pickupTimeSlot: string | null;
  pickupSlotId: ID | null;
  estimatedReadyAt: string | null;
  pickupStatus: PickupStatus | null;
  pickupSlot?: PickupSlot | null;
}

// ─── ORDER (database schema ilə uyğun) ───
export type Order = {
  id: ID;
  address: string | null;
  orderNumber: string;
  userId: ID | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryAddressId: ID | null;
  deliveryAddressText: string;
  subtotal: string;
  discountAmount: string;
  deliveryFee: string;
  total: string;
  couponCode: string | null;
  couponDiscount: string;
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
  rating: number | null;
  confirmedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // ─── PICKUP ───
  pickupDate: string | null;
  pickupTime: string | null;
  pickupTimeSlot: string | null;
  pickupSlotId: ID | null;
  estimatedReadyAt: string | null;
  pickupStatus: PickupStatus | null;
  // ─── Relations ───
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
  pickupSlot?: PickupSlot | null;
};

// ─── ORDER WITH COMPUTED FIELDS ───
export type OrderWithTotal = Order & {
  itemCount: number;
};

// ─── ORDER FULL (frontend üçün) ───
export type OrderFull = {
  id: ID;
  orderNumber: string;
  userId: ID | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  deliveryAddressId: ID | null;
  deliveryAddressText: string;
  subtotal: string;
  discountAmount: string;
  deliveryFee: string;
  total: string;
  couponCode: string | null;
  couponDiscount: string;
  status: OrderStatusDisplay;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethodDisplay;
  deliveryDate: string | null;
  deliveryTimeSlot: string | null;
  courierId: ID | null;
  trackingNumber: string | null;
  estimatedDelivery: string | null;
  actualDelivery: string | null;
  customerNotes: string | null;
  adminNotes: string | null;
  cancellationReason: string | null;
  rating: number | null;
  confirmedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  // ─── PICKUP ───
  pickupDate: string | null;
  pickupTime: string | null;
  pickupTimeSlot: string | null;
  pickupSlotId: ID | null;
  estimatedReadyAt: string | null;
  pickupStatus: PickupStatus | null;
  // ─── Relations ───
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
  pickupSlot?: PickupSlot | null;
  // ─── Computed ───
  itemCount: number;
  cashAmount: number;
  cardAmount: number;
  note?: string;
  address: string | null;
};

// ─── Sorting & Filtering ───
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
  pickup: boolean;
};

// ─── API Response ───
export type OrdersResponse = {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};