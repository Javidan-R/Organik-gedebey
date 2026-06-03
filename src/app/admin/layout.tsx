'use client';

import React, { useState, useTransition, ReactNode, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, LayoutDashboard, ShoppingCart, ClipboardList, Warehouse,
  AlertTriangle, WalletCards, LineChart, PackageSearch, Grid2X2,
  LogOut, Menu, X, UserCircle, ChevronDown, TrendingUp, MessageSquare,
  Sun, Moon, Settings, Bell, Search, HelpCircle, Zap, CalendarDaysIcon,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// =========================================================
// NAV DATA (əvvəlki ilə eyni)
// =========================================================
type NavItemBase = {
  id: string;
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number | string;
};

type NavItem =
  | (NavItemBase & { type: 'link' })
  | (NavItemBase & { type: 'group-title'; groupId: string })
  | (NavItemBase & { type: 'group-link'; groupId: string });

const navItems: NavItem[] = [
  { id: 'dash', href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, type: 'link' },
  { id: 'products', href: '/admin/products', label: 'Məhsullar', icon: <PackageSearch className="w-4 h-4" />, type: 'group-link', groupId: 'inventory' },
  { id: 'fresh-today', href: '/admin/fresh-today', label: 'Bugün Gələnlər', icon: <CalendarDaysIcon className="w-4 h-4" />, type: 'group-link', groupId: 'fresh-today' },
  { id: 'sales-group-title', href: '#', label: 'Satış & Sifarişlər', icon: <ShoppingCart className="w-4 h-4" />, type: 'group-title', groupId: 'sales' },
  { id: 'orders', href: '/admin/orders', label: 'Bütün Sifarişlər', icon: <ClipboardList className="w-4 h-4" />, type: 'group-link', groupId: 'sales', badge: 3 },
  { id: 'new-sale', href: '/admin/sales/new', label: 'Satış qeydiyyatı', icon: <ClipboardList className="w-4 h-4" />, type: 'group-link', groupId: 'sales' },
  { id: 'whatsapp', href: '/admin/whatsapp/inbox', label: 'Whatsapp Inbox', icon: <MessageSquare className="w-4 h-4" />, type: 'group-link', groupId: 'sales' },
  { id: 'categories', href: '/admin/categories', label: 'Kateqoriyalar', icon: <Grid2X2 className="w-4 h-4" />, type: 'group-link', groupId: 'inventory' },
  { id: 'inventory-group-title', href: '#', label: 'Stok & Məhsul', icon: <Warehouse className="w-4 h-4" />, type: 'group-title', groupId: 'inventory' },
  { id: 'intake', href: '/admin/inventory/intake', label: 'Mal qəbulu', icon: <Warehouse className="w-4 h-4" />, type: 'group-link', groupId: 'inventory' },
  { id: 'spoilage', href: '/admin/inventory/spoilage', label: 'Xarab olma', icon: <AlertTriangle className="w-4 h-4" />, type: 'group-link', groupId: 'inventory' },
  { id: 'finance-group-title', href: '#', label: 'Maliyyə & Analitika', icon: <LineChart className="w-4 h-4" />, type: 'group-title', groupId: 'finance' },
  { id: 'fin-overview', href: '/admin/finance', label: 'Ümumi Maliyyə', icon: <WalletCards className="w-4 h-4" />, type: 'group-link', groupId: 'finance' },
  { id: 'expenses', href: '/admin/expenses', label: 'Xərclər', icon: <WalletCards className="w-4 h-4" />, type: 'group-link', groupId: 'finance' },
  { id: 'daily-sum', href: '/admin/summary/daily', label: 'Günlük Hesabat', icon: <TrendingUp className="w-4 h-4" />, type: 'group-link', groupId: 'finance' },
  { id: 'settings', href: '/admin/settings', label: 'Tənzimləmələr', icon: <Settings className="w-4 h-4" />, type: 'link' },
];

// =========================================================
// SUB-COMPONENTS
// =========================================================
const NavLink = ({ item, active, variant, onClick }: any) => {
  const isDark = variant === 'desktop';
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'text-white font-bold'
          : isDark
          ? 'text-slate-300 hover:text-white'
          : 'text-slate-700 hover:text-emerald-800'
      } ${active && isDark ? 'shadow-lg shadow-emerald-600/30' : ''}`}
    >
      {active && isDark && (
        <motion.div
          layoutId="active-nav-pill"
          className="absolute inset-0 rounded-xl bg-emerald-600"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <motion.span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-lg text-sm transition-colors duration-200 ${
          active ? 'text-white' : isDark ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-emerald-600 group-hover:text-emerald-700'
        }`}
        whileHover={{ scale: active ? 1.05 : 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {item.icon}
      </motion.span>
      <span className="relative z-10 truncate">{item.label}</span>
      {item.badge && (
        <motion.span
          className="relative z-10 ml-auto min-w-5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {item.badge}
        </motion.span>
      )}
    </Link>
  );
};

