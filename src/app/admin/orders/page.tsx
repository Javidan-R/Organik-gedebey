// src/app/admin/orders/page.tsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageSearch,
  Clock,
  DollarSign,
  ShoppingCart,
  Hourglass,
  Leaf,
  BarChart3,
  CreditCard,
  Percent,
  Wallet,
} from "lucide-react";

import { ID, OrderStatus, useApp, useHasHydrated } from "@/lib/store";
import { KpiCard } from "@/components/atoms/atoms/KpiCard";
import ConfirmationModal from "@/components/admin/orders/ConfirmationModal";
import OrdersPageSkeleton from "@/components/admin/molecules/OrdersPageSkeleton";
import { OrderDetailsFlyout } from "@/components/admin/orders/OrderDetailsFlyout";
import { OrdersFilterBar } from "@/components/admin/orders/OrdersFilterBar";
import { OrdersBulkActionsBar } from "@/components/admin/orders/OrdersBulkActionsBar";
import { OrdersTableDesktop } from "@/components/admin/orders/OrdersTableDesktop";
import { OrdersListMobile } from "@/components/admin/orders/OrdersListMobile";
import { OrdersPagination } from "@/components/admin/orders/OrdersPagination";
import { useOrderFilters } from "@/hooks/orders/useOrderFilters";
import { useOrderAnalytics } from "@/hooks/orders/useOrderAnalytics";
import { OrderWithTotal, ColumnVisibility, OrderFull } from "@/types/orders";

