"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
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
  Home,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Grid2X2,
  Phone,
  Info,
  MessageCircle,
} from "lucide-react";

import { useApp, type AppState } from "@/lib/store";
import type { Category, CartItem, StorefrontConfig } from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  SSR-SAFE SELECTOR HELPER — NO getServerSnapshot LOOP                      */
/* -------------------------------------------------------------------------- */

function useHeaderStore<T>(
  selector: (state: AppState) => T,
  fallback: T,
): T {
  const subscribe = useApp.subscribe;
  const getSnapshot = () => selector(useApp.getState());
  const getServerSnapshot = () => fallback;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/* Bu fallback SSR zamanı istifadə olunur (getServerSnapshot üçün) */
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
  contactPhone :"994775878588"
  
};

const FALLBACK_CATEGORIES: Category[] = [];
const FALLBACK_CART: CartItem[] = [];

/* -------------------------------------------------------------------------- */
/*  KONSTANTLAR                                                               */
/* -------------------------------------------------------------------------- */

const MAIN_NAV = [
  { href: "/", label: "Ana Səhifə", icon: <Home className="w-4 h-4" /> },
  { href: "/products", label: "Məhsullarımız" },
  { href: "/chat", label: "Bizimlə əlaqə" },
  { href: "/baskets", label: "Səbətlər" },
];

