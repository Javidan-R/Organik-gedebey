// src/app/admin/layout.tsx
'use client';

import React, {
  useState,
  useTransition,
  ReactNode,
  useCallback,
} from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Warehouse,
  AlertTriangle,
  WalletCards,
  LineChart,
  PackageSearch,
  Grid2X2,
  LogOut,
  Menu,
  X,
  UserCircle,
  ChevronDown,
  TrendingUp,
  MessageSquare,
  Sun,
  Moon,
  Settings,
  Bell,
  Search,
  HelpCircle,
} from 'lucide-react';

// =========================================================
// 1. NAV DATA & TYPES
// =========================================================

type NavItemBase = {
  id: string;
  href: string;
  label: string;
  icon: ReactNode;
  badge?: number | string;
};

type NavItem =
  | (NavItemBase & {
      type: 'link';
    })
  | (NavItemBase & {
      type: 'group-title';
      groupId: string;
    })
  | (NavItemBase & {
      type: 'group-link';
      groupId: string;
    });

const navItems: NavItem[] = [
  {
    id: 'dash',
    href: '/admin/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-[1rem] h-[1rem]" />,
    type: 'link',
  },

  // Satış & Sifarişlər qrupu
  {
    id: 'sales-group-title',
    href: '#sales-group',
    label: 'Satış & Sifarişlər',
    icon: <ShoppingCart className="w-[1rem] h-[1rem]" />,
    type: 'group-title',
    groupId: 'sales',
  },
  {
    id: 'orders',
    href: '/admin/orders',
    label: 'Bütün Sifarişlər',
    icon: <ClipboardList className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'sales',
    badge: 3,
  },
  {
    id: 'new-sale',
    href: '/admin/sales/new',
    label: 'Satış qeydiyyatı',
    icon: <ClipboardList className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'sales',
  },
  {
    id: 'whatsapp',
    href: '/admin/whatsapp/inbox',
    label: 'Whatsapp Inbox',
    icon: <MessageSquare className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'sales',
  },

  // Stok & Məhsul qrupu
  {
    id: 'inventory-group-title',
    href: '#inventory-group',
    label: 'Stok & Məhsul',
    icon: <Warehouse className="w-[1rem] h-[1rem]" />,
    type: 'group-title',
    groupId: 'inventory',
  },
  {
    id: 'intake',
    href: '/admin/inventory/intake',
    label: 'Mal qəbulu',
    icon: <Warehouse className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'inventory',
  },
  {
    id: 'spoilage',
    href: '/admin/inventory/spoilage',
    label: 'Xarab olma',
    icon: <AlertTriangle className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'inventory',
  },
  {
    id: 'products',
    href: '/admin/products',
    label: 'Məhsullar',
    icon: <PackageSearch className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'inventory',
  },
  {
    id: 'categories',
    href: '/admin/categories',
    label: 'Kateqoriyalar',
    icon: <Grid2X2 className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'inventory',
  },

  // Maliyyə & Analitika qrupu
  {
    id: 'finance-group-title',
    href: '#finance-group',
    label: 'Maliyyə & Analitika',
    icon: <LineChart className="w-[1rem] h-[1rem]" />,
    type: 'group-title',
    groupId: 'finance',
  },
  {
    id: 'fin-overview',
    href: '/admin/finance',
    label: 'Ümumi Maliyyə',
    icon: <WalletCards className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'finance',
  },
  {
    id: 'expenses',
    href: '/admin/expenses',
    label: 'Xərclər',
    icon: <WalletCards className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'finance',
  },
  {
    id: 'daily-sum',
    href: '/admin/summary/daily',
    label: 'Günlük Hesabat',
    icon: <TrendingUp className="w-[1rem] h-[1rem]" />,
    type: 'group-link',
    groupId: 'finance',
  },

  // Tənzimləmələr
  {
    id: 'settings',
    href: '/admin/settings',
    label: 'Tənzimləmələr',
    icon: <Settings className="w-[1rem] h-[1rem]" />,
    type: 'link',
  },
];

const mockUser = {
  name: 'Super Admin',
  role: 'Şirkət Rəhbəri',
  notifications: 5,
};

// =========================================================
// 2. REUSABLE COMPONENTS (render-dən kənarda)
// =========================================================

type NavLinkProps = {
  item: NavItem;
  active: boolean;
  variant: 'desktop' | 'mobile';
  onClick?: () => void;
};

