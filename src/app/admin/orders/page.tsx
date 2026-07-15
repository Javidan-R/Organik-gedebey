// src/app/admin/orders/page.tsx
'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
  RefreshCw,
  AlertTriangle,
  LogIn,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { ID, useHasHydrated } from '@/lib/store';
import { OrderStatusDisplay, OrderFull, ColumnVisibility } from '@/types/orders';
import { transformOrderForFrontend, fromDisplayStatus } from '@/lib/utils/order-utils';
import { KpiCard } from '@/components/admin/finance/atoms/KpiCard';
import ConfirmationModal from '@/components/admin/orders/ConfirmationModal';
import OrdersPageSkeleton from '@/components/admin/molecules/OrdersPageSkeleton';
import { OrderDetailsFlyout } from '@/components/admin/orders/OrderDetailsFlyout';
import { OrdersFilterBar } from '@/components/admin/orders/OrdersFilterBar';
import { OrdersBulkActionsBar } from '@/components/admin/orders/OrdersBulkActionsBar';
import { OrdersTableDesktop } from '@/components/admin/orders/OrdersTableDesktop';
import { OrdersListMobile } from '@/components/admin/orders/OrdersListMobile';
import { OrdersPagination } from '@/components/admin/orders/OrdersPagination';
import { useOrderFilters } from '@/hooks/orders/useOrderFilters';
import { useOrderAnalytics } from '@/hooks/orders/useOrderAnalytics';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/atoms/button';

