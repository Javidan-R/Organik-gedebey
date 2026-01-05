"use client";

import { useMemo } from "react";
import { OrderWithTotal } from "@/types/orders";

type AnalyticsFn = () =>
  | {
      totalRevenue?: number;
      totalOrders?: number;
    }
  | undefined;

export function useOrderAnalytics(
allOrders: OrderWithTotal[], filteredOrders: OrderWithTotal[], analytics: AnalyticsFn, 
) {
  const metrics = useMemo(() => {
    const result = analytics?.() || {};
    return {
      totalRevenue: result.totalRevenue ?? 0,
      orderCount: result.totalOrders ?? allOrders.length,
      pendingOrders: allOrders.filter((o) => o.status === "pending").length,
    };
  }, [allOrders, analytics]);

  const filteredMetrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const orderCount = filteredOrders.length;
    const totalItems = filteredOrders.reduce(
      (sum, o) => sum + o.itemCount,
      0,
    );

    const avgOrderValue = orderCount ? totalRevenue / orderCount : 0;
    const avgItems = orderCount ? totalItems / orderCount : 0;
    const deliveredCount = filteredOrders.filter(
      (o) => o.status === "delivered",
    ).length;
    const cancelledCount = filteredOrders.filter(
      (o) => o.status === "cancelled",
    ).length;

    const fulfilmentRate = orderCount
      ? (deliveredCount / orderCount) * 100
      : 0;
    const cancelledRate = orderCount
      ? (cancelledCount / orderCount) * 100
      : 0;

    return {
      totalRevenue,
      orderCount,
      avgOrderValue,
      avgItems,
      fulfilmentRate,
      cancelledRate,
    };
  }, [filteredOrders]);

  const timeWindowStats = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const fourteenDaysAgo = new Date(
      now.getTime() - 14 * 24 * 60 * 60 * 1000,
    );

    let last7Revenue = 0;
    let last7Orders = 0;
    let prev7Revenue = 0;
    let prev7Orders = 0;

    allOrders.forEach((o) => {
      const total = o.items.reduce(
        (s, i) => s + i.priceAtOrder * i.qty,
        0,
      );
      const d = new Date(o.createdAt);
      if (d >= sevenDaysAgo) {
        last7Revenue += total;
        last7Orders += 1;
      } else if (d >= fourteenDaysAgo && d < sevenDaysAgo) {
        prev7Revenue += total;
        prev7Orders += 1;
      }
    });

    const revenueDelta =
      prev7Revenue > 0
        ? ((last7Revenue - prev7Revenue) / prev7Revenue) * 100
        : null;

    return {
      last7Revenue,
      last7Orders,
      prev7Revenue,
      prev7Orders,
      revenueDelta,
    };
  }, [allOrders]);
const paymentStats = useMemo(() => {
  let cash = 0;
  let card = 0;
  let mixedCash = 0;
  let mixedCard = 0;

  filteredOrders.forEach((o) => {
    if (o.paymentMethod === "cash") cash += o.total;
    else if (o.paymentMethod === "card") card += o.total;
    else if (o.paymentMethod === "mixed") {
      mixedCash += o.cashAmount ?? 0;
      mixedCard += o.cardAmount ?? 0;
    }
  });

  return {
    cash,
    card,
    mixedCash,
    mixedCard,
  };
}, [filteredOrders]);

  return {
    metrics,
    filteredMetrics,
    timeWindowStats,
    paymentStats
  };
}