const NavLink: React.FC<NavLinkProps> = ({
  item,
  active,
  variant,
  onClick,
}) => {
  const isDark = variant === 'desktop';

  const baseClasses =
    'group relative flex w-full items-center gap-3 rounded-[0.75rem] px-[0.75rem] py-[0.625rem] text-[0.875rem] font-medium transition-all duration-200';
  const linkClasses = active
    ? 'text-white font-bold'
    : isDark
    ? 'text-slate-300 hover:text-white'
    : 'text-slate-700 hover:text-emerald-800';

  const iconClasses = active
    ? 'text-white'
    : isDark
    ? 'text-emerald-400 group-hover:text-emerald-300'
    : 'text-emerald-600 group-hover:text-emerald-700';

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`${baseClasses} ${linkClasses} ${
        active && isDark ? 'shadow-lg shadow-emerald-600/30' : ''
      }`}
    >
      {active && isDark && (
        <motion.div
          layoutId="active-nav-pill"
          className="absolute inset-0 rounded-[0.75rem] bg-emerald-600"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}

      <motion.span
        className={`relative z-10 flex h-[1.5rem] w-[1.5rem] items-center justify-center rounded-[0.5rem] text-[0.75rem] transition-colors duration-200 ${iconClasses}`}
        initial={{ scale: 1 }}
        whileHover={{ scale: active ? 1.05 : 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {item.icon}
      </motion.span>

      <span className="relative z-10 truncate">{item.label}</span>

      {item.badge && (
        <motion.span
          className="relative z-10 ml-auto min-w-[1.25rem] rounded-full bg-rose-500 px-[0.5rem] py-[0.125rem] text-[0.625rem] font-bold text-white shadow-sm"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          {item.badge}
        </motion.span>
      )}
    </Link>
  );
};

type NavRendererProps = {
  variant: 'desktop' | 'mobile';
  pathname: string;
  activeGroups: Record<string, boolean>;
  toggleGroup: (groupId: string) => void;
  onLinkClick?: () => void;
};

const NavRenderer: React.FC<NavRendererProps> = ({
  variant,
  pathname,
  activeGroups,
  toggleGroup,
  onLinkClick,
}) => {
  return (
    <nav className="flex flex-col gap-[0.25rem] text-[0.875rem] overflow-y-auto pr-[0.25rem]">
      <AnimatePresence initial={false}>
        {navItems.map((item) => {
          const active =
            item.type !== 'group-title' &&
            item.href !== '#' &&
            pathname?.startsWith(item.href);

          if (item.type === 'group-title') {
            const isOpen = activeGroups[item.groupId] ?? true;

            return (
              <motion.button
                key={item.id}
                onClick={() => toggleGroup(item.groupId)}
                className={[
                  'mt-[1rem] mb-[0.25rem] flex w-full items-center justify-between px-[0.75rem] py-[0.25rem] text-[0.75rem] font-bold uppercase tracking-[0.12em] transition-colors duration-200',
                  variant === 'desktop'
                    ? 'text-slate-500 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900',
                ].join(' ')}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="flex items-center gap-[0.5rem]">
                  {item.icon}
                  {item.label}
                </span>
                <motion.div
                  animate={{ rotate: isOpen ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-[1rem] h-[1rem]" />
                </motion.div>
              </motion.button>
            );
          }

          if (item.type === 'group-link') {
            const parentOpen = activeGroups[item.groupId] ?? true;
            if (!parentOpen) return null;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="pl-[0.75rem]"
              >
                <NavLink
                  item={item}
                  active={!!active}
                  variant={variant}
                  onClick={onLinkClick}
                />
              </motion.div>
            );
          }

          // type === 'link'
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <NavLink
                item={item}
                active={!!active}
                variant={variant}
                onClick={onLinkClick}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </nav>
  );
};

type LogoutButtonProps = {
  isMobile?: boolean;
  pending: boolean;
  logout: () => void;
};

const LogoutButton: React.FC<LogoutButtonProps> = ({
  isMobile = false,
  pending,
  logout,
}) => (
  <motion.button
    onClick={logout}
    disabled={pending}
    className={[
      'flex w-full items-center justify-center gap-[0.5rem] rounded-[0.75rem] px-[0.75rem] py-[0.625rem] text-[0.875rem] font-semibold transition-all duration-200',
      isMobile
        ? 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 shadow-md'
        : 'bg-slate-700 text-slate-200 hover:bg-rose-600 hover:text-white shadow-lg shadow-slate-900/50',
      pending ? 'opacity-70 cursor-wait' : '',
    ].join(' ')}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <LogOut className="w-[1rem] h-[1rem]" />
    <span>{pending ? 'Çıxılır…' : 'Çıxış'}</span>
  </motion.button>
);

type AdminHeaderProps = {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const AdminHeader: React.FC<AdminHeaderProps> = ({ theme, toggleTheme }) => (
  <header className="sticky top-0 z-30 hidden items-center gap-[1rem] border-b border-slate-200 bg-white/95 backdrop-blur-md px-[2rem] py-[0.75rem] shadow-md shadow-slate-100/60 md:flex">
    <div className="flex-1">
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex w-full items-center rounded-[0.75rem] border border-slate-200 bg-slate-100 px-[1rem] py-[0.5rem] shadow-inner">
          <Search className="h-[1rem] w-[1rem] text-slate-400" />
          <input
            type="text"
            placeholder="Dashboard, Sifarişlər, Müştərilər arasında axtar..."
            className="w-full bg-transparent px-[0.75rem] text-[0.875rem] text-slate-700 outline-none placeholder:text-slate-400"
          />
        </div>
      </motion.div>
    </div>

    <div className="flex items-center gap-[0.75rem]">
      <motion.button
        className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[0.75rem] bg-slate-50 text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
        whileTap={{ scale: 0.9 }}
      >
        <HelpCircle className="w-[1.25rem] h-[1.25rem]" />
      </motion.button>

      <motion.button
        className="relative flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[0.75rem] bg-slate-50 text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
        whileTap={{ scale: 0.9 }}
      >
        <Bell className="w-[1.25rem] h-[1.25rem]" />
        {mockUser.notifications > 0 && (
          <span className="absolute -right-[0.25rem] -top-[0.25rem] block h-[0.75rem] w-[0.75rem] rounded-full border-[0.125rem] border-white bg-rose-500" />
        )}
      </motion.button>

      <div className="flex items-center gap-[0.5rem] rounded-full border border-slate-200 bg-white px-[0.375rem] py-[0.25rem] shadow-md">
        <UserCircle className="w-[1.75rem] h-[1.75rem] text-emerald-600" />
        <div>
          <p className="text-[0.75rem] font-semibold text-slate-800">
            {mockUser.name}
          </p>
          <p className="text-[0.625rem] text-slate-500">{mockUser.role}</p>
        </div>
      </div>

      <motion.button
        onClick={toggleTheme}
        className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[0.75rem] text-slate-600 hover:bg-slate-100 transition-colors"
        whileTap={{ scale: 0.9 }}
        title="Temanı dəyiş"
      >
        {theme === 'light' ? (
          <Moon className="w-[1.25rem] h-[1.25rem]" />
        ) : (
          <Sun className="w-[1.25rem] h-[1.25rem]" />
        )}
      </motion.button>
    </div>
  </header>
);

// =========================================================
// 3. MAIN LAYOUT
// =========================================================

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || '';
  const [pending, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const toggleTheme = useCallback(
    () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    [],
  );

  const [activeGroups, setActiveGroups] = useState<Record<string, boolean>>({
    sales: true,
    inventory: true,
    finance: true,
  });

  const toggleGroup = useCallback((groupId: string) => {
    setActiveGroups((s) => ({ ...s, [groupId]: !s[groupId] }));
  }, []);

  const logout = useCallback(() => {
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Burada real logout + redirect edə bilərsən
      // window.location.href = '/admin/login';
    });
  }, [startTransition]);

  const mainContentBg =
    theme === 'light' ? 'bg-slate-50' : 'bg-slate-900/90';
  const mainContentText =
    theme === 'light' ? 'text-slate-900' : 'text-slate-100';

  return (
    <div className={`min-h-screen ${mainContentBg} ${mainContentText}`}>
      <div className="grid min-h-screen md:grid-cols-[17.5rem_1fr]">
        {/* DESKTOP SIDEBAR */}
        <motion.aside
          className="relative hidden border-r border-slate-800 bg-slate-900 px-[1rem] py-[1.5rem] shadow-2xl shadow-slate-900/50 md:flex md:flex-col md:sticky md:top-0 md:h-screen"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Logo / Brand */}
          <div className="flex items-center justify-between gap-[0.5rem] px-[0.25rem] pb-[1rem] border-b border-slate-700">
            <div className="flex items-center gap-[0.5rem]">
              <div className="flex h-[2.5rem] w-[2.5rem] items-center justify-center rounded-[0.75rem] bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-xl shadow-emerald-500/30">
                <Leaf className="w-[1.25rem] h-[1.25rem]" />
              </div>
              <div>
                <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-emerald-400">
                  Organik Gədəbəy
                </p>
                <p className="text-[1rem] font-extrabold text-white">
                  Admin Panel
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-700/50 px-[0.75rem] py-[0.25rem] text-[0.625rem] font-medium text-emerald-300 shadow-inner">
              🌿 Pro
            </span>
          </div>

          {/* Nav */}
          <div className="mt-[1rem] flex-1 overflow-y-auto">
            <NavRenderer
              variant="desktop"
              pathname={pathname}
              activeGroups={activeGroups}
              toggleGroup={toggleGroup}
            />
          </div>

          {/* User & Logout */}
          <div className="mt-auto pt-[1.5rem] border-t border-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[0.5rem] text-slate-200">
                <UserCircle className="w-[1.5rem] h-[1.5rem] text-emerald-400" />
                <div>
                  <p className="text-[0.875rem] font-semibold">
                    {mockUser.name}
                  </p>
                  <p className="text-[0.75rem] text-slate-400">
                    {mockUser.role}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-[1rem]">
              <LogoutButton pending={pending} logout={logout} />
            </div>
          </div>
        </motion.aside>

        {/* RIGHT: content column */}
        <div className="flex flex-col">
          {/* Desktop header */}
          <AdminHeader theme={theme} toggleTheme={toggleTheme} />

          {/* Mobile top bar */}
          <header className="sticky top-0 z-40 flex items-center justify-between gap-[0.75rem] border-b border-slate-200 bg-white/95 backdrop-blur-sm px-[1rem] py-[0.75rem] shadow-lg shadow-slate-100/60 md:hidden">
            <div className="flex items-center gap-[0.5rem]">
              <div className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[0.75rem] bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-md">
                <Leaf className="w-[1rem] h-[1rem]" />
              </div>
              <p className="text-[1rem] font-extrabold text-slate-900">
                Admin Panel
              </p>
            </div>

            <div className="flex items-center gap-[0.5rem]">
              <motion.button
                onClick={toggleTheme}
                className="inline-flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[0.75rem] border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
                whileTap={{ scale: 0.9 }}
                title="Temanı dəyiş"
              >
                {theme === 'light' ? (
                  <Moon className="w-[1.25rem] h-[1.25rem]" />
                ) : (
                  <Sun className="w-[1.25rem] h-[1.25rem]" />
                )}
              </motion.button>

              <motion.button
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[0.75rem] border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-md transition-all hover:bg-emerald-100 hover:shadow-lg"
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="w-[1.25rem] h-[1.25rem]" />
              </motion.button>
            </div>
          </header>

          {/* Mobile sidebar drawer */}
          <AnimatePresence mode="wait">
            {mobileOpen && (
              <>
                <motion.div
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileOpen(false)}
                />
                <motion.aside
                  className={`fixed inset-y-0 left-0 z-50 flex w-[17.5rem] flex-col ${
                    theme === 'light' ? 'bg-white' : 'bg-slate-800'
                  } ${
                    theme === 'light'
                      ? 'text-slate-900'
                      : 'text-slate-100'
                  } backdrop-blur-md p-[1.25rem] shadow-2xl md:hidden`}
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {/* Drawer header */}
                  <div
                    className={`flex items-center justify-between gap-[0.5rem] pb-[0.75rem] ${
                      theme === 'light'
                        ? 'border-b border-emerald-100'
                        : 'border-b border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-[0.5rem]">
                      <div className="flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[0.75rem] bg-gradient-to-br from-emerald-500 to-lime-500 text-white shadow-md">
                        <Leaf className="w-[1rem] h-[1rem]" />
                      </div>
                      <div>
                        <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-emerald-600">
                          Organik Gədəbəy
                        </p>
                        <p className="text-[0.875rem] font-extrabold">
                          Admin Panel
                        </p>
                      </div>
                    </div>

                    <motion.button
                      onClick={() => setMobileOpen(false)}
                      className={`inline-flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-[0.75rem] ${
                        theme === 'light'
                          ? 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                      } transition-colors`}
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <X className="w-[1.25rem] h-[1.25rem]" />
                    </motion.button>
                  </div>

                  <div className="mt-[1rem] flex-1 overflow-y-auto">
                    <NavRenderer
                      variant="mobile"
                      pathname={pathname}
                      activeGroups={activeGroups}
                      toggleGroup={toggleGroup}
                      onLinkClick={() => setMobileOpen(false)}
                    />
                  </div>

                  <div className="mt-[1rem] rounded-[0.75rem] border border-blue-100 bg-blue-50/70 p-[0.75rem] text-[0.6875rem] text-blue-800 shadow-inner">
                    <p className="mb-[0.25rem] font-bold flex items-center gap-[0.25rem]">
                      <ClipboardList className="w-[0.75rem] h-[0.75rem]" />
                      Satış qeydiyyatı
                    </p>
                    <p>
                      Yeni satışları dərhal qeydiyyatdan keçirin ki, stoklar
                      anında yenilənsin.
                    </p>
                  </div>

                  <div className="mt-[0.75rem]">
                    <LogoutButton
                      pending={pending}
                      logout={logout}
                      isMobile
                    />
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main content */}
          <motion.main
            className={`flex-1 relative min-h-[calc(100vh-3.5rem)] px-[1rem] pb-[2rem] pt-[1.5rem] md:px-[2rem] md:pt-[2rem] ${mainContentBg} ${mainContentText} transition-colors duration-300`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.main>
        </div>
      </div>
    </div>
  );
}
