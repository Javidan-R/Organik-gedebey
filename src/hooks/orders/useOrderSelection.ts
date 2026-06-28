// src/hooks/orders/useOrderSelection.ts
"use client";

import { useState, useCallback } from "react";
import { ID } from "@/lib/store"; // Fərz edilir ki, ID burdan gəlir
import { OrderStatus } from "@/types/orders"; // Fərz edilir ki, OrderStatus burdan gəlir

// 1. Yeni, aydın funksiya tipini təyin edirik
type UpdateOrderStatusFunction = (id: ID, status: OrderStatus) => void;

// 2. Hook-un imzasını dəyişirik
export function useOrderSelection(updateOrderStatus: UpdateOrderStatusFunction) {
  const [selectedIds, setSelectedIds] = useState<ID[]>([]);
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | "all">("all");

  const toggle = useCallback((id: ID, value: boolean) => {
    setSelectedIds((prev) => value ? [...prev, id] : prev.filter((x) => x !== id));
  }, []);

  const selectAll = useCallback((ids: ID[], checked: boolean) => {
    setSelectedIds(checked ? ids : []);
  }, []);

  const applyBulkStatus = useCallback(() => {
    if (bulkStatus === "all" || !selectedIds.length) return;
    
    // Status dəyişikliyi tətbiq edilir
    selectedIds.forEach((id) => updateOrderStatus(id, bulkStatus as OrderStatus));
    
    setSelectedIds([]);
    setBulkStatus("all");
  }, [bulkStatus, selectedIds, updateOrderStatus]);

  return {
    selectedIds,
    bulkStatus, setBulkStatus,
    toggle,
    selectAll,
    applyBulkStatus,
  };
}