export default function OrdersPage() {
  const router = useRouter();
  const { loading: authLoading, refetch: refetchAuth } = useAdminAuth();
  const hasHydrated = useHasHydrated();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isFetching = useRef(false);

  const [selectedOrder, setSelectedOrder] = useState<OrderFull | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<ID[]>([]);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState<string>('all');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<ID | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [columnVisibility] = useState<ColumnVisibility>({
    id: true, customer: true, itemCount: true, total: true,
    status: true, date: true, actions: true,
  });

  const fetchOrders = useCallback(async (silent = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    if (!silent) setLoading(true);
    setFetchError(null);

    try {
      const res = await fetch('/api/orders', { credentials: 'include' });

      if (res.status === 401 || res.status === 403) {
        setFetchError('Sessiya yoxdur. Zəhmət olmasa daxil olun.');
        setOrders([]);
        return;
      }

      if (!res.ok) throw new Error(`Server xətası (${res.status})`);

      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch (err: any) {
      console.error('Fetch orders error:', err);
      setFetchError(err.message || 'Sifarişlər yüklənə bilmədi');
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const id = setInterval(() => fetchOrders(true), 30_000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const ordersWithTotals = useMemo<OrderFull[]>(() => {
    if (!hasHydrated || !orders.length) return [];
    return orders.map((o) => transformOrderForFrontend(o));
  }, [orders, hasHydrated]);

  const getProductName = useCallback((item: any) => item.productName || 'Məhsul', []);

  const {
    searchTerm, setSearchTerm,
    filterStatus, setFilterStatus,
    sortKey, sortDirection, handleSort,
    dateFilterStart, setDateFilterStart,
    dateFilterEnd, setDateFilterEnd,
    onlyProblematic, setOnlyProblematic,
    filteredOrders,
    isFilterActive, resetFilters,
  } = useOrderFilters(ordersWithTotals, getProductName);

  const { metrics, timeWindowStats, paymentStats } = useOrderAnalytics(
    ordersWithTotals, filteredOrders, () => ({ totalRevenue: 0, totalOrders: 0 })
  );

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const totalItems = filteredOrders.length;

  const updateOrderStatus = useCallback(async (orderId: ID, newStatus: string, cancelReason?: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus, cancellationReason: cancelReason }),
      });

      if (res.status === 401 || res.status === 403) {
        refetchAuth?.();
        toast.error('Sessiya bitmişdir. Yenidən daxil olun.');
        return;
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Status yenilənə bilmədi');
      }

      toast.success('Status yeniləndi');
      fetchOrders(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [fetchOrders, refetchAuth]);

  const handleStatusChange = useCallback((orderId: ID, newStatus: OrderStatusDisplay) => {
    const dbStatus = fromDisplayStatus(newStatus);

    if (dbStatus === 'CANCELLED') {
      setOrderToCancel(orderId);
      setShowConfirmModal(true);
      return;
    }
    updateOrderStatus(orderId, dbStatus);
  }, [updateOrderStatus]);

  const confirmCancel = () => {
    if (orderToCancel) {
      updateOrderStatus(orderToCancel, 'CANCELLED', 'Admin tərəfindən ləğv edildi');
    }
    setOrderToCancel(null);
    setShowConfirmModal(false);
  };

  const handleBulkStatusChange = () => {
    if (bulkUpdateStatus === 'all') return;
    const dbStatus = fromDisplayStatus(bulkUpdateStatus as OrderStatusDisplay);
    selectedOrderIds.forEach((id) => updateOrderStatus(id, dbStatus));
    setSelectedOrderIds([]);
    setBulkUpdateStatus('all');
  };

  const handleCheckboxChange = (orderId: ID, checked: boolean) => {
    setSelectedOrderIds((prev) =>
      checked ? [...prev, orderId] : prev.filter((id) => id !== orderId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedOrderIds(filteredOrders.map((o) => o.id));
    else setSelectedOrderIds([]);
  };

  const setToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    setDateFilterStart(today);
    setDateFilterEnd(today);
    setPage(1);
  };

  const setLast7Days = () => {
    const now = new Date();
    const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    setDateFilterStart(past.toISOString().slice(0, 10));
    setDateFilterEnd(now.toISOString().slice(0, 10));
    setPage(1);
  };

  if (!hasHydrated || authLoading) {
    return <OrdersPageSkeleton />;
  }

  return (
    <main className="space-y-8 p-4 md:p-8 bg-gradient-to-b from-emerald-50/60 via-white to-amber-50/50 min-h-screen">
      <Toaster position="top-center" />

      {fetchError && fetchError.includes('Sessiya yoxdur') && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-800 text-sm">{fetchError}</span>
          </div>
          <Button size="sm" onClick={() => router.push('/admin/login')}>
            <LogIn className="w-4 h-4 mr-1" /> Daxil ol
          </Button>
        </div>
      )}

      <ConfirmationModal
        open={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCancel}
        title="Sifarişi ləğv etmək istəyirsiniz?"
        description={`Sifariş #${orderToCancel?.slice(0, 8)} ləğv olunacaq.`}
      />

      <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-[1.8rem] font-extrabold flex items-center gap-3 text-emerald-900">
              <span className="inline-flex w-10 h-10 rounded-2xl bg-emerald-600 text-white items-center justify-center shadow-lg">
                <PackageSearch className="w-5 h-5" />
              </span>
              Sifarişlər
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Real‑time sifariş idarəetməsi • Organik Gədəbəy paneli
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders()}
              disabled={loading}
              className="text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Yenilə
            </Button>
            <div className="flex items-center gap-2 text-sm bg-emerald-100 px-4 py-1.5 rounded-full text-emerald-700 border border-emerald-300">
              <Leaf className="w-4 h-4" />
              Premium POS
            </div>
          </div>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={<DollarSign className="w-4 h-4" />} label="Ümumi gəlir"
          value={`${metrics.totalRevenue.toFixed(2)} ₼`} color="bg-emerald-500" />
        <KpiCard icon={<ShoppingCart className="w-4 h-4" />} label="Ümumi sifariş"
          value={metrics.orderCount.toString()} color="bg-blue-500" />
        <KpiCard icon={<Hourglass className="w-4 h-4" />} label="Gözləyən sifariş"
          value={metrics.pendingOrders.toString()} color="bg-amber-500" />
        <KpiCard icon={<BarChart3 className="w-4 h-4" />} label="Son 7 gün gəliri"
          value={`${timeWindowStats.last7Revenue.toFixed(2)} ₼`} color="bg-emerald-700" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
        <KpiCard icon={<Wallet className="w-4 h-4" />} label="Nağd gəlir"
          value={`${paymentStats.cash.toFixed(2)} ₼`} color="bg-emerald-600" />
        <KpiCard icon={<CreditCard className="w-4 h-4" />} label="Kart gəlir"
          value={`${paymentStats.card.toFixed(2)} ₼`} color="bg-blue-600" />
        <KpiCard icon={<Percent className="w-4 h-4" />} label="Qarışıq — Nağd"
          value={`${paymentStats.mixedCash.toFixed(2)} ₼`} color="bg-purple-600" />
        <KpiCard icon={<Percent className="w-4 h-4" />} label="Qarışıq — Kart"
          value={`${paymentStats.mixedCard.toFixed(2)} ₼`} color="bg-indigo-600" />
      </div>

      <OrdersFilterBar
        searchTerm={searchTerm} onSearch={v => { setSearchTerm(v); setPage(1); }}
        filterStatus={filterStatus as any} onChangeStatus={v => { setFilterStatus(v as OrderStatusDisplay); setPage(1); }}
        dateStart={dateFilterStart} onChangeDateStart={v => { setDateFilterStart(v); setPage(1); }}
        dateEnd={dateFilterEnd} onChangeDateEnd={v => { setDateFilterEnd(v); setPage(1); }}
        onlyProblematic={onlyProblematic} onChangeProblematic={v => { setOnlyProblematic(v); setPage(1); }}
        onResetFilters={() => { resetFilters(); setPage(1); }}
        isFilterActive={isFilterActive}
        setToday={setToday} setLast7Days={setLast7Days}
      />

      {selectedOrderIds.length > 0 && (
        <OrdersBulkActionsBar
          selectedCount={selectedOrderIds.length}
          bulkUpdateStatus={bulkUpdateStatus as any}
          onBulkStatusChange={v => setBulkUpdateStatus(v as OrderStatusDisplay)}
          onApply={handleBulkStatusChange}
        />
      )}

      <div className="hidden md:block">
        <OrdersTableDesktop
          orders={paginatedOrders}
          columnVisibility={columnVisibility}
          selectedOrderIds={selectedOrderIds}
          onRowCheckboxChange={handleCheckboxChange}
          allSelected={paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrderIds.includes(o.id))}
          onSelectAll={handleSelectAll}
          sortKey={sortKey} sortDirection={sortDirection} onSort={handleSort}
          onOpenDetails={o => setSelectedOrder(o)}
          onStatusChange={handleStatusChange}
          getProductName={getProductName}
        />
      </div>

      <div className="md:hidden">
        <OrdersListMobile
          orders={paginatedOrders}
          selectedOrderIds={selectedOrderIds}
          onRowCheckboxChange={handleCheckboxChange}
          onOpenDetails={o => setSelectedOrder(o)}
          onStatusChange={handleStatusChange}
        />
      </div>

      <OrdersPagination
        totalItems={totalItems}
        page={page} setPage={setPage}
        pageSize={pageSize} setPageSize={setPageSize}
      />

      {!loading && orders.length === 0 && !fetchError && (
        <div className="text-center py-10 text-slate-500">
          <Clock className="inline-block mr-2" />
          Hələ heç bir sifariş yoxdur.
        </div>
      )}

      {fetchError && !fetchError.includes('Sessiya yoxdur') && (
        <div className="text-center py-4 text-red-600 bg-red-50 rounded-xl">
          <AlertTriangle className="inline-block mr-2 w-4 h-4" />
          {fetchError}
          <button onClick={() => fetchOrders()} className="ml-2 underline font-bold">
            Yenidən cəhd et
          </button>
        </div>
      )}

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