// ================================================================
// MAIN PAGE
// ================================================================
export default function OrdersPage() {
  const { orders, updateOrderStatus, analytics, products } = useApp();
  const hasHydrated = useHasHydrated();

  // Flyout selected order
  const [selectedOrder, setSelectedOrder] =
    useState<OrderWithTotal | null>(null);

  // Bulk edit states
  const [selectedOrderIds, setSelectedOrderIds] = useState<ID[]>([]);
  const [bulkUpdateStatus, setBulkUpdateStatus] =
    useState<OrderStatus | "all">("all");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<ID | null>(null);

  // Column visibility
  const [columnVisibility] = useState<ColumnVisibility>({
    id: true,
    customer: true,
    itemCount: true,
    total: true,
    status: true,
    date: true,
    actions: true,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Product name map for speed
  const productNameMap = useMemo(() => {
    const map = new Map<ID, string>();
    products.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [products]);

  const getProductName = useCallback(
    (item: any) => {
      if (item.productName) return item.productName;
      if (item.productId && productNameMap.has(item.productId)) {
        return productNameMap.get(item.productId)!;
      }
      return "Məhsul";
    },
    [productNameMap],
  );
const normalizePayment = (method: any): "cash" | "card" | "mixed" => {
  if (method === "cash" || method === "card" || method === "mixed") {
    return method;
  }
  return "cash";  // fallback
};
  // Orders with computed totals
const ordersWithTotals = useMemo<OrderFull[]>(() => {
  if (!hasHydrated) return [];

  return orders.map((o) => ({
    ...o,
    total: o.items.reduce((sum, item) => sum + item.priceAtOrder * item.qty, 0),
    itemCount: o.items.length,

    paymentMethod: normalizePayment(o.paymentMethod),
    cashAmount: Number(o.cashAmount ?? 0),
    cardAmount: Number(o.cardAmount ?? 0),
    note: o.note ?? "",
    address: o.address ?? "",
    customerPhone: o.customerPhone ?? "",
  }));
}, [orders, hasHydrated]);

  // FILTER HOOK
  const {
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
  } = useOrderFilters(ordersWithTotals, getProductName);

  // ANALYTICS HOOK
  const { metrics, timeWindowStats, paymentStats } = useOrderAnalytics(
    ordersWithTotals,
    filteredOrders,
    analytics,
  );

  // Pagination apply
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  // Total filtered count
  const totalItems = filteredOrders.length;

  // ===============================
  // STATUS CHANGE (single)
  // ===============================
  const handleStatusChange = useCallback(
    (orderId: ID, newStatus: OrderStatus) => {
      if (newStatus === "cancelled") {
        setOrderToCancel(orderId);
        setShowConfirmModal(true);
        return;
      }

      updateOrderStatus(orderId, newStatus);

      setSelectedOrder((prev) =>
        prev && prev.id === orderId
          ? { ...prev, status: newStatus }
          : prev,
      );
    },
    [updateOrderStatus],
  );

  // Confirm cancel
  const confirmCancel = () => {
    if (orderToCancel) {
      updateOrderStatus(orderToCancel, "cancelled");
    }
    setOrderToCancel(null);
    setShowConfirmModal(false);
  };

  // ===============================
  // BULK STATUS UPDATE
  // ===============================
  const handleBulkStatusChange = () => {
    if (bulkUpdateStatus === "all") return;

    selectedOrderIds.forEach((id) =>
      updateOrderStatus(id, bulkUpdateStatus),
    );

    setSelectedOrderIds([]);
    setBulkUpdateStatus("all");
  };

  // ===============================
  // CHECKBOX HELPERS
  // ===============================
  const handleCheckboxChange = (orderId: ID, checked: boolean) => {
    setSelectedOrderIds((prev) =>
      checked
        ? [...prev, orderId]
        : prev.filter((id) => id !== orderId),
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  // QUICK DATE FILTERS
  const setToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDateFilterStart(today);
    setDateFilterEnd(today);
    setPage(1);
  };

  const setLast7Days = () => {
    const now = new Date();
    const past = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000,
    );

    setDateFilterStart(past.toISOString().slice(0, 10));
    setDateFilterEnd(now.toISOString().slice(0, 10));
    setPage(1);
  };

  // ===============================
  // LOADING
  // ===============================
  if (!hasHydrated) {
    return <OrdersPageSkeleton />;
  }

  // ===============================
  // RENDER
  // ===============================
  return (
    <main className="space-y-8 p-4 md:p-8 bg-gradient-to-b from-emerald-50/60 via-white to-amber-50/50 min-h-screen">

      {/* CANCEL CONFIRM MODAL */}
      <ConfirmationModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCancel}
        title="Sifarişi ləğv etmək istəyirsiniz?"
        description={`Sifariş #${orderToCancel?.slice(0, 8)} ləğv olunacaq.`}
      />

      {/* HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-[1.8rem] font-extrabold flex items-center gap-3 text-emerald-900">
              <span className="inline-flex w-10 h-10 rounded-2xl bg-emerald-600 text-white items-center justify-center shadow-lg">
                <PackageSearch className="w-5 h-5" />
              </span>
              Sifarişlər
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real-time sifariş idarəetməsi • Organik Gədəbəy paneli
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm bg-emerald-100 px-4 py-1.5 rounded-full text-emerald-700 border border-emerald-300">
            <Leaf className="w-4 h-4" />
            Premium POS sifariş modulu
          </div>
        </div>
      </motion.header>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Ümumi gəlir"
          value={`${metrics.totalRevenue.toFixed(2)} ₼`}
          color="bg-emerald-500"
        />

        <KpiCard
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Ümumi sifariş"
          value={metrics.orderCount.toString()}
          color="bg-blue-500"
        />

        <KpiCard
          icon={<Hourglass className="w-4 h-4" />}
          label="Gözləyən sifariş"
          value={metrics.pendingOrders.toString()}
          color="bg-amber-500"
        />

        <KpiCard
          icon={<BarChart3 className="w-4 h-4" />}
          label="Son 7 gün gəliri"
          value={`${timeWindowStats.last7Revenue.toFixed(2)} ₼`}
          color="bg-emerald-700"
        />
        {/* PAYMENT KPI-lar */}


      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">

  <KpiCard
    icon={<Wallet className="w-4 h-4" />}
    label="Nağd gəlir"
    value={`${paymentStats.cash.toFixed(2)} ₼`}
    color="bg-emerald-600"
  />

  <KpiCard
    icon={<CreditCard className="w-4 h-4" />}
    label="Kart gəlir"
    value={`${paymentStats.card.toFixed(2)} ₼`}
    color="bg-blue-600"
  />

  <KpiCard
    icon={<Percent className="w-4 h-4" />}
    label="Qarışıq — Nağd"
    value={`${paymentStats.mixedCash.toFixed(2)} ₼`}
    color="bg-purple-600"
  />

  <KpiCard
    icon={<Percent className="w-4 h-4" />}
    label="Qarışıq — Kart"
    value={`${paymentStats.mixedCard.toFixed(2)} ₼`}
    color="bg-indigo-600"
  />
</div>

      {/* FILTER BAR */}
      <OrdersFilterBar
        searchTerm={searchTerm}
        onSearch={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        filterStatus={filterStatus}
        onChangeStatus={(v) => {
          setFilterStatus(v);
          setPage(1);
        }}
        dateStart={dateFilterStart}
        onChangeDateStart={(v) => {
          setDateFilterStart(v);
          setPage(1);
        }}
        dateEnd={dateFilterEnd}
        onChangeDateEnd={(v) => {
          setDateFilterEnd(v);
          setPage(1);
        }}
        onlyProblematic={onlyProblematic}
        onChangeProblematic={(v) => {
          setOnlyProblematic(v);
          setPage(1);
        }}
        onResetFilters={() => {
          resetFilters();
          setPage(1);
        }}
        isFilterActive={isFilterActive}
        setToday={setToday}
        setLast7Days={setLast7Days}
      />

      {/* BULK BAR */}
      {selectedOrderIds.length > 0 && (
        <OrdersBulkActionsBar
          selectedCount={selectedOrderIds.length}
          bulkUpdateStatus={bulkUpdateStatus}
          onBulkStatusChange={setBulkUpdateStatus}
          onApply={handleBulkStatusChange}
        />
      )}

      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        <OrdersTableDesktop
  orders={paginatedOrders}
  columnVisibility={columnVisibility}

  selectedOrderIds={selectedOrderIds}
  onRowCheckboxChange={handleCheckboxChange}
  allSelected={
    paginatedOrders.length > 0 &&
    paginatedOrders.every((o) => selectedOrderIds.includes(o.id))
  }
  onSelectAll={handleSelectAll}

  sortKey={sortKey}
  sortDirection={sortDirection}
  onSort={handleSort}
  onOpenDetails={(o) => setSelectedOrder(o)}
  onStatusChange={handleStatusChange}
  getProductName={getProductName}
/>

      </div>

      {/* MOBILE LIST */}
      <div className="md:hidden">
        <OrdersListMobile
  orders={paginatedOrders}
  selectedOrderIds={selectedOrderIds}
  onRowCheckboxChange={handleCheckboxChange}
  onOpenDetails={(o) => setSelectedOrder(o)}
  onStatusChange={handleStatusChange}
/>

      </div>

      {/* PAGINATION */}
      <OrdersPagination
        totalItems={totalItems}
        page={page}
        setPage={setPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />

      {/* EMPTY */}
      {orders.length === 0 && (
        <div className="text-center py-10 text-slate-500">
          <Clock className="inline-block mr-2" />
          Hələ heç bir sifariş yoxdur.
        </div>
      )}

      {/* FLYOUT */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsFlyout
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            getProductName={getProductName}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
