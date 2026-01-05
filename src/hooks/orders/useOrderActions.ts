// src/hooks/orders/useOrderActions.ts
"use client";

import { useState, useCallback } from "react";
import { OrderStatus, OrderWithTotal } from "@/types/orders";
import { ID } from "@/lib/types";
type UpdateOrderStatusFunction = (id: ID, status: OrderStatus) => void;

export function useOrderActions(updateOrderStatus: UpdateOrderStatusFunction) {
  const [selectedOrder, setSelectedOrder] = useState<OrderWithTotal | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const requestCancel = useCallback((id: string) => {
    setCancelId(id);
    setShowCancelModal(true);
  }, []);

  const confirmCancel = useCallback(() => {
    if (cancelId) updateOrderStatus(cancelId, "cancelled");
    setShowCancelModal(false);
    setCancelId(null);
  }, [cancelId, updateOrderStatus]);

  return {
    selectedOrder, setSelectedOrder,
    showCancelModal, setShowCancelModal,
    requestCancel,
    confirmCancel,
  };
}