const NavRenderer = ({ variant, pathname, activeGroups, toggleGroup, onLinkClick }: any) => (
  <nav className="flex flex-col gap-1 overflow-y-auto pr-1">
    <AnimatePresence initial={false}>
      {navItems.map((item) => {
        const active = item.type !== 'group-title' && item.href !== '#' && pathname?.startsWith(item.href);
        if (item.type === 'group-title') {
          const isOpen = activeGroups[item.groupId] ?? true;
          return (
            <motion.button
              key={item.id}
              onClick={() => toggleGroup(item.groupId)}
              className={`mt-4 mb-1 flex w-full items-center justify-between px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                variant === 'desktop' ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center gap-2">{item.icon}{item.label}</span>
              <motion.div animate={{ rotate: isOpen ? 0 : -90 }}><ChevronDown className="w-4 h-4" /></motion.div>
            </motion.button>
          );
        }
        if (item.type === 'group-link' && !(activeGroups[item.groupId] ?? true)) return null;
        return (
          <motion.div key={item.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.2 }} className="pl-3">
            <NavLink item={item} active={!!active} variant={variant} onClick={onLinkClick} />
          </motion.div>
        );
      })}
    </AnimatePresence>
  </nav>
);

const AdminHeader = ({ theme, toggleTheme, userName, userRole }: any) => {
  const [search, setSearch] = useState('');
  const router = useRouter();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/admin/search?q=${encodeURIComponent(search)}`);
  };
  return (
    <header className="sticky top-0 z-30 hidden items-center gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-md px-8 py-3 shadow-md md:flex">
      <form onSubmit={handleSearch} className="flex-1">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 shadow-inner">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Dashboard, Sifarişlər, Müştərilər arasında axtar..."
            className="w-full bg-transparent px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </form>
      <div className="flex items-center gap-3">
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 shadow-sm hover:bg-slate-100">
          <HelpCircle className="h-5 w-5" />
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 shadow-sm hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-rose-500" />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-md">
          <UserCircle className="h-7 w-7 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-slate-800">{userName || 'Admin'}</p>
            <p className="text-xs text-slate-500">{userRole || 'İdarəçi'}</p>
          </div>
        </div>
        <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100">
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
};

const LogoutButton = ({ pending, onLogout, isMobile = false }: { pending: boolean; onLogout: () => void; isMobile?: boolean }) => (
  <motion.button
    onClick={onLogout}
    disabled={pending}
    className={`flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
      isMobile
        ? 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 shadow-md'
        : 'bg-slate-700 text-slate-200 hover:bg-rose-600 hover:text-white shadow-lg'
    } ${pending ? 'opacity-70 cursor-wait' : ''}`}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <LogOut className="h-4 w-4" /> {pending ? 'Çıxılır…' : 'Çıxış'}
  </motion.button>
);

// =========================================================
// MAIN LAYOUT (NextAuth-dan tamamilə təmizlənmiş)
// =========================================================
export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('admin-theme', 'light');
  const [activeGroups, setActiveGroups] = useState<Record<string, boolean>>({
    sales: true, inventory: true, finance: true, 'fresh-today': true,
  });
  const [adminReady, setAdminReady] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>('Admin');
  const [userRole, setUserRole] = useState<string>('admin');

  // Real-time sync (store)
  const startRealtimeSync = useApp((state) => state.startRealtimeSync);
  const stopRealtimeSync = useApp((state) => state.stopRealtimeSync);
  useEffect(() => {
    startRealtimeSync();
    return () => stopRealtimeSync();
  }, [startRealtimeSync, stopRealtimeSync]);

  // Auth yoxlaması (cookie əsaslı)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) throw new Error('Not authenticated');
        const data = await res.json();
        const role = data?.user?.role?.toLowerCase();
        const ok = role === 'admin' || role === 'superadmin';
        setAdminReady(ok);
        if (ok) {
          setUserName(data.user.name || 'Admin');
          setUserRole(data.user.role || 'admin');
          if (pathname === '/admin/login') {
            router.replace('/admin/dashboard');
          }
        } else {
          if (pathname !== '/admin/login') {
            router.replace('/admin/login');
          } else {
            setAdminReady(false);
          }
        }
      } catch {
        setAdminReady(false);
        if (pathname !== '/admin/login') {
          router.replace('/admin/login');
        }
      }
    };
    checkAuth();
  }, [router, pathname]);

  const toggleGroup = useCallback((groupId: string) => {
    setActiveGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const logout = useCallback(() => {
    startTransition(async () => {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      router.push('/admin/login');
    });
  }, [router]);

  // Yüklənmə və ya login səhifəsi
  if (adminReady === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (pathname === '/admin/login') return <>{children}</>;
  if (adminReady !== true) return null; // icazəsiz (redirekt ediləcək)

  const mainBg = theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/90';
  const mainText = theme === 'light' ? 'text-slate-900' : 'text-slate-100';

  return (
    <div className={`min-h-screen ${mainBg} ${mainText}`}>
      <div className="grid min-h-screen md:grid-cols-[17.5rem_1fr]">
        {/* DESKTOP SIDEBAR */}
        <motion.aside
          className="relative hidden border-r border-slate-800 bg-slate-900 px-4 py-6 shadow-2xl md:flex md:flex-col md:sticky md:top-0 md:h-screen"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-xl">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Organik Gədəbəy</p>
                <p className="text-base font-extrabold text-white">Admin Panel</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-700/50 px-3 py-0.5 text-[10px] font-medium text-emerald-300">🌿 Pro</span>
          </div>
          <div className="mt-4 flex-1 overflow-y-auto">
            <NavRenderer variant="desktop" pathname={pathname} activeGroups={activeGroups} toggleGroup={toggleGroup} />
          </div>
          <div className="mt-auto border-t border-slate-800/50 pt-4">
            <div className="flex items-center justify-between text-slate-200">
              <div className="flex items-center gap-2">
                <UserCircle className="h-6 w-6 text-emerald-400" />
                <div><p className="text-sm font-semibold">{userName}</p><p className="text-xs text-slate-400">{userRole}</p></div>
              </div>
            </div>
            <div className="mt-4"><LogoutButton pending={pending} onLogout={logout} /></div>
          </div>
        </motion.aside>

        {/* SAĞ TƏRƏF */}
        <div className="flex flex-col">
          <AdminHeader theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} userName={userName} userRole={userRole} />

          {/* Mobil header */}
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-3 shadow-md md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-md"><Leaf className="h-4 w-4" /></div>
              <p className="text-base font-extrabold text-slate-900">Admin Panel</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm">
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-md">
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>

          {/* Mobil sidebar drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <>
                <motion.div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
                <motion.aside
                  className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-100'} p-5 shadow-2xl md:hidden`}
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className={`flex items-center justify-between pb-3 ${theme === 'light' ? 'border-b border-emerald-100' : 'border-b border-slate-700'}`}>
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-md"><Leaf className="h-4 w-4" /></div>
                      <div><p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Organik Gədəbəy</p><p className="text-sm font-extrabold">Admin Panel</p></div>
                    </div>
                    <button onClick={() => setMobileOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="mt-4 flex-1 overflow-y-auto">
                    <NavRenderer variant="mobile" pathname={pathname} activeGroups={activeGroups} toggleGroup={toggleGroup} onLinkClick={() => setMobileOpen(false)} />
                  </div>
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-800 shadow-inner">
                    <p className="mb-1 font-bold flex items-center gap-1"><ClipboardList className="h-3 w-3" /> Satış qeydiyyatı</p>
                    <p>Yeni satışları dərhal qeydiyyatdan keçirin ki, stoklar anında yenilənsin.</p>
                  </div>
                  <div className="mt-3"><LogoutButton pending={pending} onLogout={logout} isMobile /></div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          <motion.main className={`flex-1 relative min-h-[calc(100vh-3.5rem)] px-4 pb-8 pt-6 md:px-8 md:pt-8 ${mainBg} ${mainText} transition-colors duration-300`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}