/* -------------------------------------------------------------------------- */
/*  HEADER KOMPONENTİ                                                         */
/* -------------------------------------------------------------------------- */

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 🔒 SSR-safe Zustand oxunuşları
  const categories = useHeaderStore(
    (s) => s.categories,
    FALLBACK_CATEGORIES,
  );
  const storefrontConfig = useHeaderStore(
    (s) => s.storefrontConfig,
    FALLBACK_CONFIG,
  );
  const cart = useHeaderStore((s) => s.cart, FALLBACK_CART);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + (item.qty || 0), 0),
    [cart],
  );

  const primary = storefrontConfig.primaryColor || "#16a34a";

  const style = {
    "--primary": primary,
  } as CSSProperties;

  /* ---------------------- SCROLL-BASED ŞRİNK HEADER ---------------------- */

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------------------- MOBILE DRAWER GESTURE-CLOSE -------------------- */

  const dragX = useMotionValue(0);
  const dragBackdropOpacity = useTransform(
    dragX,
    [-200, 0, 200],
    [0.6, 0.6, 0],
  );

  const handleDragEnd = () => {
    if (dragX.get() > 120) {
      setMobileOpen(false);
    }
  };

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileOpen]);

  /* -------------------------- KATEQORİYA SPLIT --------------------------- */

  const { topCategories, moreCategories } = useMemo(() => {
    const safe = (categories || []).filter((c) => !c.archived);
    const sorted = [...safe].sort((a, b) =>
      a.name.localeCompare(b.name, "az"),
    );
    return {
      topCategories: sorted.slice(0, 6),
      moreCategories: sorted.slice(6),
    };
  }, [categories]);

  const phone = storefrontConfig.contactPhone || "+994 50 000 00 00";

  /* ---------------------------------------------------------------------- */

  return (
    <>
      {/* 🌿 STICKY HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all ${
          scrolled
            ? "bg-white/90 shadow-md"
            : "bg-white/70 shadow-sm"
        }`}
        style={style}
      >
        {/* Üst mini-bar (desktop) */}
        <div className="hidden md:flex items-center justify-between text-[11px] px-6 py-1 border-b border-gray-100 bg-gradient-to-r from-emerald-50 via-white to-emerald-50">
          <div className="flex items-center gap-2 text-gray-600">
            <Info className="w-3 h-3 text-emerald-600" />
            <span>
              100% təbii məhsullar – Gədəbəydən birbaşa süfrənizə 🌿
            </span>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-600" />
              <a
                href={`tel:${phone}`}
                className="font-semibold hover:text-emerald-700"
              >
                {phone}
              </a>
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
            {/* Sol: LOGO */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Link
                href="/"
                className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold tracking-tight"
                style={{ color: primary }}
              >
                <motion.span
                  initial={{ scale: 0.85, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16 }}
                >
                  🌿
                </motion.span>
                <span className="leading-none">
                  Organik
                  <span className="hidden sm:inline"> Gədəbəy</span>
                </span>
              </Link>
            </motion.div>

            {/* ORTA: DESKTOP NAV */}
            <nav className="hidden lg:flex items-center gap-6">
              {MAIN_NAV.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ))}

              {/* DESKTOP KATEQORİYA DROPDOWN */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCategoriesOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-emerald-500 transition"
                >
                  <Grid2X2 className="w-4 h-4 text-emerald-600" />
                  <span>Kateqoriyalar</span>
                  {categoriesOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
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
                      <div className="mb-3 flex items-center justify-between text-[11px] text-gray-500">
                        <span className="uppercase tracking-wide font-semibold">
                          Kateqoriya siyahısı
                        </span>
                        <span className="text-gray-400">
                          {categories.length} kateqoriya
                        </span>
                      </div>

                      {/* Top chip-lər */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {topCategories.map((c) => (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Link
                              href={`/category/${c.slug}`}
                              onClick={() => setCategoriesOpen(false)}
                              className="px-3 py-1.5 text-xs rounded-full bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 transition"
                            >
                              {c.name}
                            </Link>
                          </motion.div>
                        ))}
                      </div>

                      {/* Scrollable siyahı */}
                      {moreCategories.length > 0 && (
                        <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50">
                          {moreCategories.map((c) => (
                            <Link
                              key={c.id}
                              href={`/category/${c.slug}`}
                              onClick={() => setCategoriesOpen(false)}
                              className="flex items-center justify-between px-3 py-2 text-sm hover:bg-white border-b border-gray-100 last:border-none"
                            >
                              <span>{c.name}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                            </Link>
                          ))}
                        </div>
                      )}

                      {categories.length === 0 && (
                        <p className="text-xs text-gray-400 text-center py-3">
                          Hələ kateqoriya əlavə edilməyib.
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* SAĞ: ACTION ICONS */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Axtarış ikonu (desktop) */}
              <IconButton ariaLabel="Axtarış">
                <Search className="w-5 h-5 text-gray-700" />
              </IconButton>

              {/* Səbət */}
              <Link href="/cart" className="relative">
                <IconButton ariaLabel="Səbət">
                  <ShoppingCart className="w-6 h-6 text-gray-700" />
                  <AnimatePresence>
                    {cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center border-2 border-white"
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </IconButton>
              </Link>

              {/* Hesab (desktop) */}
              <Link href="/account" className="hidden sm:block">
                <IconButton ariaLabel="Hesabım">
                  <User className="w-6 h-6 text-gray-700" />
                </IconButton>
              </Link>

              {/* MOBILE MENU BTN */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 rounded-full hover:bg-gray-100 transition"
                aria-label="Menyu"
              >
                <Menu className="w-6 h-6 text-gray-800" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* MOBILE ALT KATEQORİYA CHIP-LƏR (üstün altında, mobil/tablet) */}
        {topCategories.length > 0 && (
          <div className="lg:hidden border-t border-gray-100 bg-gradient-to-r from-emerald-50/60 via-white to-emerald-50/60">
            <div className="container-page py-2 overflow-x-auto scrollbar-hide flex gap-2">
              {topCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="px-3 py-1 text-xs rounded-full bg-white border border-emerald-100 text-emerald-700 font-medium whitespace-nowrap hover:bg-emerald-50 transition"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </motion.header>

      {/* BACKDROP (MOBILE DRAWER ÜÇÜN) */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            style={{ opacity: dragBackdropOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[47]"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 📱 MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
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
            {/* Drawer header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div
                  className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-1"
                >
                  Organik Gədəbəy
                </div>
                <div className="text-lg font-extrabold text-gray-900 flex items-center gap-1.5">
                  🌿
                  <span>Mağaza menyusu</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                aria-label="Bağla"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Axtarış (mobile) */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Məhsul, kateqoriya, açar söz..."
                  className="flex-1 bg-transparent text-sm outline-none"
                />
              </div>
            </motion.div>

            {/* Əsas nav */}
            <nav className="space-y-2 mb-4">
              {MAIN_NAV.map((item) => (
                <MobileItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  onClick={() => setMobileOpen(false)}
                  leftIcon={item.icon}
                />
              ))}

              <MobileItem
                href="/cart"
                label={`Səbət (${cartCount})`}
                onClick={() => setMobileOpen(false)}
                leftIcon={<ShoppingCart className="w-4 h-4" />}
              />
              <MobileItem
                href="/account"
                label="Hesabım"
                onClick={() => setMobileOpen(false)}
                leftIcon={<User className="w-4 h-4" />}
              />
            </nav>

            {/* Kateqoriya accordion */}
            <div className="rounded-xl border bg-gray-50 mb-4">
              <button
                type="button"
                onClick={() =>
                  setMobileCategoriesOpen((value) => !value)
                }
                className="w-full flex items-center justify-between px-3 py-3"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <Grid2X2 className="w-4 h-4 text-emerald-600" />
                  <span>Kateqoriyalar</span>
                </div>
                {mobileCategoriesOpen ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              <AnimatePresence initial={false}>
                {mobileCategoriesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t"
                  >
                    <ul className="max-h-72 overflow-y-auto text-sm">
                      {(categories || [])
                        .filter((c) => !c.archived)
                        .map((c) => (
                          <motion.li
                            key={c.id}
                            initial={{ opacity: 0, x: 14 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 14 }}
                          >
                            <Link
                              href={`/category/${c.slug}`}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center justify-between px-3 py-2 hover:bg-white"
                            >
                              <span>{c.name}</span>
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </Link>
                          </motion.li>
                        ))}
                      {categories.length === 0 && (
                        <li className="px-3 py-2 text-xs text-gray-400">
                          Kateqoriya yoxdur.
                        </li>
                      )}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Alt hissə: contact & CTA */}
            <div className="mt-auto space-y-3 pt-3 border-t border-gray-100">
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 transition"
              >
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefonla sifariş et
                </span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <p className="text-[11px] text-gray-500 text-center">
                Gədəbəydən təzə kənd məhsulları — hər gün yenilənən
                assortiment 🌿
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  KÖMƏKÇİ KOMPONENTLƏR                                                     */
/* -------------------------------------------------------------------------- */

type NavLinkProps = {
  href: string;
  label: string;
  icon?: React.ReactNode;
};

function NavLink({ href, label, icon }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="relative overflow-hidden px-2 py-1 text-sm font-medium text-gray-700 hover:text-emerald-700 transition flex items-center gap-1 rounded-lg group"
    >
      {icon && <span className="opacity-70">{icon}</span>}
      <span>{label}</span>
      <span className="absolute inset-x-0 bottom-0 h-[2px] bg-emerald-600 scale-x-0 group-hover:scale-x-100 origin-center transition-transform" />
    </Link>
  );
}

type IconButtonProps = {
  children: React.ReactNode;
  ariaLabel?: string;
};

function IconButton({ children, ariaLabel }: IconButtonProps) {
  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      whileTap={{ scale: 0.88 }}
      whileHover={{ backgroundColor: "rgba(0,0,0,0.06)" }}
      className="p-2 rounded-full relative transition"
    >
      {children}
    </motion.button>
  );
}

type MobileItemProps = {
  href: string;
  label: string;
  onClick: () => void;
  leftIcon?: React.ReactNode;
};

function MobileItem({ href, label, onClick, leftIcon }: MobileItemProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
      <Link
        href={href}
        onClick={onClick}
        className="flex items-center justify-between px-3 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition font-medium text-gray-800"
      >
        <div className="flex items-center gap-3">
          {leftIcon && (
            <span className="text-gray-600 flex-shrink-0">{leftIcon}</span>
          )}
          <span>{label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </Link>
    </motion.div>
  );
}
