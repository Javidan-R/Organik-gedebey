// src/components/HeaderClient.tsx
// Production-ready, tam, qısaldılmamış versiya

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  type CSSProperties,
} from 'react';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from 'framer-motion';
import {
  Search,
  ShoppingCart,
  User,
  X,
  ChevronRight,
  ChevronDown,
  Grid2X2,
  Phone,
  MessageCircle,
  Sparkles,
  Leaf,
  Store,
  MapPin,
  Clock,
  BadgePercent,
  Menu,
} from 'lucide-react';

import { useApp } from '@/lib/store';
import { useBasketStore } from '@/stores/basketStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { SearchOverlay } from '@/components/ui/molecules/SearchOverlay';
import { DockNav } from '@/components/ui/molecules/DockNav';
import { MAIN_NAV_ITEMS, MOBILE_DOCK_ITEMS } from '@/const/navigation';
import type { Category } from '@/lib/types';

// ──────────────────────────────────────────────────────────────────
// Sub-komponentlər (təkmilləşdirilmiş)
// ──────────────────────────────────────────────────────────────────

/** Promo Banner – autoplay, pause on hover, accessibility */
const PromoBanner = ({
  banners,
  activeIndex,
}: {
  banners?: { text?: string; color?: string }[];
  activeIndex?: number;
}) => {
  if (!banners || activeIndex == null || !banners[activeIndex]) return null;

  const banner = banners[activeIndex];
  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className={`bg-gradient-to-r ${banner.color} text-white`}
        >
          <div className="container-page flex items-center justify-center py-1.5 text-[11px] font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
            {banner.text}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

/** Mobil üçün statik banner */
const MobileStaticBanner = () => (
  <div className="lg:hidden">
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
      <div className="flex items-center justify-center py-1.5 text-[10px] font-semibold px-4">
        <Sparkles className="w-3 h-3 mr-1.5 animate-pulse shrink-0" />
        <span className="truncate">30 AZN-dən yuxarı PULSUZ çatdırılma!</span>
      </div>
    </div>
  </div>
);

/** Kateqoriya Dropdown – təkmilləşdirilmiş, scrollable, responsive */
const CategoryDropdown = ({
  categories,
  topCategories,
  moreCategories,
  isOpen,
  onToggle,
  onClose,
}: {
  categories: Category[];
  topCategories: Category[];
  moreCategories: Category[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside – bağlanma
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // ESC düyməsi ilə bağlanma
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={onToggle}
        className={`relative px-4 py-2 text-[13px] font-semibold transition-all duration-200 rounded-xl flex items-center gap-1.5 group focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
          isOpen
            ? 'text-white bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg'
            : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/50'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Grid2X2 className="w-4 h-4" />
        <motion.span whileHover={{ scale: 1.03 }}>Kateqoriyalar</motion.span>
        <motion.span animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute mt-2 w-screen max-w-[60vw] sm:max-w-[360px] rounded-2xl border border-gray-100 bg-white shadow-2xl p-5 z-50 right-0 sm:left-0"
            style={{ maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Grid2X2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-gray-900">Kateqoriyalar</p>
                  <p className="text-[10px] text-gray-400">{categories.length} kateqoriya</p>
                </div>
              </div>
              <Link
                href="/categories"
                onClick={onClose}
                className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 hover:underline"
              >
                Hamısı <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {/* Top kateqoriyalar – qruplaşdırılmış */}
            <div className="flex flex-wrap gap-2 mb-4">
              {topCategories.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/category/${c.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition-colors"
                  >
                    {i === 0 && <Sparkles className="w-3 h-3 text-yellow-500" />}
                    {c.name}
                    {c._count?.products && (
                      <span className="ml-1 bg-white text-emerald-600 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                        {c._count.products}
                      </span>
                    )}
                  </Link>
                </motion.div>
              ))}
            </div>
            {/* Digər kateqoriyalar */}
            {moreCategories.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Digər kateqoriyalar
                </p>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                  {moreCategories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/category/${c.slug}`}
                      onClick={onClose}
                      className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 group-hover:bg-emerald-500" />
                      <span className="truncate">{c.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {/* Footer – açar sözlər və bütün məhsullar */}
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[11px] text-gray-500">
                <span className="w-3 h-3 rounded-full bg-gray-300" />
                Məhsullar kateqoriyalara görə təsnif edilib
              </div>
              <Link
                href="/products"
                onClick={onClose}
                className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 hover:underline"
              >
                Bütün məhsullar <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Mobil Drawer – təkmilləşdirilmiş, drag ilə bağlanma, a11y */
const MobileDrawer = ({
  isOpen,
  onClose,
  categories,
  cartCount,
  phone,
  whatsappUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  cartCount: number;
  phone: string;
  whatsappUrl: string;
}) => {
  const dragX = useMotionValue(0);
  const dragBackdropOpacity = useTransform(dragX, [-200, 0, 200], [0.6, 0.6, 0]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const pathname = usePathname();

  const handleDragEnd = () => {
    if (dragX.get() > 120) onClose();
  };

  // Scroll blok
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC ilə bağlanma
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        style={{ opacity: dragBackdropOpacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[47]"
        onClick={onClose}
      />
      <motion.aside
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x: dragX }}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 240, damping: 28 }}
        className="fixed inset-y-0 right-0 w-[85%] sm:w-[380px] bg-white z-[50] shadow-2xl flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Mobil menyu"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="font-black text-gray-900">Menyu</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:ring-2 focus:ring-emerald-400"
              aria-label="Bağla"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Axtarış qutusu (mobil) */}
          <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Məhsul, kateqoriya axtar..."
              className="flex-1 bg-transparent text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Axtarışı işə sal
                  window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`;
                  onClose();
                }
              }}
            />
          </div>
        </div>

        {/* Navigasiya linkləri */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {MAIN_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <motion.div key={item.key} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={item.href ?? '/'}
                  onClick={onClose}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'hover:bg-emerald-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                      {item.icon && <item.icon className="w-4 h-4 text-gray-600" />}
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </Link>
              </motion.div>
            );
          })}

          {/* Səbət */}
          <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-emerald-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-gray-600" />
                </div>
                <span className="font-semibold text-gray-800 text-sm">Səbət</span>
              </div>
              <div className="flex items-center gap-2">
                {cartCount > 0 && (
                  <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </Link>
          </motion.div>

          {/* Hesab */}
          <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-emerald-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <span className="font-semibold text-gray-800 text-sm">Hesabım</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </Link>
          </motion.div>

          {/* Kateqoriyalar (açılan) */}
          <div className="mt-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Grid2X2 className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-semibold text-gray-800 text-sm">Kateqoriyalar</span>
              </div>
              <motion.span animate={{ rotate: categoriesOpen ? 180 : 0 }}>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.span>
            </motion.button>
            <AnimatePresence initial={false}>
              {categoriesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="py-2 space-y-0.5">
                    {categories
                      .filter((c) => !c.archived)
                      .map((c) => (
                        <motion.div key={c.id} whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}>
                          <Link
                            href={`/category/${c.slug}`}
                            onClick={onClose}
                            className="flex items-center justify-between px-4 py-2.5 pl-12 text-sm text-gray-700 hover:bg-emerald-50 rounded-lg"
                          >
                            <span>{c.name}</span>
                            {c._count?.products && (
                              <span className="text-[10px] text-gray-400">{c._count.products}</span>
                            )}
                          </Link>
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Footer – telefon və WhatsApp */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <a
            href={`tel:${phone}`}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> Telefonla sifariş
            </span>
            <ChevronRight className="w-4 h-4" />
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 text-green-800 text-sm font-semibold hover:bg-green-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

// ──────────────────────────────────────────────────────────────────
// Əsas HeaderClient Komponenti
// ──────────────────────────────────────────────────────────────────

interface HeaderClientProps {
  initialCategories: Category[];
  initialPromoBanners: { text: string; color: string }[];
}

export function HeaderClient({ initialCategories, initialPromoBanners }: HeaderClientProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // Store məlumatları (optimallaşdırılmış)
  const storeCategories = useApp((state) => state.categories);
  const storefrontConfig = useApp((state) => state.storefrontConfig);
  const cart = useApp((state) => state.cart);
  const basketItems = useBasketStore((state) => state.items);

  const categories = storeCategories.length ? storeCategories : initialCategories;
  const cartCount = useMemo(() => {
    const productCount = cart.reduce((sum, i) => sum + (i.qty || 0), 0);
    const basketCount = basketItems.reduce((sum, i) => sum + i.quantity, 0);
    return productCount + basketCount;
  }, [cart, basketItems]);

  const primary = storefrontConfig?.primaryColor || '#16a34a';
  const phone = storefrontConfig?.contactPhone || '+994 50 000 00 00';
  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`;

  // Kateqoriyaları böl
  const { topCategories, moreCategories } = useMemo(() => {
    const safe = categories.filter((c) => !c.archived);
    const sorted = [...safe].sort((a, b) => a.name.localeCompare(b.name, 'az'));
    return {
      topCategories: sorted.slice(0, 8),
      moreCategories: sorted.slice(8),
    };
  }, [categories]);

  // UI state
  const [scrolled, setScrolled] = useState(false);
  const [dockVisible, setDockVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Promo banner rotasiyası (pause on hover ilə)
  const [isPromoPaused, setIsPromoPaused] = useState(false);

  useEffect(() => {
    if (isPromoPaused || initialPromoBanners.length <= 1) return;
    const interval = setInterval(
      () => setActivePromoIndex((prev) => (prev + 1) % initialPromoBanners.length),
      5000
    );
    return () => clearInterval(interval);
  }, [initialPromoBanners.length, isPromoPaused]);

  // Scroll effekti
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Dock görünüşü (scroll istiqaməti)
  useEffect(() => {
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 60) setDockVisible(true);
      else if (y > lastY + 8) setDockVisible(false);
      else if (y < lastY - 8) setDockVisible(true);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobil kateqoriya lentində aktiv elementi mərkəzə gətir
  useEffect(() => {
    if (!scrollRef.current || !isMobile) return;
    const activeEl = scrollRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [pathname, topCategories, isMobile]);

  // Handlerlər
  const handleDockAction = useCallback((key: string) => {
    if (key === 'search') setSearchOpen(true);
    if (key === 'menu') setMobileOpen(true);
  }, []);

  const closeCategories = useCallback(() => setCategoriesOpen(false), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const style = { '--primary': primary } as CSSProperties;

  // ─── Desktop Layout ──────────────────────────────────────────
  if (!isMobile) {
    return (
      <>
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-50 transition-all duration-300"
          style={style}
        >
          {/* Promo banner – pause on hover */}
          <div
            onMouseEnter={() => setIsPromoPaused(true)}
            onMouseLeave={() => setIsPromoPaused(false)}
          >
            <PromoBanner banners={initialPromoBanners} activeIndex={activePromoIndex} />
          </div>

          <div
            className={`border-b backdrop-blur-xl transition-all duration-300 ${
              scrolled
                ? 'bg-white/95 shadow-lg shadow-emerald-500/5'
                : 'bg-white/80'
            }`}
          >
            {/* Top bar (yalnız desktop) */}
            <div className="hidden lg:flex items-center justify-between text-[11px] px-6 py-1.5 border-b border-emerald-50 bg-gradient-to-r from-emerald-50/50 via-white to-emerald-50/50">
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Store className="w-3 h-3 text-emerald-600" />
                  <span>Gədəbəy & Gəncə ailə təsərrüfatları</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-emerald-600" />
                  <span>Özü götürmə & Çatdırılma</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-emerald-600" />
                  <span>Hər gün 09:00 - 21:00</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <a href={`tel:${phone}`} className="font-semibold hover:text-emerald-700">
                    {phone}
                  </a>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-700">
                    WhatsApp
                  </a>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <Link
                  href="/products?discounted=true"
                  className="flex items-center gap-1 text-red-600 font-semibold hover:text-red-700"
                >
                  <BadgePercent className="w-3 h-3" /> Endirimlər
                </Link>
              </div>
            </div>

            {/* Əsas row – logo, nav, actions */}
            <motion.div
              animate={{ height: scrolled ? 68 : 84 }}
              transition={{ type: 'spring', stiffness: 200, damping: 26 }}
              className="flex items-center justify-center"
            >
              <div className="container-page flex h-full items-center justify-between gap-10">
                {/* Logo */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-16 shrink-0"
                >
                  <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                      <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-white p-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl shadow-md">
                        <Image
                          src="/organik_gedebey_logo.jpeg"
                          alt="Organik Gədəbəy Logo"
                          width={56}
                          height={56}
                          className="h-11 w-11 md:h-14 md:w-14 object-contain rounded-xl"
                          priority
                        />
                      </div>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-xl md:text-xl font-black tracking-tight text-emerald-700 uppercase">
                        Organik
                      </span>
                      <span className="text-[11px] md:text-xs font-bold tracking-[0.15em] text-gray-500 uppercase">
                        Gədəbəy
                      </span>
                    </div>
                  </Link>
                </motion.div>

                {/* Navigation (desktop) */}
                <nav className="hidden lg:flex items-center gap-1">
                  {MAIN_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.key}
                        href={item.href ?? '/'}
                        className="relative px-4 py-2 text-[13px] font-semibold transition-all duration-200 rounded-xl flex items-center gap-1.5 group focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                      >
                        <span className="relative z-10 flex items-center gap-1.5">
                          {item.icon && (
                            <motion.span
                              whileHover={{ rotate: [0, -10, 10, 0] }}
                              transition={{ duration: 0.4 }}
                              className="inline-block"
                            >
                              <item.icon className="w-4 h-4" />
                            </motion.span>
                          )}
                          <motion.span
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="relative"
                          >
                            {item.label}
                          </motion.span>
                        </span>
                        {isActive && (
                          <motion.div
                            layoutId="desktop-nav-indicator"
                            className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl -z-0"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        )}
                        {!isActive && (
                          <motion.div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-emerald-500 rounded-full group-hover:w-8 transition-all duration-300"
                            transition={{ type: 'spring', stiffness: 300 }}
                          />
                        )}
                      </Link>
                    );
                  })}
                  <CategoryDropdown
                    categories={categories}
                    topCategories={topCategories}
                    moreCategories={moreCategories}
                    isOpen={categoriesOpen}
                    onToggle={() => setCategoriesOpen((v) => !v)}
                    onClose={closeCategories}
                  />
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchOpen(true)}
                    className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                    aria-label="Axtarış"
                  >
                    <Search className="w-5 h-5 text-gray-600 hover:text-emerald-600 transition-colors" />
                  </motion.button>
                  <Link href="/cart" className="relative">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative p-2.5 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-md transition-all"
                    >
                      <ShoppingCart className="w-5 h-5 text-emerald-700" />
                      {cartCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                        >
                          {cartCount > 99 ? '99+' : cartCount}
                        </motion.span>
                      )}
                    </motion.div>
                  </Link>
                  <Link href="/account">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                    >
                      <User className="w-5 h-5 text-gray-600 hover:text-emerald-600" />
                    </motion.div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.header>

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </>
    );
  }

  // ─── Mobile Layout ──────────────────────────────────────────
  return (
    <>
      <MobileStaticBanner />

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-50 border-b border-emerald-100/60 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? 'bg-white/95 shadow-lg shadow-emerald-500/5' : 'bg-white/80'
        }`}
        style={style}
      >
        <motion.div
          animate={{ height: scrolled ? 54 : 62 }}
          transition={{ type: 'spring', stiffness: 200, damping: 26 }}
          className="flex items-center justify-between px-3"
        >
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/" className="flex items-center gap-2">
              <div className="relative overflow-hidden rounded-xl border-2 border-emerald-100 bg-white p-0.5 shadow-sm">
                <Image
                  src="/organik_gedebey_logo.jpeg"
                  alt="Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain rounded-lg"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-black tracking-tight text-emerald-700 uppercase">
                  Organik
                </span>
                <span className="text-[9px] font-bold tracking-[0.15em] text-gray-500 uppercase">
                  Gədəbəy
                </span>
              </div>
            </Link>
          </motion.div>

          <div className="flex items-center gap-1">
            <motion.a
              href={`tel:${phone}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm"
              aria-label="Telefon"
            >
              <Phone className="w-4 h-4 text-blue-600" />
            </motion.a>
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow-sm"
              aria-label="WhatsApp"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
            </motion.a>
            <Link href="/cart" className="relative">
              <div className="relative p-2 rounded-full bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center border border-white">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
            </Link>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Menyu"
            >
              <Menu className="w-4 h-4 text-gray-700" />
            </motion.button>
          </div>
        </motion.div>

        {/* Kateqoriyalar sürüşən lent (mobil) */}
        {topCategories.length > 0 && (
          <div className="pb-2 px-1 relative">
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/95 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/95 to-transparent z-10 pointer-events-none" />
            <div
              ref={scrollRef}
              className="flex gap-1.5 overflow-x-auto scrollbar-hide px-2 py-1 snap-x snap-mandatory scroll-smooth"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="snap-start shrink-0"
              >
                <Link
                  href="/products"
                  className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border ${
                    !pathname.startsWith('/category')
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-white/90 text-gray-600 border-gray-200'
                  }`}
                >
                  <Grid2X2 className="w-3.5 h-3.5" /> Hamısı
                </Link>
              </motion.div>
              {topCategories.map((cat) => {
                const isActive = pathname === `/category/${cat.slug}`;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="snap-start shrink-0"
                  >
                    <Link
                      href={`/category/${cat.slug}`}
                      data-active={isActive}
                      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 border ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                          : 'bg-white/90 text-gray-600 border-gray-200'
                      }`}
                    >
                      {cat.name}
                      {cat._count?.products != null && (
                        <span
                          className={`text-[9px] ml-0.5 px-1 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {cat._count.products}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.header>

      <MobileDrawer
        isOpen={mobileOpen}
        onClose={closeMobile}
        categories={categories}
        cartCount={cartCount}
        phone={phone}
        whatsappUrl={whatsappUrl}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: dockVisible ? 0 : 100 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="lg:hidden fixed bottom-0 inset-x-0 z-[55]"
      >
        <DockNav
          items={MOBILE_DOCK_ITEMS}
          variant="mobile"
          badgeMap={{ cart: cartCount }}
          onAction={handleDockAction}
        />
      </motion.nav>
    </>
  );
}