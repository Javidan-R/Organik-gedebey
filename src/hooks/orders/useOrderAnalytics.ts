// src/hooks/orders/useOrderAnalytics.ts
import { useMemo } from 'react';
import { OrderFull } from '@/types/orders';

/**
 * Sifarişlərin gəlir, say, ödəniş statistikalarını hesablayır.
 * Gəlir hesablamaları yalnız təsdiqlənmiş (confirmed+) sifarişlər üzərində aparılır.
 */
export function useOrderAnalytics(
  allOrders: OrderFull[],
  filteredOrders: OrderFull[],
  fallback: () => { totalRevenue: number; totalOrders: number }
) {
  const metrics = useMemo(() => {
    if (!allOrders || allOrders.length === 0) {
      return {
        totalRevenue: 0,
        orderCount: 0,
        pendingOrders: 0,
      };
    }

    // Gəlir statusları: PENDING və CANCELLED xaric hamısı
    const revenueStatuses = new Set([
      'confirmed',
      'preparing',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'refunded',
    ]);

    const revenueOrders = allOrders.filter(
      (o) => revenueStatuses.has(o.status)
    );

    const pendingOrders = allOrders.filter(
      (o) => o.status === 'pending'
    ).length;

    const totalRevenue = revenueOrders.reduce(
      (sum, o) => sum + (typeof o.total === 'number' ? o.total : parseFloat(o.total || '0')),
      0
    );

    const orderCount = allOrders.length;

    return {
      totalRevenue,
      orderCount,
      pendingOrders,
    };
  }, [allOrders]);

  const timeWindowStats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const revenueStatuses = new Set([
      'confirmed',
      'preparing',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'refunded',
    ]);

    const last7Orders = allOrders.filter(
      (o) =>
        new Date(o.createdAt) >= sevenDaysAgo &&
        revenueStatuses.has(o.status)
    );

    const last7Revenue = last7Orders.reduce(
      (sum, o) => sum + (typeof o.total === 'number' ? o.total : parseFloat(o.total || '0')),
      0
    );

    return {
      last7Revenue,
    };
  }, [allOrders]);

  const paymentStats = useMemo(() => {
    const revenueStatuses = new Set([
      'confirmed',
      'preparing',
      'ready_for_delivery',
      'out_for_delivery',
      'delivered',
      'refunded',
    ]);

    const revenueOrders = allOrders.filter(
      (o) => revenueStatuses.has(o.status)
    );

    let cash = 0;
    let card = 0;
    let mixedCash = 0;
    let mixedCard = 0;

    for (const order of revenueOrders) {
      const total = typeof order.total === 'number' ? order.total : parseFloat(order.total || '0');
      const paymentMethod = order.paymentMethod;

      if (paymentMethod === 'cash') {
        cash += total;
      } else if (paymentMethod === 'card') {
        card += total;
      } else if (paymentMethod === 'mixed') {
        mixedCash += order.cashAmount ?? total * 0.5;
        mixedCard += order.cardAmount ?? total * 0.5;
      }
    }

    return {
      cash,
      card,
      mixedCash,
      mixedCard,
    };
  }, [allOrders]);

  return {
    metrics,
    timeWindowStats,
    paymentStats,
  };
}