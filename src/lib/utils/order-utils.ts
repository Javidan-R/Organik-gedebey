// src/lib/utils/order-utils.ts
import {
  OrderFull,
  OrderStatusDisplay,
  PaymentMethodDisplay,
  OrderItem,
} from '@/types/orders';

// ════════════════════════════════════════════════════════════════════════════
// STATUS MAPPING
// ════════════════════════════════════════════════════════════════════════════

export function toDisplayStatus(status: string): OrderStatusDisplay {
  const map: Record<string, OrderStatusDisplay> = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PREPARING: 'preparing',
    READY_FOR_DELIVERY: 'ready_for_delivery',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
  };
  return map[status] || 'pending';
}

export function fromDisplayStatus(display: OrderStatusDisplay | string): string {
  const map: Record<string, string> = {
    pending: 'PENDING',
    confirmed: 'CONFIRMED',
    preparing: 'PREPARING',
    ready_for_delivery: 'READY_FOR_DELIVERY',
    out_for_delivery: 'OUT_FOR_DELIVERY',
    delivered: 'DELIVERED',
    cancelled: 'CANCELLED',
    refunded: 'REFUNDED',
  };
  return map[display] || 'PENDING';
}

export function toDisplayPaymentMethod(method: string | null): PaymentMethodDisplay {
  if (!method) return 'cash';
  const map: Record<string, PaymentMethodDisplay> = {
    CASH_ON_DELIVERY: 'cash',
    CARD: 'card',
    BANK_TRANSFER: 'cash',
  };
  return map[method] || 'cash';
}

export function fromDisplayPaymentMethod(display: PaymentMethodDisplay): string {
  const map: Record<PaymentMethodDisplay, string> = {
    cash: 'CASH_ON_DELIVERY',
    card: 'CARD',
    mixed: 'CASH_ON_DELIVERY',
  };
  return map[display] || 'CASH_ON_DELIVERY';
}

// ════════════════════════════════════════════════════════════════════════════
// STATUS TRANSITIONS
// ════════════════════════════════════════════════════════════════════════════

export function isStatusTransitionAllowed(
  currentStatus: OrderStatusDisplay,
  newStatus: OrderStatusDisplay
): boolean {
  const transitions: Record<OrderStatusDisplay, OrderStatusDisplay[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['preparing', 'cancelled'],
    preparing: ['ready_for_delivery', 'cancelled'],
    ready_for_delivery: ['out_for_delivery', 'cancelled'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: [],
  };

  const allowed = transitions[currentStatus] || [];
  return allowed.includes(newStatus);
}

export function getStatusTimestampField(status: OrderStatusDisplay): string {
  const map: Record<OrderStatusDisplay, string> = {
    pending: 'createdAt',
    confirmed: 'confirmedAt',
    preparing: 'preparingAt',
    ready_for_delivery: 'readyAt',
    out_for_delivery: 'outForDeliveryAt',
    delivered: 'deliveredAt',
    cancelled: 'cancelledAt',
    refunded: 'cancelledAt',
  };

  return map[status] || 'updatedAt';
}

export function getStatusLabel(status: OrderStatusDisplay): string {
  const labels: Record<OrderStatusDisplay, string> = {
    pending: 'Gözləyir',
    confirmed: 'Təsdiqləndi',
    preparing: 'Hazırlanır',
    ready_for_delivery: 'Çatdırılmağa hazır',
    out_for_delivery: 'Çatdırılır',
    delivered: 'Çatdırıldı',
    cancelled: 'Ləğv edildi',
    refunded: 'Geri qaytarıldı',
  };
  return labels[status] || status;
}

export function getStatusColor(status: OrderStatusDisplay): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<OrderStatusDisplay, { bg: string; text: string; border: string }> = {
    pending: { bg: '#fef3c7', text: '#d97706', border: '#f59e0b' },
    confirmed: { bg: '#dbeafe', text: '#2563eb', border: '#3b82f6' },
    preparing: { bg: '#ede9fe', text: '#7c3aed', border: '#8b5cf6' },
    ready_for_delivery: { bg: '#e0e7ff', text: '#4338ca', border: '#6366f1' },
    out_for_delivery: { bg: '#ffedd5', text: '#ea580c', border: '#f97316' },
    delivered: { bg: '#d1fae5', text: '#059669', border: '#10b981' },
    cancelled: { bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
    refunded: { bg: '#f1f5f9', text: '#64748b', border: '#94a3b8' },
  };
  return colors[status] || colors['pending'];
}

// ════════════════════════════════════════════════════════════════════════════
// ORDER TRANSFORMER (with proper number conversions)
// ════════════════════════════════════════════════════════════════════════════

function parseNumeric(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseFloat(value) || 0;
  return 0;
}

export function transformOrderForFrontend(order: any): OrderFull {
  if (!order) {
    return createEmptyOrder();
  }

  const rawItems = order.items || [];
  const items: OrderItem[] = rawItems.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    variantId: item.variantId,
    productName: item.productName || item.product?.name || 'Məhsul',
    variantName: item.variantName || item.variant?.name || null,
    qty: item.qty || 1,
    unit: item.unit || null,
    priceAtOrder: parseNumeric(item.priceAtOrder).toFixed(2),
    costAtOrder: item.costAtOrder != null ? parseNumeric(item.costAtOrder).toFixed(2) : null,
    subtotal: parseNumeric(item.subtotal).toFixed(2),
    createdAt: item.createdAt || new Date().toISOString(),
  }));

  const itemCount = items.length;

  let cashAmount = 0;
  let cardAmount = 0;
  const total = parseNumeric(order.total || '0');

  const paymentMethod = order.paymentMethod;
  if (paymentMethod === 'CASH_ON_DELIVERY') {
    cashAmount = total;
  } else if (paymentMethod === 'CARD') {
    cardAmount = total;
  } else {
    cashAmount = total * 0.5;
    cardAmount = total * 0.5;
  }

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
    subtotal: parseNumeric(order.subtotal || '0'),
    discountAmount: parseNumeric(order.discountAmount || '0'),
    deliveryFee: parseNumeric(order.deliveryFee || '0'),
    total: parseNumeric(order.total || '0'),
    couponCode: order.couponCode || null,
    couponDiscount: parseNumeric(order.couponDiscount || '0'),
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
    items,
    user: order.user
      ? {
          id: order.user.id,
          firstName: order.user.firstName || '',
          lastName: order.user.lastName || '',
          email: order.user.email || '',
          phone: order.user.phone || null,
        }
      : null,
    delivery: order.delivery || null,
    itemCount,
    cashAmount,
    cardAmount,
    note: order.customerNotes || null,
    address: order.address || order.deliveryAddressText || '',
  };
}

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
    address: '',
  };
}

export function transformOrdersForFrontend(orders: any[]): OrderFull[] {
  if (!orders || !Array.isArray(orders)) return [];
  return orders.map((order) => transformOrderForFrontend(order));
}