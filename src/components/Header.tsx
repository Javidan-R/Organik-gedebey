"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useRef,
  type CSSProperties,
} from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  Phone,
  Info,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { useApp, type AppState } from "@/lib/store";
import type { Category, CartItem, StorefrontConfig } from "@/lib/types";


import { useIsMobile } from "@/hooks/useIsMobile";
import { SearchOverlay } from "./ui/molecules/SearchOverlay";
import { DockNav } from "./ui/molecules/DockNav";
import { MAIN_NAV_ITEMS, MOBILE_DOCK_ITEMS } from "@/const/navigation";

/* -------------------------------------------------------------------------- */
/*  SSR-SAFE SELECTOR (təkrar yazılmaması üçün copy-paste)                   */
/* -------------------------------------------------------------------------- */
function useHeaderStore<T>(selector: (state: AppState) => T, fallback: T): T {
  const subscribe = useApp.subscribe;
  const getSnapshot = () => selector(useApp.getState());
  const getServerSnapshot = () => fallback;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

const FALLBACK_CONFIG: StorefrontConfig & {
  locale: string;
  vatRate: number;
  contactEmail: string;
  contactPhone: string;
} = {
  primaryColor: "#16a34a",
  currency: "AZN",
  locale: "az-AZ",
  vatRate: 0.18,
  contactEmail: "info@organikgedebey.az",
  contactPhone: "994775878588",
};

const FALLBACK_CATEGORIES: Category[] = [];
const FALLBACK_CART: CartItem[] = [];

/* -------------------------------------------------------------------------- */
/*  HEADER                                                                   */
/* -------------------------------------------------------------------------- */
export default function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  // State – shared
  const [scrolled, setScrolled] = useState(false);
  const [dockVisible, setDockVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Store
  const categories = useHeaderStore((s) => s.categories, FALLBACK_CATEGORIES);
  const storefrontConfig = useHeaderStore((s) => s.storefrontConfig, FALLBACK_CONFIG);
  const cart = useHeaderStore((s) => s.cart, FALLBACK_CART);

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + (i.qty || 0), 0), [cart]);
  const primary = storefrontConfig.primaryColor || "#16a34a";
  const phone = storefrontConfig.contactPhone || "+994 50 000 00 00";
  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;

  // Category lists
  const { topCategories, moreCategories } = useMemo(() => {
    const safe = (categories || []).filter((c) => !c.archived);
    const sorted = [...safe].sort((a, b) => a.name.localeCompare(b.name, "az"));
    return { topCategories: sorted.slice(0, 8), moreCategories: sorted.slice(8) };
  }, [categories]);

  // Badge map for dock
  const dockBadgeMap = useMemo(() => ({ cart: cartCount }), [cartCount]);

  // Scroll effects
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 60) {
        setDockVisible(true);
      } else if (y > lastY + 8) {
        setDockVisible(false);
      } else if (y < lastY - 8) {
        setDockVisible(true);
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll active category into view
  useEffect(() => {
    if (!scrollRef.current || !isMobile) return;
    const activeEl = scrollRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [pathname, topCategories, isMobile]);

  // Mobile drawer gesture
  const dragX = useMotionValue(0);
  const dragBackdropOpacity = useTransform(dragX, [-200, 0, 200], [0.6, 0.6, 0]);
  const handleDragEnd = () => {
    if (dragX.get() > 120) setMobileOpen(false);
  };
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
  }, [mobileOpen]);

  const handleDockAction = (key: string) => {
    if (key === "search") setSearchOpen(true);
    if (key === "menu") setMobileOpen(true);
  };

  const style = { "--primary": primary } as CSSProperties;

  /* ========================== DESKTOP LAYOUT ============================= */
  if (!isMobile) {
    return (
      <>
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all ${
            scrolled ? "bg-white/90 shadow-md" : "bg-white/70 shadow-sm"
          }`}
          style={style}
        >
          {/* Top mini-bar */}
          <div className="hidden md:flex items-center justify-between text-[11px] px-6 py-1 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
            <div className="flex items-center gap-2 text-gray-600">
              <Info className="w-3 h-3 text-emerald-600" />
              <span>100% təbii məhsullar – Gədəbəydən birbaşa süfrənizə 🌿</span>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                <a href={`tel:${phone}`} className="font-semibold hover:text-emerald-700">{phone}</a>
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3 text-emerald-600" />
                <span>WhatsApp ilə sifariş mümkündür</span>
              </div>
            </div>
          </div>

          {/* Main row */}
          <motion.div
            animate={{ height: scrolled ? 66 : 78 }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
            className="flex items-center"
          >
            <div className="container-page flex h-full items-center justify-between gap-4">
              {/* Logo */}
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="relative overflow-hidden rounded-full border-2 border-emerald-100 bg-white p-0.5 transition-transform group-hover:scale-105 shadow-sm">
                    <img
                      src="/organik_gedebey_logo.jpeg"
                      alt="Organik Gədəbəy Logo"
                      className="h-10 w-10 md:h-12 md:w-12 object-contain rounded-full"
                    />
                  </div>
                </Link>
              </motion.div>

              {/* Desktop nav */}
              <nav className="hidden lg:flex items-center gap-6">
                {MAIN_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href ?? "/"}
                    className="relative overflow-hidden px-2 py-1 text-sm font-medium text-gray-700 hover:text-emerald-700 transition flex items-center gap-1 rounded-lg group"
                  >
                    {item.icon && <item.icon className="w-4 h-4 opacity-70" />}
                    <span>{item.label}</span>
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-emerald-600 scale-x-0 group-hover:scale-x-100 origin-center transition-transform" />
                  </Link>
                ))}
                {/* Category dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-emerald-500 transition"
                  >
                    <Grid2X2 className="w-4 h-4 text-emerald-600" />
                    <span>Kateqoriyalar</span>
                    {categoriesOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </button>
                  <AnimatePresence>
                    {categoriesOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-3 w-[440px] rounded-2xl border border-gray-200 bg-white shadow-2xl p-4"
                      >
                        {/* ... (same as before) */}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </nav>

              {/* Right icons */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button onClick={() => setSearchOpen(true)} className="p-2 rounded-full hover:bg-gray-100 transition"><Search className="w-5 h-5 text-gray-700" /></button>
                <Link href="/cart" className="relative">
                  <button className="p-2 rounded-full hover:bg-gray-100 transition"><ShoppingCart className="w-6 h-6 text-gray-700" /></button>
                  {cartCount > 0 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white">{cartCount > 99 ? "99+" : cartCount}</motion.span>
                  )}
                </Link>
                <Link href="/account" className="hidden sm:block"><button className="p-2 rounded-full hover:bg-gray-100 transition"><User className="w-6 h-6 text-gray-700" /></button></Link>
              </div>
            </div>
          </motion.div>
        </motion.header>

        {/* Desktop search overlay */}
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </>
    );
  }

  /* ========================== MOBILE LAYOUT ============================== */
  return (
    <>
      {/* Sticky mobile header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-50 border-b border-emerald-100/60 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? "bg-white/95 shadow-lg shadow-emerald-500/5" : "bg-white/80"
        }`}
        style={style}
      >
        {/* Logo + action ikonlar */}
        <motion.div
          animate={{ height: scrolled ? 56 : 64 }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
          className="flex items-center justify-between px-4"
        >
          {/* Logo */}
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} whileHover={{ scale: 1.03 }}>
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative overflow-hidden rounded-full border-2 border-emerald-100 bg-white p-0.5 transition-transform group-hover:scale-105 shadow-sm">
                <img
                  src="/organik_gedebey_logo.jpeg"
                  alt="Logo"
                  className="h-9 w-9 object-contain rounded-full"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base font-black tracking-tight text-emerald-700 uppercase">Organik</span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase">Gədəbəy</span>
              </div>
            </Link>
          </motion.div>

          {/* Sağ: Telefon + WhatsApp */}
          <div className="flex items-center gap-1">
            <motion.a
              href={`tel:${phone}`}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <Phone className="w-5 h-5 text-blue-600" />
              <motion.span
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-blue-400/20"
              />
            </motion.a>
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <MessageCircle className="w-5 h-5 text-green-600" />
              <motion.span
                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 3, delay: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-green-400/20"
              />
            </motion.a>
          </div>
        </motion.div>

        {/* Kateqoriya sürüşən lent – animasiyalı */}
        {topCategories.length > 0 && (
          <div className="pb-2 px-1 relative">
            {/* Sol/sağ fade */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white/95 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/95 to-transparent z-10 pointer-events-none" />

            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide px-3 py-1 snap-x snap-mandatory scroll-smooth"
            >
              {topCategories.map((cat) => {
                const isActive = pathname === `/category/${cat.slug}`;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 14 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="snap-start"
                  >
                    <Link
                      href={`/category/${cat.slug}`}
                      data-active={isActive}
                      className={`relative whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 inline-flex items-center gap-1.5 border ${
                        isActive
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20"
                          : "bg-white/80 text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                      }`}
                    >
                      {isActive && (
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center">
                          <Sparkles className="w-3 h-3 text-yellow-300" />
                        </motion.span>
                      )}
                      {cat.name}
                      {cat._count?.products != null && (
                        <span
                          className={`text-[10px] ml-1 px-1.5 py-0.5 rounded-full ${
                            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
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

      {/* Mobile drawer (Menyu → açar) */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              style={{ opacity: dragBackdropOpacity }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[47]"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              drag="x"
              dragDirectionLock
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              style={{ x: dragX }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 240, damping: 28 }}
              className="fixed inset-y-0 right-0 w-[86%] sm:w-[380px] bg-white z-[50] shadow-2xl p-6 flex flex-col"
            >
              {/* Drawer içi – əvvəlki kimi */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-1">Organik Gədəbəy</div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-1.5">🌿 Mağaza menyusu</div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-2 rounded-full bg-gray-100"><X className="w-6 h-6" /></button>
              </div>
              <div className="mb-4">
                <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <input type="text" placeholder="Məhsul, kateqoriya, açar söz..." className="flex-1 bg-transparent text-sm outline-none" />
                </div>
              </div>
              <nav className="space-y-2 mb-4">
                {MAIN_NAV_ITEMS.map((item) => (
                  <Link key={item.key} href={item.href ?? "/"} onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-medium text-gray-800">
                    <div className="flex items-center gap-3">{item.icon && <item.icon className="w-4 h-4 text-gray-600" />}<span>{item.label}</span></div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
                <Link href="/cart" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-medium text-gray-800">
                  <div className="flex items-center gap-3"><ShoppingCart className="w-4 h-4 text-gray-600" /><span>Səbət ({cartCount})</span></div><ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
                <Link href="/account" onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-medium text-gray-800">
                  <div className="flex items-center gap-3"><User className="w-4 h-4 text-gray-600" /><span>Hesabım</span></div><ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>
              </nav>
              {/* Category accordion */}
              <div className="rounded-xl border bg-gray-50 mb-4">
                <button onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)} className="w-full flex items-center justify-between px-3 py-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800"><Grid2X2 className="w-4 h-4 text-emerald-600" /> Kateqoriyalar</div>
                  {mobileCategoriesOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                <AnimatePresence initial={false}>
                  {mobileCategoriesOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t">
                      <ul className="max-h-72 overflow-y-auto text-sm">
                        {categories.filter(c => !c.archived).map(c => (
                          <li key={c.id}><Link href={`/category/${c.slug}`} onClick={() => setMobileOpen(false)} className="flex items-center justify-between px-3 py-2 hover:bg-white"><span>{c.name}</span><ChevronRight className="w-4 h-4 text-gray-400" /></Link></li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mt-auto space-y-3 pt-3 border-t border-gray-100">
                <a href={`tel:${phone}`} className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition">
                  <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> Telefonla sifariş et</span><ChevronRight className="w-4 h-4" />
                </a>
                <p className="text-[11px] text-gray-500 text-center">Gədəbəydən təzə kənd məhsulları — hər gün yenilənən assortiment 🌿</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Search overlay (shared) */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Bottom dock (reusable) */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: dockVisible ? 0 : 100 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="lg:hidden fixed bottom-0 inset-x-0 z-[55]"
      >
        <DockNav
          items={MOBILE_DOCK_ITEMS}
          variant="mobile"
          badgeMap={dockBadgeMap}
          onAction={handleDockAction}
        />
      </motion.nav>
    </>
  );
}