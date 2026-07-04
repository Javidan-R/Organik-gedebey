// src/lib/utils/order-utils.ts
import { Order, OrderFull, OrderStatusDisplay, PaymentMethodDisplay, OrderItem } from '@/types/orders';
import { ID } from '@/types/products';

// ════════════════════════════════════════════════════════════════════════════
// STATUS MAPPING
// ════════════════════════════════════════════════════════════════════════════

/**
 * Convert database order status to frontend display status
 */
export function toDisplayStatus(status: string): OrderStatusDisplay {
  const map: Record<string, OrderStatusDisplay> = {
    'PENDING': 'pending',
    'CONFIRMED': 'confirmed',
    'PREPARING': 'preparing',
    'READY_FOR_DELIVERY': 'ready_for_delivery',
    'OUT_FOR_DELIVERY': 'out_for_delivery',
    'DELIVERED': 'delivered',
    'CANCELLED': 'cancelled',
    'REFUNDED': 'refunded',
  };
  return map[status] || 'pending';
}

/**
 * Convert frontend display status to database status
 */
export function fromDisplayStatus(display: OrderStatusDisplay): string {
  const map: Record<OrderStatusDisplay, string> = {
    'pending': 'PENDING',
    'confirmed': 'CONFIRMED',
    'preparing': 'PREPARING',
    'ready_for_delivery': 'READY_FOR_DELIVERY',
    'out_for_delivery': 'OUT_FOR_DELIVERY',
    'delivered': 'DELIVERED',
    'cancelled': 'CANCELLED',
    'refunded': 'REFUNDED',
  };
  return map[display] || 'PENDING';
}

/**
 * Convert payment method to display format
 */
export function toDisplayPaymentMethod(method: string | null): PaymentMethodDisplay {
  if (!method) return 'cash';
  const map: Record<string, PaymentMethodDisplay> = {
    'CASH_ON_DELIVERY': 'cash',
    'CARD': 'card',
    'BANK_TRANSFER': 'cash',
  };
  return map[method] || 'cash';
}

/**
 * Convert payment method from display to database
 */
