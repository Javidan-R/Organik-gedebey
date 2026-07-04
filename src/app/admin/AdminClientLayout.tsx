// src/app/admin/AdminClientLayout.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LogOut, LayoutDashboard, Package, Users, Settings,
  ChevronRight, Bell, Search, Menu, X, Leaf,
  BarChart3, ShoppingCart, Tag, Truck, Shield,
  ChevronDown, Sun, Moon, TrendingUp, Warehouse,
  DollarSign, MessageSquare, FileText, Mail, Percent,
  MapPin, UserCheck, RefreshCw, Plus, CheckCircle2,
  AlertTriangle, Zap, Clock, Star, ArrowUpRight,
  Hash, Command, Home, Inbox, Activity, Package2,
  CreditCard, PieChart, Globe, Layers, Sparkles,
  ArrowRight, Info, XCircle, LineChart, UserRoundCheck,
  BookOpen, ClipboardList, PackageSearch, Grid2X2,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
type NavItemBase = {
  id: string;
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

type NavItemLink = NavItemBase & { type: "link" };
type NavItemGroupTitle = NavItemBase & { type: "group-title"; groupId: string };
type NavItemGroupLink = NavItemBase & { type: "group-link"; groupId: string };

type NavItem = NavItemLink | NavItemGroupTitle | NavItemGroupLink;

type Notification = {
  id: string;
  type: "warning" | "success" | "info" | "error";
  title: string;
  desc: string;
  time: string;
  read: boolean;
};

// ═══════════════════════════════════════════════════════════════
// Navigation Items
// ═══════════════════════════════════════════════════════════════
const navItems: NavItem[] = [
  { id: "dash", href: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, type: "link" },
  { id: "fresh-today", href: "/admin/fresh-today", label: "Bugün Gələnlər", icon: <Calendar className="w-4 h-4" />, type: "group-link", groupId: "fresh-today" },
  { id: "sales-group-title", href: "#", label: "Satış & Sifarişlər", icon: <ShoppingCart className="w-4 h-4" />, type: "group-title", groupId: "sales" },
  { id: "orders", href: "/admin/orders", label: "Bütün Sifarişlər", icon: <ClipboardList className="w-4 h-4" />, type: "group-link", groupId: "sales", badge: 3 },
  { id: "new-sale", href: "/admin/sales/new", label: "Satış qeydiyyatı", icon: <ClipboardList className="w-4 h-4" />, type: "group-link", groupId: "sales" },
  { id: "whatsapp", href: "/admin/whatsapp/inbox", label: "Whatsapp Inbox", icon: <MessageSquare className="w-4 h-4" />, type: "group-link", groupId: "sales" },
  { id: "inventory-group-title", href: "#", label: "Stok & Məhsul", icon: <Warehouse className="w-4 h-4" />, type: "group-title", groupId: "inventory" },
  { id: "products", href: "/admin/products", label: "Məhsullar", icon: <PackageSearch className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "categories", href: "/admin/categories", label: "Kateqoriyalar", icon: <Grid2X2 className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "baskets", href: "/admin/baskets", label: "Səbətlər", icon: <ClipboardList className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "hero", href: "/admin/settings/hero", label: "Önə Çıxanlar", icon: <ClipboardList className="w-4 h-4" />, type: "group-link", groupId: "fresh-today" },
  { id: "intake", href: "/admin/inventory/intake", label: "Mal qəbulu", icon: <Warehouse className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "spoilage", href: "/admin/inventory/spoilage", label: "Xarab olma", icon: <AlertTriangle className="w-4 h-4" />, type: "group-link", groupId: "inventory" },
  { id: "finance-group-title", href: "#", label: "Maliyyə & Analitika", icon: <LineChart className="w-4 h-4" />, type: "group-title", groupId: "finance" },
  { id: "fin-overview", href: "/admin/finance", label: "Ümumi Maliyyə", icon: <CreditCard className="w-4 h-4" />, type: "group-link", groupId: "finance" },
  { id: "expenses", href: "/admin/expenses", label: "Xərclər", icon: <CreditCard className="w-4 h-4" />, type: "group-link", groupId: "finance" },
  { id: "daily-sum", href: "/admin/summary/daily", label: "Günlük Hesabat", icon: <TrendingUp className="w-4 h-4" />, type: "group-link", groupId: "finance" },
  { id: "users", href: "/admin/users", label: "İstifadəçilər", icon: <UserRoundCheck className="w-4 h-4" />, type: "link" },
  { id: "about-us", href: "/admin/about-us", label: "Haqqımızda", icon: <BookOpen className="w-4 h-4" />, type: "link" },
  { id: "settings", href: "/admin/settings", label: "Tənzimləmələr", icon: <Settings className="w-4 h-4" />, type: "link" },
];

// ═══════════════════════════════════════════════════════════════
// Build Nav Groups
// ═══════════════════════════════════════════════════════════════
function buildNavGroups(items: NavItem[]) {
  const groups: { label: string; items: any[] }[] = [];
  const standalone: any[] = [];
  let currentGroup: any = null;

  items.forEach(item => {
    if (item.type === "group-title") {
      currentGroup = { label: item.label, items: [] };
      groups.push(currentGroup);
    } else if (item.type === "group-link" && currentGroup) {
      currentGroup.items.push({ href: item.href, label: item.label, icon: item.icon, badge: item.badge });
    } else if (item.type === "link") {
      standalone.push({ href: item.href, label: item.label, icon: item.icon, badge: item.badge });
    } else if (item.type === "group-link" && !currentGroup) {
      standalone.push({ href: item.href, label: item.label, icon: item.icon, badge: item.badge });
    }
  });

  if (standalone.length) {
    groups.unshift({ label: "Əsas", items: standalone });
  }

  return groups;
}

const navGroups = buildNavGroups(navItems);

// ═══════════════════════════════════════════════════════════════
// Hooks
// ═══════════════════════════════════════════════════════════════

/** Real notifications from API */
function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/notifications", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.notifications) {
          setNotifications(data.notifications);
        } else {
          setNotifications([]);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const markAll = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await fetch("/api/notifications/mark-all-read", { method: "POST", credentials: "include" });
  };
  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    fetch(`/api/notifications/${id}/dismiss`, { method: "DELETE", credentials: "include" });
  };

  return { notifications, loading, error, unreadCount, markAll, dismiss };
}

