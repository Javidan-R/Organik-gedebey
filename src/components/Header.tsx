"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
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
  Grid2X2,
  Phone,
  MessageCircle,
  Sparkles,
  Leaf,
  Store,
  MapPin,
  Clock,
  BadgePercent,
} from "lucide-react";

import { useApp } from "@/lib/store";
import { useIsMobile } from "@/hooks/useIsMobile";
import { SearchOverlay } from "./ui/molecules/SearchOverlay";
import { DockNav } from "./ui/molecules/DockNav";
import { MAIN_NAV_ITEMS, MOBILE_DOCK_ITEMS } from "@/const/navigation";

export default function Header() {
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [scrolled, setScrolled] = useState(false);
  const [dockVisible, setDockVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Store-dan birbaşa oxu
  const categories = useApp((s) => s.categories) || [];
  const storefrontConfig = useApp((s) => s.storefrontConfig);
  const cart = useApp((s) => s.cart) || [];
  const products = useApp((s) => s.products) || [];

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + (i.qty || 0), 0), [cart]);
  const primary = storefrontConfig?.primaryColor || "#16a34a";
  const phone = storefrontConfig?.contactPhone || "+994 50 000 00 00";
  const whatsappUrl = `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;

  // Kateqoriyaları hazırla
  const { topCategories, moreCategories } = useMemo(() => {
    const safe = (categories || []).filter((c) => !c.archived);
    const sorted = [...safe].sort((a, b) => a.name.localeCompare(b.name, "az"));
    return {
      topCategories: sorted.slice(0, 8),
      moreCategories: sorted.slice(8),
    };
  }, [categories]);

  // Endirimli məhsulları tap
  const discountedCount = useMemo(() => {
    return products.filter(p => p.discountType && p.discountValue && !p.archived).length;
  }, [products]);

  const dockBadgeMap = useMemo(() => ({ cart: cartCount }), [cartCount]);

  // Promo banner rotasiya
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
      if (y < 60) setDockVisible(true);
      else if (y > lastY + 8) setDockVisible(false);
      else if (y < lastY - 8) setDockVisible(true);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!scrollRef.current || !isMobile) return;
    const activeEl = scrollRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [pathname, topCategories, isMobile]);

  const dragX = useMotionValue(0);
  const dragBackdropOpacity = useTransform(dragX, [-200, 0, 200], [0.6, 0.6, 0]);
  const handleDragEnd = () => { if (dragX.get() > 120) setMobileOpen(false); };
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : ""; }, [mobileOpen]);

  const handleDockAction = (key: string) => {
    if (key === "search") setSearchOpen(true);
    if (key === "menu") setMobileOpen(true);
  };

  const style = { "--primary": primary } as CSSProperties;

  const promoBanners = [
    { text: "🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!", color: "from-emerald-600 to-teal-600" },
    { text: "🎁 İlk sifarişə 10% endirim! Kupon: XOSGELDIN10", color: "from-orange-500 to-red-500" },
    { text: `🔥 ${discountedCount} məhsulda xüsusi endirim!`, color: "from-purple-600 to-pink-600" },
  ];

  // ─── Desktop Layout ──────────────────────────────────────────
  if (!isMobile) {
    return (
      <>
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`sticky top-0 z-50 transition-all duration-300`}
          style={style}
        >
          {/* Promo Banner */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePromoIndex}
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className={`bg-gradient-to-r ${promoBanners[activePromoIndex].color} text-white`}
              >
                <div className="container-page flex items-center justify-center py-1.5 text-[11px] font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 mr-2 animate-pulse" />
                  {promoBanners[activePromoIndex].text}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Əsas header */}
          <div className={`border-b backdrop-blur-xl transition-all duration-300 ${
            scrolled ? "bg-white/95 shadow-lg shadow-emerald-500/5" : "bg-white/80"
          }`}>
            {/* Üst mini-bar */}
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
                  <a href={`tel:${phone}`} className="font-semibold hover:text-emerald-700 transition-colors">{phone}</a>
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <a href={whatsappUrl} target="_blank" className="hover:text-emerald-700 transition-colors">WhatsApp</a>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <Link href="/products?discounted=true" className="flex items-center gap-1 text-red-600 font-semibold hover:text-red-700 transition-colors">
                  <BadgePercent className="w-3 h-3" />
                  Endirimlər
                </Link>
              </div>
            </div>

            {/* Main row */}
            <motion.div
              animate={{ height: scrolled ? 68 : 84 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="flex items-center"
            >
              <div className="container-page flex h-full items-center justify-between gap-6">
                {/* Logo + Brand */}
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 shrink-0"
                >
                  <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                      <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-100 bg-white p-1 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-emerald-500/20 shadow-md">
                        <img
                          src="/organik_gedebey_logo.jpeg"
                          alt="Organik Gədəbəy Logo"
                          className="h-11 w-11 md:h-14 md:w-14 object-contain rounded-xl"
                        />
                      </div>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"
                      >
                        <Leaf className="w-3 h-3 text-white" />
                      </motion.div>
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-lg md:text-xl font-black tracking-tight text-emerald-700 uppercase">
                        Organik
                      </span>
                      <span className="text-[11px] md:text-xs font-bold tracking-[0.15em] text-gray-500 uppercase">
                        Gədəbəy
                      </span>
                    </div>
                  </Link>
                </motion.div>

                {/* Naviqasiya – ANİMASİYALI */}
                <nav className="hidden lg:flex items-center gap-1">
                  {MAIN_NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.key}
                        href={item.href ?? "/"}
                        className={`relative px-4 py-2 text-[13px] font-semibold transition-all duration-200 rounded-xl flex items-center gap-1.5 group focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
                          isActive
                            ? "text-white bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/20"
                            : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/50"
                        }`}
                      >
                        {/* İkon animasiyası */}
                        {item.icon && (
                          <motion.span
                            className="relative z-10"
                            whileHover={{ rotate: [0, -10, 10, 0] }}
                            transition={{ duration: 0.4 }}
                          >
                            <item.icon className="w-4 h-4" />
                          </motion.span>
                        )}
                        <motion.span
                          className="relative z-10"
                          whileHover={{ scale: 1.03 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {item.label}
                        </motion.span>
                        {/* Alt indikator */}
                        {isActive && (
                          <motion.div
                            layoutId="desktop-nav-indicator"
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-white rounded-full"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                      </Link>
                    );
                  })}

                  {/* Kateqoriya dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCategoriesOpen((v) => !v)}
                      className={`relative px-4 py-2 text-[13px] font-semibold transition-all duration-200 rounded-xl flex items-center gap-1.5 group focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
                        categoriesOpen
                          ? "text-white bg-gradient-to-r from-emerald-600 to-green-600 shadow-lg shadow-emerald-500/20"
                          : "text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/50"
                      }`}
                    >
                      <Grid2X2 className="w-4 h-4 relative z-10" />
                      <motion.span className="relative z-10" whileHover={{ scale: 1.03 }}>Kateqoriyalar</motion.span>
                      <motion.span animate={{ rotate: categoriesOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="relative z-10">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {categoriesOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.96, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96, y: 8 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="absolute left-0 mt-2 w-[560px] rounded-2xl border border-gray-100 bg-white shadow-2xl shadow-gray-200/50 p-5 z-50"
                        >
                          {/* Başlıq */}
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
                              onClick={() => setCategoriesOpen(false)}
                              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                              Hamısı <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>

                          {/* Top kateqoriya çipləri */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {topCategories.map((c, i) => (
                              <motion.div
                                key={c.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.15, delay: i * 0.03 }}
                              >
                                <Link
                                  href={`/category/${c.slug}`}
                                  onClick={() => setCategoriesOpen(false)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-md transition-all border border-emerald-100"
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

                          {/* Qalan kateqoriyalar */}
                          {moreCategories.length > 0 && (
                            <div className="border-t border-gray-100 pt-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Digər kateqoriyalar
                              </p>
                              <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                                {moreCategories.map((c) => (
                                  <Link
                                    key={c.id}
                                    href={`/category/${c.slug}`}
                                    onClick={() => setCategoriesOpen(false)}
                                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors group"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 group-hover:bg-emerald-500 transition-colors" />
                                    <span className="truncate">{c.name}</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Alt CTA */}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <Info className="w-3 h-3" />
                              <span>Məhsullar kateqoriyalara görə təsnif edilib</span>
                            </div>
                            <Link
                              href="/products"
                              onClick={() => setCategoriesOpen(false)}
                              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                            >
                              Bütün məhsullar <ChevronRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </nav>

                {/* Sağ tərəf - Aksiyalar (Wishlist silindi) */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Axtarış */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSearchOpen(true)}
                    className="relative p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all group"
                    aria-label="Axtarış"
                  >
                    <Search className="w-5 h-5 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                  </motion.button>

                  {/* Səbət */}
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
                          {cartCount > 99 ? "99+" : cartCount}
                        </motion.span>
                      )}
                    </motion.div>
                  </Link>

                  {/* Hesab */}
                  <Link href="/account">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all"
                    >
                      <User className="w-5 h-5 text-gray-600" />
                    </motion.div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.header>

        {/* Search overlay */}
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      </>
    );
  }

  // ─── Mobil Layout ────────────────────────────────────────────
  return (
    <>
      {/* Promo Banner mobil */}
      <div className="lg:hidden">
        <div className={`bg-gradient-to-r from-emerald-600 to-teal-600 text-white`}>
          <div className="flex items-center justify-center py-1.5 text-[10px] font-semibold px-4">
            <Sparkles className="w-3 h-3 mr-1.5 animate-pulse shrink-0" />
            <span className="truncate">30 AZN-dən yuxarı PULSUZ çatdırılma!</span>
          </div>
        </div>
      </div>

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`sticky top-0 z-50 border-b border-emerald-100/60 backdrop-blur-xl transition-all duration-300 ${
          scrolled ? "bg-white/95 shadow-lg shadow-emerald-500/5" : "bg-white/80"
        }`}
        style={style}
      >
        <motion.div
          animate={{ height: scrolled ? 54 : 62 }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
          className="flex items-center justify-between px-3"
        >
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/" className="flex items-center gap-2">
              <div className="relative overflow-hidden rounded-xl border-2 border-emerald-100 bg-white p-0.5 shadow-sm">
                <img src="/organik_gedebey_logo.jpeg" alt="Logo" className="h-8 w-8 object-contain rounded-lg" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-black tracking-tight text-emerald-700 uppercase">Organik</span>
                <span className="text-[9px] font-bold tracking-[0.15em] text-gray-500 uppercase">Gədəbəy</span>
              </div>
            </Link>
          </motion.div>

          <div className="flex items-center gap-1">
            <motion.a
              href={`tel:${phone}`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm"
            >
              <Phone className="w-4 h-4 text-blue-600" />
            </motion.a>
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative p-2 rounded-full bg-gradient-to-br from-green-50 to-green-100 shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-green-600" />
            </motion.a>
            <Link href="/cart" className="relative">
              <div className="relative p-2 rounded-full bg-gradient-to-br from-emerald-50 to-green-50 shadow-sm">
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center border border-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Kateqoriya sürüşən lent */}
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
                transition={{ type: "spring", stiffness: 120, damping: 14 }}
                className="snap-start shrink-0"
              >
                <Link
                  href="/products"
                  className={`relative whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-300 inline-flex items-center gap-1 border ${
                    !pathname.startsWith('/category')
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                      : "bg-white/90 text-gray-600 border-gray-200 hover:border-emerald-300 active:scale-95"
                  }`}
                >
                  <Grid2X2 className="w-3.5 h-3.5" />
                  Hamısı
                </Link>
              </motion.div>
              {topCategories.map((cat) => {
                const isActive = pathname === `/category/${cat.slug}`;
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 14 }}
                    className="snap-start shrink-0"
                  >
                    <Link
                      href={`/category/${cat.slug}`}
                      data-active={isActive}
                      className={`relative whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-300 inline-flex items-center gap-1 border ${
                        isActive
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                          : "bg-white/90 text-gray-600 border-gray-200 hover:border-emerald-300 active:scale-95"
                      }`}
                    >
                      {cat.name}
                      {cat._count?.products != null && (
                        <span className={`text-[9px] ml-0.5 px-1 py-0.5 rounded-full ${
                          isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        }`}>
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

      {/* Mobile drawer – ANİMASİYALI */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              style={{ opacity: dragBackdropOpacity }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[47]"
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
              className="fixed inset-y-0 right-0 w-[85%] sm:w-[380px] bg-white z-[50] shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Leaf className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-black text-gray-900">Menyu</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Məhsul, kateqoriya axtar..."
                    className="flex-1 bg-transparent text-sm outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setSearchOpen(true);
                        setMobileOpen(false);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Nav links – hər biri animasiyalı */}
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {MAIN_NAV_ITEMS.map((item) => (
                  <motion.div
                    key={item.key}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      href={item.href ?? "/"}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-emerald-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon && (
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300">
                            <item.icon className="w-4 h-4 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                          </div>
                        )}
                        <span className="font-semibold text-gray-800 text-sm">{item.label}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </motion.div>
                ))}

                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/cart"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300">
                        <ShoppingCart className="w-4 h-4 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">Səbət</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cartCount > 0 && (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {cartCount}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>

                <motion.div whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100 group-hover:scale-110 transition-all duration-300">
                        <User className="w-4 h-4 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">Hesabım</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>

                {/* Kateqoriyalar accordion */}
                <div className="mt-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Grid2X2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">Kateqoriyalar</span>
                    </div>
                    <motion.span animate={{ rotate: mobileCategoriesOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </motion.span>
                  </motion.button>
                  <AnimatePresence initial={false}>
                    {mobileCategoriesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="py-2 space-y-0.5">
                          {categories.filter(c => !c.archived).map((c) => (
                            <motion.div
                              key={c.id}
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Link
                                href={`/category/${c.slug}`}
                                onClick={() => setMobileOpen(false)}
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

              {/* Alt əlaqə */}
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
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 text-green-800 text-sm font-semibold hover:bg-green-100 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: dockVisible ? 0 : 100 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="lg:hidden fixed bottom-0 inset-x-0 z-[55]"
      >
        <DockNav items={MOBILE_DOCK_ITEMS} variant="mobile" badgeMap={dockBadgeMap} onAction={handleDockAction} />
      </motion.nav>
    </>
  );
}