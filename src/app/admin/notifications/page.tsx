'use client';

import { useState,  useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
  XCircle,
  ShoppingCart,
  Package,
  Truck,
  Users,
  MessageSquare,
  Star,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import type { Notification, NotificationType } from '@/types/notification';

// Notification type-ları üçün label və icon mapping
const TYPE_META: Record<NotificationType, { label: string; icon: React.ComponentType; color: string }> = {
  ORDER_CREATED: { label: 'Sifariş yaradıldı', icon: ShoppingCart, color: 'text-blue-500 bg-blue-500/10' },
  ORDER_PAID: { label: 'Ödəniş alındı', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
  ORDER_CONFIRMED: { label: 'Sifariş təsdiqləndi', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
  ORDER_SHIPPED: { label: 'Sifariş göndərildi', icon: Truck, color: 'text-indigo-500 bg-indigo-500/10' },
  ORDER_DELIVERED: { label: 'Sifariş çatdırıldı', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
  ORDER_CANCELLED: { label: 'Sifariş ləğv edildi', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  ORDER_STATUS_CHANGED: { label: 'Status dəyişdi', icon: RefreshCw, color: 'text-amber-500 bg-amber-500/10' },
  NEW_PRODUCT: { label: 'Yeni məhsul', icon: Package, color: 'text-purple-500 bg-purple-500/10' },
  PRODUCT_UPDATED: { label: 'Məhsul yeniləndi', icon: Package, color: 'text-blue-500 bg-blue-500/10' },
  LOW_STOCK: { label: 'Stok azalıb', icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10' },
  OUT_OF_STOCK: { label: 'Stok bitdi', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  STOCK_RESTOCKED: { label: 'Stok əlavə edildi', icon: Package, color: 'text-green-500 bg-green-500/10' },
  NEW_MESSAGE: { label: 'Yeni mesaj', icon: MessageSquare, color: 'text-violet-500 bg-violet-500/10' },
  SYSTEM: { label: 'Sistem', icon: Info, color: 'text-slate-400 bg-slate-500/10' },
  PROMOTION: { label: 'Promosyon', icon: Star, color: 'text-pink-500 bg-pink-500/10' },
  CUSTOMER_REGISTERED: { label: 'Yeni müştəri', icon: Users, color: 'text-teal-500 bg-teal-500/10' },
  DELIVERY_STARTED: { label: 'Çatdırılma başladı', icon: Truck, color: 'text-indigo-500 bg-indigo-500/10' },
  DELIVERY_COMPLETED: { label: 'Çatdırılma tamamlandı', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10' },
  PAYMENT_RECEIVED: { label: 'Ödəniş alındı', icon: CheckCircle2, color: 'text-green-500 bg-green-500/10' },
  COUPON_USED: { label: 'Kupon istifadə edildi', icon: Star, color: 'text-orange-500 bg-orange-500/10' },
  WAREHOUSE_ALERT: { label: 'Anbar xəbərdarlığı', icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10' },
  PRICE_CHANGE: { label: 'Qiymət dəyişikliyi', icon: AlertCircle, color: 'text-yellow-500 bg-yellow-500/10' },
};

const TYPE_OPTIONS = Object.entries(TYPE_META).map(([value, meta]) => ({
  value: value as NotificationType,
  label: meta.label,
}));

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, isLoading, isError, unreadCount, markAllAsRead, dismiss, markAsRead, refetch } = useNotifications();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<NotificationType[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const itemsPerPage = 20;

  // Filter notifications
  const filtered = useMemo(() => {
    let result = [...notifications];

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(term) ||
          n.message.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      result = result.filter((n) => selectedTypes.includes(n.type));
    }

    // Read status
    if (statusFilter === 'read') {
      result = result.filter((n) => n.isRead);
    } else if (statusFilter === 'unread') {
      result = result.filter((n) => !n.isRead);
    }

    return result;
  }, [notifications, searchTerm, selectedTypes, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTypes, statusFilter]);

  // Handlers
  const handleToggleType = (type: NotificationType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dismiss(id);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    // Link redirect
    const link = getNotificationLink(notification);
    if (link) {
      router.push(link);
    }
  };

  const getNotificationLink = (notification: Notification) => {
    const { refType, refId } = notification;
    if (refType === 'ORDER' && refId) return `/admin/orders/${refId}`;
    if (refType === 'PRODUCT' && refId) return `/admin/products/${refId}`;
    if (refType === 'MESSAGE') return '/admin/whatsapp/inbox';
    if (refType === 'USER' && refId) return `/admin/users/${refId}`;
    if (refType === 'COUPON') return '/admin/promotions';
    return null;
  };

  const formatTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'İndi';
    if (diffMins < 60) return `${diffMins} dəq əvvəl`;
    if (diffHours < 24) return `${diffHours} saat əvvəl`;
    if (diffDays === 1) return 'Dünən';
    if (diffDays < 7) return `${diffDays} gün əvvəl`;
    return date.toLocaleDateString('az-AZ', { day: 'numeric', month: 'short' });
  };

  // Loading / Error states
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-2 border-slate-700 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-500 mt-4">Bildirişlər yüklənir...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <XCircle className="w-12 h-12 text-red-500/60" />
        <p className="text-slate-400 mt-4">Bildirişlər yüklənərkən xəta baş verdi</p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
        >
          Yenidən cəhd et
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Bildirişlər</h1>
          <p className="text-sm text-slate-400">
            {unreadCount > 0 ? `${unreadCount} oxunmamış bildiriş` : 'Bütün bildirişlər oxundu'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Hamısını oxu
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Yenilə"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Bildirişlərdə axtar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 bg-slate-800/50 border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm ${
              selectedTypes.length > 0 || statusFilter !== 'all'
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-800/50 border-white/[0.06] text-slate-400 hover:text-white'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtr
            {(selectedTypes.length > 0 || statusFilter !== 'all') && (
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
                {selectedTypes.length + (statusFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </button>

          {(selectedTypes.length > 0 || statusFilter !== 'all' || searchTerm) && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Təmizlə
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdown */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mb-6"
          >
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-xl p-4">
              <div className="space-y-4">
                {/* Status filter */}
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Status</p>
                  <div className="flex gap-2">
                    {['all', 'unread', 'read'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          statusFilter === status
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-700/30 text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }`}
                      >
                        {status === 'all' ? 'Hamısı' : status === 'unread' ? 'Oxunmamış' : 'Oxunmuş'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type filter */}
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Növ</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TYPE_OPTIONS.map(({ value, label }) => {
                      const Icon = TYPE_META[value].icon;
                      const isSelected = selectedTypes.includes(value);
                      return (
                        <button
                          key={value}
                          onClick={() => handleToggleType(value)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                              : 'bg-slate-700/30 text-slate-400 hover:text-white hover:bg-slate-700/50'
                          }`}
                        >
                          <Icon />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification List */}
      {paginatedItems.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm">Heç bir bildiriş tapılmadı</p>
          {(searchTerm || selectedTypes.length > 0 || statusFilter !== 'all') && (
            <button
              onClick={handleClearFilters}
              className="mt-2 text-emerald-400 text-sm hover:underline"
            >
              Filtrləri təmizlə
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {paginatedItems.map((notification) => {
              const Icon = TYPE_META[notification.type]?.icon || Info;
              const colorClass = TYPE_META[notification.type]?.color || 'text-slate-400 bg-slate-500/10';
              const link = getNotificationLink(notification);
              const timeAgo = formatTime(notification.createdAt);

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                    notification.isRead
                      ? 'bg-slate-800/30 border-white/[0.04] hover:bg-slate-800/60'
                      : 'bg-slate-800/60 border-emerald-500/20 hover:bg-slate-800/80'
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon  />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${notification.isRead ? 'text-slate-400' : 'text-white'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 whitespace-nowrap">
                        {timeAgo}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {notification.refType && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 font-medium uppercase tracking-wider">
                          {notification.refType}
                        </span>
                      )}
                      {link && (
                        <span className="text-xs text-emerald-400/70 flex items-center gap-1">
                          <ArrowLeft className="w-3 h-3 rotate-180" />
                          Bax
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await markAsRead(notification.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title="Oxundu"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleDismiss(notification.id, e)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Sil"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
              <p className="text-sm text-slate-500">
                {filtered.length} bildirişdən {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filtered.length)} göstərilir
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-2 text-sm text-slate-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}