"use client";

import { useMemo, useState, useCallback } from "react";
import { OrderWithTotal, OrderStatus, SortKey, SortDirection } from "@/types/orders";

type GetProductNameFn = (item: any) => string;

export function useOrderFilters(
  orders: OrderWithTotal[],
  getProductName: GetProductNameFn,
) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [dateFilterStart, setDateFilterStart] = useState("");
  const [dateFilterEnd, setDateFilterEnd] = useState("");
  const [onlyProblematic, setOnlyProblematic] = useState(false);

  const handleSort = useCallback(
    (key: SortKey) => {
      setSortKey(key);
      setSortDirection((prev) =>
        key === sortKey && prev === "desc" ? "asc" : "desc",
      );
    },
    [sortKey],
  );

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setFilterStatus("all");
    setSortKey("createdAt");
    setSortDirection("desc");
    setDateFilterStart("");
    setDateFilterEnd("");
    setOnlyProblematic(false);
  }, []);

  const filteredOrders = useMemo<OrderWithTotal[]>(() => {
    let list = orders;

    const q = searchTerm.trim().toLowerCase();
    const startDate = dateFilterStart ? new Date(dateFilterStart) : null;
    const endDate = dateFilterEnd ? new Date(dateFilterEnd) : null;

    list = list.filter((o) => {
      const statusMatch = filterStatus === "all" || o.status === filterStatus;

      const searchMatch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q) ||
        o.items.some((item) =>
          getProductName(item).toLowerCase().includes(q),
        );

      const orderDate = new Date(o.createdAt);
      const dateMatch =
        (!startDate || orderDate >= startDate) &&
        (!endDate || orderDate <= endDate);

      const problematicMatch = !onlyProblematic
        ? true
        : o.status === "cancelled" || o.status === "pending";

      return statusMatch && searchMatch && dateMatch && problematicMatch;
    });

    list = list.slice().sort((a, b) => {
      let aVal: number;
      let bVal: number;

      if (sortKey === "total") {
        aVal = a.total;
        bVal = b.total;
      } else if (sortKey === "itemCount") {
        aVal = a.itemCount;
        bVal = b.itemCount;
      } else {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      let cmp = 0;
      if (aVal > bVal) cmp = 1;
      else if (aVal < bVal) cmp = -1;

      return sortDirection === "asc" ? cmp : -cmp;
    });

    return list;
  }, [
    orders,
    searchTerm,
    filterStatus,
    sortKey,
    sortDirection,
    dateFilterStart,
    dateFilterEnd,
    onlyProblematic,
    getProductName,
  ]);

  const isFilterActive =
    !!searchTerm ||
    filterStatus !== "all" ||
    !!dateFilterStart ||
    !!dateFilterEnd ||
    onlyProblematic;

  return {
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    sortKey,
    sortDirection,
    handleSort,
    dateFilterStart,
    setDateFilterStart,
    dateFilterEnd,
    setDateFilterEnd,
    onlyProblematic,
    setOnlyProblematic,
    filteredOrders,
    isFilterActive,
    resetFilters,
  };
}