/** Live clock */
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

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════
const notifIcon: Record<string, React.ComponentType<any>> = {
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  error: XCircle,
};
const notifColor: Record<string, string> = {
  warning: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  success: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  info: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  error: "text-red-500 bg-red-500/10 border-red-500/20",
};

// ═══════════════════════════════════════════════════════════════
// Sidebar Component
// ═══════════════════════════════════════════════════════════════
function Sidebar({ open, onClose, collapsed, toggleCollapse }: {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  toggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAdminAuth();
  const [loggingOut, setLoggingOut] = useState(false);

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
        className={`fixed top-0 left-0 h-screen z-50 flex flex-col bg-slate-950 border-r border-white/[0.06] shadow-2xl lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="h-[60px] flex items-center justify-between px-3 border-b border-white/[0.06] flex-shrink-0">
          {!collapsed ? (
            <Link href="/admin/dashboard" className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Leaf className="w-[18px] h-[18px] text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-white tracking-tight leading-none">Organik Gədəbəy</p>
                <p className="text-[9px] text-emerald-400/70 font-semibold uppercase tracking-[0.15em] mt-0.5">Admin Panel</p>
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
              className="hidden lg:flex w-6 h-6 rounded-md items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
            >
              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="lg:hidden w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300"
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
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.18em] px-2 py-1.5 mb-0.5">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="h-px bg-white/[0.04] mx-1 my-2" />}

              <ul className="space-y-0.5">
                {group.items.map((item: any, idx: number) => {
                  const active = isActive(item.href ?? "");
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
                            ? "text-emerald-400 bg-gradient-to-r from-emerald-500/[0.12] to-teal-500/[0.06]"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]",
                        ].join(" ")}
                      >
                        {active && (
                          <motion.div
                            layoutId="activeNav"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-emerald-400 rounded-full"
                          />
                        )}
                        <span className={`w-4 h-4 flex-shrink-0 ${active ? "text-emerald-400" : "text-slate-500"}`}>
                          {item.icon}
                        </span>
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.badge && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 min-w-[18px] text-center">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {collapsed && (
                          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 border border-white/[0.08] text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl z-[60] whitespace-nowrap">
                            {item.label}
                            {item.badge && (
                              <span className="ml-2 bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[9px]">
                                {item.badge}
                              </span>
                            )}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
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
        <div className="flex-shrink-0 p-2 border-t border-white/[0.06] bg-black/20">
          {!collapsed ? (
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-2.5 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[11px] font-black">
                    {user?.firstName ? user.firstName.slice(0, 2).toUpperCase() : "AD"}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-white truncate">{user?.firstName ? `${user.firstName} ${user.lastName ?? ''}` : "Admin"}</p>
                  <p className="text-[10px] text-emerald-400/80 font-medium truncate">{user?.email ?? ""}</p>
                </div>
                <Link href="/admin/settings" className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-slate-300">
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
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06] ${
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

// ═══════════════════════════════════════════════════════════════
// Notifications Panel Component
// ═══════════════════════════════════════════════════════════════
function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, loading, error, unreadCount, markAll, dismiss } = useNotifications();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-[340px] bg-slate-900 border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-white">Bildirişlər</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">
              {unreadCount} yeni
            </span>
          )}
        </div>
        <button onClick={markAll} className="text-[11px] text-slate-500 hover:text-emerald-400 transition-colors">
          Hamısını oxu
        </button>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {loading && (
          <div className="py-10 text-center text-[13px] text-slate-500">
            <Clock className="w-8 h-8 mx-auto text-slate-700 animate-spin mb-2" />
            Yüklənir...
          </div>
        )}
        {error && (
          <div className="py-10 text-center text-[13px] text-red-400">
            <XCircle className="w-8 h-8 mx-auto mb-2" />
            Xəta baş verdi
          </div>
        )}
        {!loading && !error && notifications.length === 0 && (
          <div className="py-10 text-center text-[13px] text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto text-slate-700 mb-2" />
            Bildiriş yoxdur
          </div>
        )}
        {notifications.map(n => {
          const Icon = notifIcon[n.type] || Info;
          return (
            <div
              key={n.id}
              className={`relative flex gap-3 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] ${
                !n.read ? "bg-white/[0.02]" : ""
              }`}
            >
              {!n.read && (
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-emerald-400 rounded-full" />
              )}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${notifColor[n.type] || ""}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-semibold leading-snug ${n.read ? "text-slate-400" : "text-white"}`}>
                  {n.title}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.desc}</p>
                <p className="text-[10px] text-slate-600 mt-1">{n.time}</p>
              </div>
              <button
                onClick={() => dismiss(n.id)}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-700 hover:text-slate-400 hover:bg-white/[0.06] mt-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      <Link
        href="/admin/notifications"
        onClick={onClose}
        className="flex items-center justify-center gap-1.5 py-3 text-[12px] text-slate-500 hover:text-emerald-400 border-t border-white/[0.06]"
      >
        Bütün bildirişlər <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Top Header Component
