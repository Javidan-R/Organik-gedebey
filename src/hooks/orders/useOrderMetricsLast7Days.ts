// src/hooks/orders/useOrderMetricsLast7Days.ts
"use client";

import { useMemo } from "react";
import { OrderWithTotal } from "@/types/orders";

export function useOrderMetricsLast7Days(orders: OrderWithTotal[]) {
  return useMemo(() => {
    const now = new Date();
    const last7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const prev7 = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

    let last = 0, prev = 0;
    let lastCount = 0, prevCount = 0;

    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const total = o.items.reduce((s, i) => s + i.qty * i.priceAtOrder, 0);

      if (d >= last7) {
        last += total;
        lastCount++;
      } else if (d >= prev7 && d < last7) {
        prev += total;
        prevCount++;
      }
    });

    const delta = prev > 0 ? ((last - prev) / prev) * 100 : null;

    return {
      last7Revenue: last,
      last7Orders: lastCount,
      prev7Revenue: prev,
      prev7Orders: prevCount,
      delta,
    };
  }, [orders]);
}
