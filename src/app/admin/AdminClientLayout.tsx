// src/app/admin/AdminClientLayout.tsx
"use client";

import { usePathname } from "next/navigation";
import {
  LogOut, LayoutDashboard, Package, Users, Settings,
  ChevronRight, Bell, Search, Menu, X, Leaf, ShoppingCart, Truck, Sun, TrendingUp, Warehouse,
  DollarSign, MessageSquare, Percent,
  UserCheck, RefreshCw, CheckCircle2,
  AlertTriangle, Star, Command, Home, Package2,
  CreditCard,
  ArrowRight, Info, XCircle, LineChart, UserRoundCheck,
  BookOpen, ClipboardList, PackageSearch, Grid2X2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { motion, AnimatePresence } from "framer-motion";
import { NotificationProvider, useNotifications } from "@/contexts/NotificationContext";
import { useNavigationCounts } from "@/hooks/useNavigationCounts";

// ============================================================
// Navigation Items – badgeKey ilə dinamik saylar
// ============================================================
type NavItemBase = {
  id: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  badgeKey?: keyof import("@/hooks/useNavigationCounts").NavigationCounts; // Dinamik say açarı
};

type NavItemLink = NavItemBase & { type: "link" };
type NavItemGroupTitle = NavItemBase & { type: "group-title"; groupId: string };
type NavItemGroupLink = NavItemBase & { type: "group-link"; groupId: string };

type NavItem = NavItemLink | NavItemGroupTitle | NavItemGroupLink;

const navItems: NavItem[] = [
  { id: "dash", href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, type: "link" },
  { id: "fresh-today", href: "/admin/fresh-today", label: "Bugün Gələnlər", icon: <Calendar className="w-4 h-4" />, type: "group-link", groupId: "fresh-today" },
  { id: "sales-group-title", href: "#", label: "Satış & Sifarişlər", icon: <ShoppingCart className="w-4 h-4" />, type: "group-title", groupId: "sales" },
  { id: "orders", href: "/admin/orders", label: "Bütün Sifarişlər", icon: <ClipboardList className="w-4 h-4" />, type: "group-link", groupId: "sales", badgeKey: "pendingOrders" },
  { id: "new-sale", href: "/admin/sales/new", label: "Satış qeydiyyatı", icon: <ClipboardList className="w-4 h-4" />, type: "group-link", groupId: "sales" },
  { id: "whatsapp", href: "/admin/whatsapp/inbox", label: "Whatsapp Inbox", icon: <MessageSquare className="w-4 h-4" />, type: "group-link", groupId: "sales", badgeKey: "unreadMessages" },
  { id: "inventory-group-title", href: "#", label: "Stok & Məhsul", icon: <Warehouse className="w-4 h-4" />, type: "group-title", groupId: "inventory" },
  { id: "products", href: "/admin/products", label: "Məhsullar", icon: <PackageSearch className="w-4 h-4" />, type: "group-link", groupId: "inventory", badgeKey: "lowStockProducts" },
  { id: "categories", href: "/admin/categories", label: "Kateqoriyalar", icon: <Grid2X2 className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "baskets", href: "/admin/baskets", label: "Səbətlər", icon: <ClipboardList className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "hero", href: "/admin/settings/hero", label: "Önə Çıxanlar", icon: <ClipboardList className="w-4 h-4" />, type: "group-link", groupId: "fresh-today" },
  { id: "intake", href: "/admin/inventory/intake", label: "Mal qəbulu", icon: <Warehouse className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "spoilage", href: "/admin/inventory/spoilage", label: "Xarab olma", icon: <AlertTriangle className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "finance-group-title", href: "#", label: "Maliyyə & Analitika", icon: <LineChart className="w-4 h-4" />, type: "group-title", groupId: "finance" },
  { id: "fin-overview", href: "/admin/finance", label: "Ümumi Maliyyə", icon: <CreditCard className="w-4 h-4" />, type: "group-link", groupId: "finance" },
  { id: "expenses", href: "/admin/expenses", label: "Xərclər", icon: <CreditCard className="w-4 h-4" />, type: "group-link", groupId: "finance" },
  { id: "daily-sum", href: "/admin/summary/daily", label: "Günlük Hesabat", icon: <TrendingUp className="w-4 h-4" />, type: "group-link", groupId: "finance" },
  { id: "users", href: "/admin/users", label: "İstifadəçilər", icon: <UserRoundCheck className="w-4 h-4" />, type: "link", badgeKey: "activeUsers" },
  { id: "about-us", href: "/admin/about-us", label: "Haqqımızda", icon: <BookOpen className="w-4 h-4" />, type: "link" },
  { id: "settings", href: "/admin/settings", label: "Tənzimləmələr", icon: <Settings className="w-4 h-4" />, type: "link" },
];

function buildNavGroups(items: NavItem[]) {
  const groups: { label: string; items: any[] }[] = [];
  const standalone: any[] = [];
  let currentGroup: any = null;

  items.forEach(item => {
    if (item.type === "group-title") {
      currentGroup = { label: item.label, items: [] };
      groups.push(currentGroup);
    } else if (item.type === "group-link" && currentGroup) {
      currentGroup.items.push({ href: item.href, label: item.label, icon: item.icon, badgeKey: item.badgeKey });
    } else if (item.type === "link") {
      standalone.push({ href: item.href, label: item.label, icon: item.icon, badgeKey: item.badgeKey });
    } else if (item.type === "group-link" && !currentGroup) {
      standalone.push({ href: item.href, label: item.label, icon: item.icon, badgeKey: item.badgeKey });
    }
  });

  if (standalone.length) {
    groups.unshift({ label: "Əsas", items: standalone });
  }

  return groups;
}

const navGroups = buildNavGroups(navItems);

// ============================================================
// Notification Panel Component (useNotifications istifadə edir)
// ============================================================
function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, isLoading, isError, unreadCount, markAllAsRead, dismiss, markAsRead } = useNotifications();
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  const formatTime = useCallback((dateStr: string) => {
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
  }, []);

  const getNotificationIcon = useCallback((type: string) => {
    const iconMap: Record<string, React.ComponentType<any>> = {
      ORDER_CREATED: ShoppingCart,
      ORDER_PAID: CreditCard,
      ORDER_CONFIRMED: CheckCircle2,
      ORDER_SHIPPED: Truck,
      ORDER_DELIVERED: Package,
      ORDER_CANCELLED: XCircle,
      ORDER_STATUS_CHANGED: RefreshCw,
      NEW_PRODUCT: Package2,
      LOW_STOCK: AlertTriangle,
      OUT_OF_STOCK: AlertTriangle,
      STOCK_RESTOCKED: Package,
      NEW_MESSAGE: MessageSquare,
      SYSTEM: Info,
      PROMOTION: Star,
      CUSTOMER_REGISTERED: UserCheck,
      DELIVERY_STARTED: Truck,
      DELIVERY_COMPLETED: CheckCircle2,
      PAYMENT_RECEIVED: DollarSign,
      COUPON_USED: Percent,
      WAREHOUSE_ALERT: Warehouse,
      PRICE_CHANGE: TrendingUp,
    };
    return iconMap[type] || Info;
  }, []);

  const getNotificationColor = useCallback((type: string) => {
    const colorMap: Record<string, string> = {
      ORDER_CREATED: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      ORDER_PAID: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      ORDER_CONFIRMED: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      ORDER_SHIPPED: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      ORDER_DELIVERED: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      ORDER_CANCELLED: "text-red-500 bg-red-500/10 border-red-500/20",
      ORDER_STATUS_CHANGED: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      NEW_PRODUCT: "text-purple-500 bg-purple-500/10 border-purple-500/20",
      LOW_STOCK: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      OUT_OF_STOCK: "text-red-500 bg-red-500/10 border-red-500/20",
      STOCK_RESTOCKED: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      NEW_MESSAGE: "text-violet-500 bg-violet-500/10 border-violet-500/20",
      SYSTEM: "text-slate-400 bg-slate-500/10 border-slate-500/20",
      PROMOTION: "text-pink-500 bg-pink-500/10 border-pink-500/20",
      CUSTOMER_REGISTERED: "text-teal-500 bg-teal-500/10 border-teal-500/20",
      DELIVERY_STARTED: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
      DELIVERY_COMPLETED: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      PAYMENT_RECEIVED: "text-green-500 bg-green-500/10 border-green-500/20",
      COUPON_USED: "text-orange-500 bg-orange-500/10 border-orange-500/20",
      WAREHOUSE_ALERT: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      PRICE_CHANGE: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    };
    return colorMap[type] || "text-slate-400 bg-slate-500/10 border-slate-500/20";
  }, []);

  const getNotificationLink = useCallback((notification: any) => {
    const refType = notification.refType;
    const refId = notification.refId;
    if (refType === 'ORDER' && refId) return `/admin/orders/${refId}`;
    if (refType === 'PRODUCT' && refId) return `/admin/products/${refId}`;
    if (refType === 'MESSAGE') return '/admin/whatsapp/inbox';
    if (refType === 'USER' && refId) return `/admin/users/${refId}`;
    if (refType === 'COUPON') return '/admin/promotions';
    return null;
  }, []);

  const handleNotificationClick = useCallback(async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    const link = getNotificationLink(notification);
    if (link) {
      onClose();
      window.location.href = link;
    }
  }, [markAsRead, getNotificationLink, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-[380px] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-slate-800">Bildirişlər</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full">
              {unreadCount} yeni
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-slate-500 hover:text-emerald-600 transition-colors px-2 py-0.5 rounded hover:bg-slate-50"
            >
              Hamısını oxu
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto overscroll-contain">
        {isLoading ? (
          <div className="py-10 text-center">
            <div className="w-8 h-8 mx-auto border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-2" />
            <p className="text-[13px] text-slate-500">Yüklənir...</p>
          </div>
        ) : isError ? (
          <div className="py-10 text-center px-4">
            <XCircle className="w-10 h-10 mx-auto text-red-500/60 mb-3" />
            <p className="text-[13px] text-slate-400 mb-1">Bildirişlər yüklənərkən xəta baş verdi</p>
            <button
              onClick={handleRetry}
              className="text-[12px] text-emerald-500 hover:text-emerald-600 transition-colors mt-2 flex items-center justify-center gap-1.5 mx-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Yenidən cəhd et
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <p className="text-[13px] text-slate-500">Bildiriş yoxdur</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Yeni bildirişlər burada görünəcək</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);
            const link = getNotificationLink(notification);
            const timeAgo = formatTime(notification.createdAt);

            return (
              <div
                key={notification.id}
                className={`relative flex gap-3 px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !notification.isRead ? "bg-slate-50" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {!notification.isRead && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                )}

                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-[12px] font-semibold leading-snug ${notification.isRead ? "text-slate-400" : "text-slate-800"}`}>
                      {notification.title}
                    </p>
                    {link && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400">{timeAgo}</span>
                    {notification.refType && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium uppercase tracking-wide">
                        {notification.refType}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(notification.id);
                  }}
                  className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex-shrink-0 mt-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {notifications.length > 0 && (
        <div className="border-t border-slate-100">
          <Link
            href="/admin/notifications"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 py-3 text-[12px] text-slate-500 hover:text-emerald-600 transition-colors"
          >
            Bütün bildirişlər <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// TopHeader Component
// ============================================================
function TopHeader({ onMenuClick, onSearchTrigger }: { onMenuClick: () => void; onSearchTrigger: () => void }) {
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { time, date } = useClock();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.slice(1).map((s, i) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 2).join("/"),
  }));

  return (
    <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-5 flex-shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[12px]">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
          </Link>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <Link
                href={c.href}
                className={i === crumbs.length - 1 ? "text-slate-800 font-semibold" : "text-slate-400 hover:text-slate-600"}
              >
                {c.label}
              </Link>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="hidden xl:flex flex-col items-end mr-2">
          <span className="text-[12px] font-mono font-semibold text-slate-800 tabular-nums">{time}</span>
          <span className="text-[10px] text-slate-400 capitalize">{date}</span>
        </div>

        <button
          onClick={onSearchTrigger}
          className="flex items-center gap-2 pl-3 pr-2 h-9 rounded-xl bg-slate-100 border border-transparent text-slate-400 hover:text-slate-700 text-[12px] w-36 md:w-48"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">Axtarış...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono text-slate-400 shadow-sm">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white" />
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center px-1 border-2 border-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

// ============================================================
// Sidebar Component – Dinamik saylar ilə
// ============================================================
function Sidebar({ open, onClose, collapsed, toggleCollapse }: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const counts = useNavigationCounts();

  const isActive = useCallback(
    (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(href + "/")),
    [pathname]
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 264 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col bg-white border-r border-slate-200 shadow-2xl lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center justify-between px-3 border-b border-slate-100 flex-shrink-0">
          {!collapsed ? (
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Leaf className="w-[18px] h-[18px] text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-800 tracking-tight leading-none">Organik Gədəbəy</p>
                <p className="text-[9px] text-emerald-500 font-semibold uppercase tracking-[0.15em] mt-0.5">Admin Panel</p>
              </div>
            </Link>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
                <Leaf className="w-[18px] h-[18px] text-white" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={toggleCollapse}
              className="hidden lg:flex w-6 h-6 rounded-md items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1 scrollbar-none">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx}>
              {!collapsed && (
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.18em] px-2 py-1.5 mb-0.5">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="h-px bg-slate-100 mx-1 my-2" />}

              <ul className="space-y-0.5">
                {group.items.map((item: any, idx: number) => {
                  const active = isActive(item.href ?? "");
                  const badgeValue = item.badgeKey ? counts[item.badgeKey] : undefined;
                  return (
                    <li key={idx}>
                      <Link
                        href={item.href ?? "#"}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        className={[
                          "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 relative group",
                          collapsed ? "justify-center" : "",
                          active
                            ? "text-emerald-500 bg-gradient-to-r from-emerald-500/[0.12] to-teal-500/[0.06]"
                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {active && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-500 rounded-full"
                          />
                        )}
                        <span className={`w-4 h-4 flex-shrink-0 ${active ? "text-emerald-500" : "text-slate-400"}`}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {badgeValue !== undefined && badgeValue > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 min-w-[18px] text-center">
                                {badgeValue}
                              </span>
                            )}
                          </>
                        )}
                        {collapsed && (
                          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white border border-slate-200 text-slate-800 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-[60] whitespace-nowrap">
                            {item.label}
                            {badgeValue !== undefined && badgeValue > 0 && (
                              <span className="ml-2 bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px]">
                                {badgeValue}
                              </span>
                            )}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white" />
                          </div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User panel */}
        <div className="flex-shrink-0 p-2 border-t border-slate-100 bg-slate-50">
          {!collapsed ? (
            <div className="bg-white border border-slate-200 rounded-xl p-2.5 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[11px] font-black">
                    {user?.firstName ? user.firstName.slice(0, 2).toUpperCase() : "AD"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-slate-800 truncate">{user?.firstName ? `${user.firstName} ${user.lastName ?? ''}` : "Admin"}</p>
                  <p className="text-[10px] text-emerald-600 font-medium truncate">{user?.email ?? ""}</p>
                </div>
                <Link href="/admin/settings" className="w-6 h-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600">
                  <Settings className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[11px] font-black">
                {user?.firstName ? user.firstName.slice(0, 2).toUpperCase() : "AD"}
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all text-slate-500 hover:text-red-500 hover:bg-red-50 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className={`w-3.5 h-3.5 flex-shrink-0 ${loggingOut ? "animate-spin" : ""}`} />
            {!collapsed && <span>{loggingOut ? "Çıxılır..." : "Sistemdən Çıx"}</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}

// ============================================================
// Mobile Bottom Nav (da tünd rejim silindi)
// ============================================================
function MobileBottomNav() {
  const pathname = usePathname();
  const links = [
    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Panel" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Sifarişlər" },
    { href: "/admin/products", icon: Package, label: "Məhsullar" },
    { href: "/admin/users", icon: Users, label: "İstifadəçilər" },
    { href: "/admin/settings", icon: Settings, label: "Ayarlar" },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map(l => {
          const active = isActive(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${active ? "text-emerald-500" : "text-slate-400"}`}
            >
              <l.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{l.label}</span>
              {active && <div className="w-1 h-1 bg-emerald-500 rounded-full" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ============================================================
// Clock Hook
// ============================================================
function useClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("az-AZ", { weekday: "short", day: "numeric", month: "short" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return { time, date };
}

// ============================================================
// Loading Screen
// ============================================================
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-[200]">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/20 blur-xl scale-150 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Organik Gədəbəy</p>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 bg-emerald-500 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Main Export – NotificationProvider ilə sarınmış
// ============================================================
export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { loading } = useAdminAuth();
  const pathname = usePathname();

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved !== null) setCollapsed(saved === "true");
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem("admin_sidebar_collapsed", String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(o => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden antialiased">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} toggleCollapse={toggleCollapse} />

        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <TopHeader onMenuClick={() => setSidebarOpen(true)} onSearchTrigger={() => setSearchOpen(true)} />

          <main className="flex-1 overflow-y-auto bg-slate-50 pb-16 lg:pb-0">
            <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full min-h-full">
              {children}
            </div>
          </main>
        </div>

        <MobileBottomNav />
      </div>
    </NotificationProvider>
  );
}