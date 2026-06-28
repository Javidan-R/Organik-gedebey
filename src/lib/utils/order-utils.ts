// =====================================================================
// ORDER UTILITY FUNCTIONS
// =====================================================================

import type {
  OrderStatus,
  OrderStatusDisplay,
  PaymentMethod,
  PaymentMethodDisplay,
} from "@/types/orders";

// ============================================
// STATUS CONVERSION UTILITIES
// ============================================

// Convert DB uppercase status to frontend lowercase display
export function toDisplayStatus(status: OrderStatus): OrderStatusDisplay {
  const statusMap: Record<OrderStatus, OrderStatusDisplay> = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    PREPARING: "preparing",
    READY_FOR_DELIVERY: "ready_for_delivery",
    OUT_FOR_DELIVERY: "out_for_delivery",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
  };
  return statusMap[status] || "pending";
}

// Convert frontend lowercase display to DB uppercase status
export function fromDisplayStatus(status: OrderStatusDisplay): OrderStatus {
  const statusMap: Record<OrderStatusDisplay, OrderStatus> = {
    pending: "PENDING",
    confirmed: "CONFIRMED",
    preparing: "PREPARING",
    ready_for_delivery: "READY_FOR_DELIVERY",
    out_for_delivery: "OUT_FOR_DELIVERY",
    delivered: "DELIVERED",
    cancelled: "CANCELLED",
    refunded: "REFUNDED",
  };
  return statusMap[status] || "PENDING";
}

// Get status text in Azerbaijani
export function getStatusText(status: OrderStatus | string): string {
  const statusTexts: Record<string, string> = {
    PENDING: "Gözləmədə",
    CONFIRMED: "Təsdiqləndi",
    PREPARING: "Hazırlanır",
    READY_FOR_DELIVERY: "Çatdırılmağa hazır",
    OUT_FOR_DELIVERY: "Yolda",
    DELIVERED: "Çatdırıldı",
    CANCELLED: "Ləğv edildi",
    REFUNDED: "Geri qaytarıldı",
  };
  return statusTexts[status] || status;
}

// ============================================
// PAYMENT METHOD CONVERSION UTILITIES
// ============================================

// Convert DB payment method to frontend display
export function toDisplayPaymentMethod(
  method: PaymentMethod | null
): PaymentMethodDisplay {
  if (!method) return "cash";
  const methodMap: Record<PaymentMethod, PaymentMethodDisplay> = {
    CASH_ON_DELIVERY: "cash",
    CARD: "card",
    BANK_TRANSFER: "card", // Treat bank transfer as card for display
  };
  return methodMap[method] || "cash";
}

// Convert frontend display to DB payment method
export function fromDisplayPaymentMethod(
  method: PaymentMethodDisplay
): PaymentMethod {
  const methodMap: Record<PaymentMethodDisplay, PaymentMethod> = {
    cash: "CASH_ON_DELIVERY",
    card: "CARD",
    mixed: "CASH_ON_DELIVERY", // Mixed payments handled separately
  };
  return methodMap[method] || "CASH_ON_DELIVERY";
}

// Normalize payment method from any source
export function normalizePaymentMethod(
  method: any
): PaymentMethodDisplay {
  if (method === "cash" || method === "CASH_ON_DELIVERY") return "cash";
  if (method === "card" || method === "CARD" || method === "BANK_TRANSFER") return "card";
  if (method === "mixed") return "mixed";
  return "cash"; // fallback
}

// ============================================
// ORDER TRANSFORMATION UTILITIES
// ============================================

// Transform order from DB to frontend format
export function transformOrderForFrontend(order: any): any {
  return {
    ...order,
    status: toDisplayStatus(order.status),
    total: parseFloat(order.total || "0"),
    itemCount: order.items?.length || 0,
    paymentMethod: toDisplayPaymentMethod(order.paymentMethod),
    // Add computed fields for mixed payments if needed
    cashAmount: order.paymentMethod === "CASH_ON_DELIVERY" ? parseFloat(order.total || "0") : 0,
    cardAmount: order.paymentMethod === "CARD" ? parseFloat(order.total || "0") : 0,
    note: order.customerNotes || order.adminNotes || "",
    address: order.deliveryAddressText || "",
    customerPhone: order.customerPhone || "",
  };
}

// Transform order from frontend to DB format
export function transformOrderForBackend(order: any): any {
  const { cashAmount, cardAmount, note, address, ...rest } = order;
  return {
    ...rest,
    status: fromDisplayStatus(order.status),
    paymentMethod: fromDisplayPaymentMethod(order.paymentMethod),
    customerNotes: note || order.customerNotes,
    deliveryAddressText: address || order.deliveryAddressText,
  };
}

// ============================================
// VALIDATION UTILITIES
// ============================================

// Check if status transition is valid
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_DELIVERY: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], // Final state
  CANCELLED: [], // Final state
  REFUNDED: [], // Final state
};

export function isValidStatusTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  const allowed = STATUS_TRANSITIONS[from] || [];
  return allowed.includes(to);
}