export function fromDisplayPaymentMethod(display: PaymentMethodDisplay): string {
  const map: Record<PaymentMethodDisplay, string> = {
    'cash': 'CASH_ON_DELIVERY',
    'card': 'CARD',
    'mixed': 'CASH_ON_DELIVERY',
  };
  return map[display] || 'CASH_ON_DELIVERY';
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS TRANSITIONS
// ════════════════════════════════════════════════════════════════════════════

export const STATUS_TRANSITIONS: Record<OrderStatusDisplay, OrderStatusDisplay[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['preparing', 'cancelled'],
  'preparing': ['ready_for_delivery', 'cancelled'],
  'ready_for_delivery': ['out_for_delivery', 'cancelled'],
  'out_for_delivery': ['delivered', 'cancelled'],
  'delivered': ['refunded'],
  'cancelled': [],
  'refunded': [],
};

export const STATUS_TIMESTAMPS: Record<OrderStatusDisplay, string> = {
  'pending': 'createdAt',
  'confirmed': 'confirmedAt',
  'preparing': 'preparingAt',
  'ready_for_delivery': 'readyAt',
  'out_for_delivery': 'outForDeliveryAt',
  'delivered': 'deliveredAt',
  'cancelled': 'cancelledAt',
  'refunded': 'cancelledAt',
};

// ════════════════════════════════════════════════════════════════════════════
// ORDER TRANSFORMER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Transform a database order to frontend OrderFull format
 * ✅ FIX: Uses toDisplayStatus instead of fromDisplayStatus
 */
export function transformOrderForFrontend(order: any): OrderFull {
  // If order is null or undefined, return a default empty order
  if (!order) {
    return createEmptyOrder();
  }

  // Normalize items
  const items = order.items || [];
  const itemCount = items.length;

  // Calculate cash and card amounts based on payment method
  let cashAmount = 0;
  let cardAmount = 0;
  const total = parseFloat(order.total || '0');

  const paymentMethod = order.paymentMethod;
  if (paymentMethod === 'CASH_ON_DELIVERY') {
    cashAmount = total;
  } else if (paymentMethod === 'CARD') {
    cardAmount = total;
  } else {
    // Mixed or unknown: split equally
    cashAmount = total * 0.5;
    cardAmount = total * 0.5;
  }

  // ✅ FIX: Convert DB status to display status using toDisplayStatus
  const displayStatus = toDisplayStatus(order.status || 'PENDING');

  return {
    id: order.id,
    orderNumber: order.orderNumber || `ORD-${order.id?.slice(0, 8)}`,
    userId: order.userId || null,
    customerName: order.customerName || 'Qonaq İstifadəçi',
    customerEmail: order.customerEmail || null,
    customerPhone: order.customerPhone || '',
    deliveryAddressId: order.deliveryAddressId || null,
    deliveryAddressText: order.deliveryAddressText || order.address || '',
    subtotal: parseFloat(order.subtotal || '0'),
    discountAmount: parseFloat(order.discountAmount || '0'),
    deliveryFee: parseFloat(order.deliveryFee || '0'),
    total: parseFloat(order.total || '0'),
    couponCode: order.couponCode || null,
    couponDiscount: parseFloat(order.couponDiscount || '0'),
    status: displayStatus,
    paymentStatus: order.paymentStatus || 'UNPAID',
    paymentMethod: toDisplayPaymentMethod(order.paymentMethod),
    deliveryDate: order.deliveryDate || null,
    deliveryTimeSlot: order.deliveryTimeSlot || null,
    courierId: order.courierId || null,
    trackingNumber: order.trackingNumber || null,
    estimatedDelivery: order.estimatedDelivery || null,
    actualDelivery: order.actualDelivery || null,
    customerNotes: order.customerNotes || null,
    adminNotes: order.adminNotes || null,
    cancellationReason: order.cancellationReason || null,
    rating: order.rating || null,
    confirmedAt: order.confirmedAt || null,
    preparingAt: order.preparingAt || null,
    readyAt: order.readyAt || null,
    outForDeliveryAt: order.outForDeliveryAt || null,
    deliveredAt: order.deliveredAt || null,
    cancelledAt: order.cancelledAt || null,
    createdAt: order.createdAt || new Date().toISOString(),
    updatedAt: order.updatedAt || new Date().toISOString(),
    items: items.map((item: any): OrderItem => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName || 'Məhsul',
      variantName: item.variantName || null,
      qty: item.qty || 1,
      unit: item.unit || null,
      priceAtOrder: item.priceAtOrder || '0',
      costAtOrder: item.costAtOrder || null,
      subtotal: item.subtotal || '0',
      createdAt: item.createdAt || new Date().toISOString(),
    })),
    user: order.user ? {
      id: order.user.id,
      firstName: order.user.firstName || '',
      lastName: order.user.lastName || '',
      email: order.user.email || '',
      phone: order.user.phone || null,
    } : null,
    delivery: order.delivery || null,
    itemCount,
    cashAmount,
    cardAmount,
    note: order.customerNotes || null,
    address: order.address || order.deliveryAddressText || '',
  };
}

/**
 * Create an empty order for fallback
 */
function createEmptyOrder(): OrderFull {
  return {
    id: '',
    orderNumber: '',
    userId: null,
    customerName: '',
    customerEmail: null,
    customerPhone: '',
    deliveryAddressId: null,
    deliveryAddressText: '',
    subtotal: 0,
    discountAmount: 0,
    deliveryFee: 0,
    total: 0,
    couponCode: null,
    couponDiscount: 0,
    status: 'pending',
    paymentStatus: 'UNPAID',
    paymentMethod: 'cash',
    deliveryDate: null,
    deliveryTimeSlot: null,
    courierId: null,
    trackingNumber: null,
    estimatedDelivery: null,
    actualDelivery: null,
    customerNotes: null,
    adminNotes: null,
    cancellationReason: null,
    rating: null,
    confirmedAt: null,
    preparingAt: null,
    readyAt: null,
    outForDeliveryAt: null,
    deliveredAt: null,
    cancelledAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
    user: null,
    delivery: null,
    itemCount: 0,
    cashAmount: 0,
    cardAmount: 0,
    note: null,
    address: '',
  };
}

