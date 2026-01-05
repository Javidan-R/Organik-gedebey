// =====================================================================
// TYPES
// =====================================================================

import { ID } from "./products";

// --- Order ---
export type OrderItem = {
    productId: ID;
    variantId: ID;
    qty: number;
    priceAtOrder: number;
    costAtOrder?: number;
    productName?: string;
    variantName?: string

};

export type OrderStatus = "pending" | "delivered" | "cancelled";
export type PaymentMethod = "cash" | "card" | "mixed";

export type OrderWithPayment = {
  paymentMethod: PaymentMethod;
  cashAmount: number;
  cardAmount: number;
  note?: string;
  address?: string;
  customerPhone?: string;
};
export type OrderFull = OrderWithTotal & OrderWithPayment;

export type Order = {
    cashAmount: number;
    cardAmount: number;
    note: string;
    address: string;
    customerPhone: string;    
    paymentMethod?: "cash" | "card" | "mixed"
    total: number;
    id: ID;
    createdAt: string;
    channel: 'system' | 'whatsapp'
    items: OrderItem[];
    status: OrderStatus;
    customerName?: string;
    // ƏLAVƏ: Çatdırılma ünvanı, kupon, sifarişin yekun dəyəri
    shippingAddress?: string;
    couponApplied?: string;
    totalAmount: number;
    vatAmount: number;
};

export type OrderWithTotal = Order & { total: number; itemCount: number };
export type SortKey = 'createdAt' | 'total' | 'itemCount';
export type SortDirection = 'asc' | 'desc';

export type ColumnVisibility = {
  id: boolean;
  customer: boolean;
  itemCount: boolean;
  total: boolean;
  status: boolean;
  date: boolean;
  actions: boolean;
};