// ═══════════════════════════════════════════════════════════════
function TopHeader({ onMenuClick, onSearchTrigger }: { onMenuClick: () => void; onSearchTrigger: () => void }) {
  const pathname = usePathname();
  const [darkMode, setDarkMode] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { time, date } = useClock();
  const { unreadCount } = useNotifications();

  useEffect(() => {
    const stored = localStorage.getItem("admin_theme");
    const isDark = stored ? stored === "dark" : true;
    setDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("admin_theme", next ? "dark" : "light");
  };

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.slice(1).map((s, i) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 2).join("/"),
  }));

  return (
    <header className="h-[60px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between px-4 lg:px-5 flex-shrink-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/[0.1]"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        <div className="hidden md:flex items-center gap-1.5 text-[12px]">
          <Link href="/admin/dashboard" className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
          </Link>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-700" />
              <Link
                href={c.href}
                className={i === crumbs.length - 1 ? "text-slate-800 dark:text-white font-semibold" : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}
              >
                {c.label}
              </Link>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="hidden xl:flex flex-col items-end mr-2">
          <span className="text-[12px] font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{time}</span>
          <span className="text-[10px] text-slate-400 capitalize">{date}</span>
        </div>

        <button
          onClick={onSearchTrigger}
          className="flex items-center gap-2 pl-3 pr-2 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-transparent dark:border-white/[0.04] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[12px] w-36 md:w-48"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="flex-1 text-left">Axtarış...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] rounded text-[9px] font-mono text-slate-400 shadow-sm">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        <button
          onClick={toggleDark}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(o => !o)}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
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

// ═══════════════════════════════════════════════════════════════
// Mobile Bottom Nav
// ═══════════════════════════════════════════════════════════════
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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/[0.06] safe-area-pb">
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

// ═══════════════════════════════════════════════════════════════
// Loading Screen
// ═══════════════════════════════════════════════════════════════
function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-[200]">
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

// ═══════════════════════════════════════════════════════════════
// Main Export
// ═══════════════════════════════════════════════════════════════
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

  // Keyboard shortcut
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden antialiased">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} toggleCollapse={toggleCollapse} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopHeader onMenuClick={() => setSidebarOpen(true)} onSearchTrigger={() => setSearchOpen(true)} />

        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-16 lg:pb-0">
          <div className="p-4 md:p-6 max-w-[1600px] mx-auto w-full min-h-full">
            {children}
          </div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}