/**
 * Transform multiple orders to frontend format
 */
export function transformOrdersForFrontend(orders: any[]): OrderFull[] {
  if (!orders || !Array.isArray(orders)) return [];
  return orders.map((order) => transformOrderForFrontend(order));
}

// ════════════════════════════════════════════════════════════════════════════
// ORDER VALIDATION
// ════════════════════════════════════════════════════════════════════════════

/**
 * Validate if a status transition is allowed
 */
export function isStatusTransitionAllowed(
  currentStatus: OrderStatusDisplay,
  newStatus: OrderStatusDisplay
): boolean {
  const allowed = STATUS_TRANSITIONS[currentStatus] || [];
  return allowed.includes(newStatus);
}

/**
 * Get the timestamp field for a status
 */
export function getStatusTimestampField(status: OrderStatusDisplay): string {
  return STATUS_TIMESTAMPS[status] || 'updatedAt';
}

/**
 * Check if an order is cancellable
 */
export function isOrderCancellable(status: OrderStatusDisplay): boolean {
  return ['pending', 'confirmed', 'preparing'].includes(status);
}

/**
 * Check if an order is editable
 */
export function isOrderEditable(status: OrderStatusDisplay): boolean {
  return ['pending', 'confirmed'].includes(status);
}

// ════════════════════════════════════════════════════════════════════════════
// ORDER CALCULATIONS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Calculate order totals from items
 */
export function calculateOrderTotals(items: { priceAtOrder: string; qty: number }[]) {
  const subtotal = items.reduce((sum, item) => {
    return sum + (parseFloat(item.priceAtOrder) * item.qty);
  }, 0);

  return {
    subtotal,
    total: subtotal,
  };
}

/**
 * Get order summary for display
 */
export function getOrderSummary(order: OrderFull) {
  return {
    orderNumber: order.orderNumber,
    customer: order.customerName,
    total: order.total.toFixed(2),
    status: order.status,
    itemCount: order.itemCount,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString('az-AZ') : '',
    statusLabel: getStatusLabel(order.status),
  };
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: OrderStatusDisplay): string {
  const labels: Record<OrderStatusDisplay, string> = {
    'pending': 'Gözləyir',
    'confirmed': 'Təsdiqləndi',
    'preparing': 'Hazırlanır',
    'ready_for_delivery': 'Çatdırılmağa hazır',
    'out_for_delivery': 'Yolda',
    'delivered': 'Çatdırıldı',
    'cancelled': 'Ləğv edildi',
    'refunded': 'Geri qaytarıldı',
  };
  return labels[status] || status;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: OrderStatusDisplay): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<OrderStatusDisplay, { bg: string; text: string; border: string }> = {
    'pending': { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
    'confirmed': { bg: '#dbeafe', text: '#2563eb', border: '#3b82f6' },
    'preparing': { bg: '#ede9fe', text: '#7c3aed', border: '#8b5cf6' },
    'ready_for_delivery': { bg: '#e0e7ff', text: '#4338ca', border: '#6366f1' },
    'out_for_delivery': { bg: '#ffedd5', text: '#ea580c', border: '#f97316' },
    'delivered': { bg: '#d1fae5', text: '#059669', border: '#10b981' },
    'cancelled': { bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
    'refunded': { bg: '#f1f5f9', text: '#64748b', border: '#94a3b8' },
  };
  return colors[status] || colors['pending'];
}