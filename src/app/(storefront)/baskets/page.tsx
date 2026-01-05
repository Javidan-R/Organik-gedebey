"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useTransform, 
  useInView,
} from "framer-motion";
import { 
  ShoppingCart, Star, Zap, Leaf, Sparkles, Plus, Check, Info, 
  Clock, Truck, ShieldCheck, Heart, MapPin, ChevronRight, 
  ArrowRight, Award, Coffee, Sunrise, Share2, Gift, Timer,
  TrendingUp, Users, Package, Percent, Bell, Eye, ThumbsUp,
  MessageCircle, BookmarkPlus, RefreshCw, Flame, X, Download,
  Copy, Facebook, Instagram, Mail, Trash2, Moon, Sun
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type BasketVariant = "econom" | "standard" | "premium";

interface VariantInfo {
  price: number;
  originalPrice?: number;
  contents: string[];
  extras?: string[];
}

interface BasketItem {
  id: string;
  name: string;
  tagline?: string;
  description: string;
  type: string;
  servings: string;
  unit: string;
  media: { type: "image" | "video"; src: string }[];
  lowStock?: boolean;
  discount?: number;
  bestseller?: boolean;
  new?: boolean;
  variants: Record<BasketVariant, VariantInfo>;
  highlights?: string[];
  reviews?: { count: number; rating: number };
  stock?: number;
  trending?: boolean;
}

/* -------------------------------------------------------------------------- */
/* MOCK CART SYSTEM                                                           */
/* -------------------------------------------------------------------------- */

const useCart = () => {
  const [cart, setCart] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? {...i, quantity: i.quantity + item.quantity} : i);
      }
      return [...prev, item];
    });
    setToastMessage(`${item.name} səbətə əlavə olundu! 🎉`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setCart(prev => prev.map(i => i.id === id ? {...i, quantity} : i));
  };

  const clearCart = () => {
    setCart([]);
  };

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart, showToast, toastMessage };
};

/* -------------------------------------------------------------------------- */
/* DATA - EXPANDED WITH NEW BASKETS                                          */
/* -------------------------------------------------------------------------- */

const BASKETS: BasketItem[] = [
  // SƏHƏR SƏBƏTI - 2 nəfərlik
  {
    id: "sahar-2",
    name: "Səhər Süfrəsi",
    tagline: "Günə təbii və sağlam başlanğıc",
    description: "2 nəfər üçün təbii kənd məhsullarından hazırlanmış balanslı səhər süfrəsi. Hər bir məhsul səhər tezdən fermadan toplanır və dərhal qablaşdırılır.",
    type: "sahar",
    servings: "2 nəfər",
    unit: "səbət",
    bestseller: true,
    trending: true,
    stock: 12,
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=800" }],
    variants: {
      econom: { 
        price: 15, 
        originalPrice: 18, 
        contents: [
          "🥛 Kənd südü — 0.5 L",
          "🥚 Yumurta — 6 ədəd",
          "🧈 Qaymaq — 50 q",
          "🍞 Çörək — 1 ədəd"
        ] 
      },
      standard: { 
        price: 22, 
        originalPrice: 25, 
        contents: [
          "🥛 Təzə kənd südü — 1 L",
          "🧈 Camış qaymaği — 100 q",
          "🥚 Kənd yumurtası — 10 ədəd",
          "🧀 Pendir — 100 q"
        ], 
        extras: [
          "🍎 Mövsümi meyvə — 0.5 kq",
          "🍞 Təzə çörək — 2 ədəd"
        ] 
      },
      premium: { 
        price: 35, 
        originalPrice: 42, 
        contents: [
          "🥛 Camış südü — 1 L",
          "🧈 Camış qaymaği — 150 q",
          "🧀 İnək pendiri — 150 q",
          "🥚 Kənd yumurtası — 12 ədəd",
          "🥓 Ev sosisi — 200 q"
        ], 
        extras: [
          "🍯 Ev mürəbbəsi — 300 q",
          "🍞 Gəncə kürə çörəyi — 2 ədəd",
          "🥗 Təzə göyərti dəstəsi",
          "☕ Premium çay — 50 q"
        ] 
      },
    },
    highlights: ["100% təbii", "Sürətli çatdırılma", "Uşaqlar üçün uyğun"],
    reviews: { count: 127, rating: 4.8 },
  },

  // SƏHƏR SƏBƏTI - 4 nəfərlik
  {
    id: "sahar-4",
    name: "Səhər Süfrəsi (Böyük Ailə)",
    tagline: "Ailənin bütün üzvləri üçün təbii səhər",
    description: "4 nəfər üçün təbii kənd məhsullarından hazırlanmış zəngin səhər süfrəsi. Böyük ailələr üçün ideal seçim.",
    type: "sahar",
    servings: "4 nəfər",
    unit: "səbət",
    bestseller: true,
    stock: 8,
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800" }],
    variants: {
      econom: { 
        price: 28, 
        originalPrice: 33, 
        contents: [
          "🥛 Kənd südü — 1 L",
          "🥚 Yumurta — 12 ədəd",
          "🧈 Qaymaq — 100 q",
          "🍞 Çörək — 2 ədəd",
          "🧀 Pendir — 150 q"
        ] 
      },
      standard: { 
        price: 42, 
        originalPrice: 48, 
        contents: [
          "🥛 Təzə kənd südü — 2 L",
          "🧈 Camış qaymaği — 200 q",
          "🥚 Kənd yumurtası — 18 ədəd",
          "🧀 Pendir — 200 q",
          "🥓 Ev sosisi — 300 q"
        ], 
        extras: [
          "🍎 Mövsümi meyvə — 1 kq",
          "🍞 Təzə çörək — 3 ədəd",
          "🍯 Bal — 150 q"
        ] 
      },
      premium: { 
        price: 65, 
        originalPrice: 75, 
        contents: [
          "🥛 Camış südü — 2 L",
          "🧈 Camış qaymaği — 300 q",
          "🧀 İnək pendiri — 300 q",
          "🥚 Kənd yumurtası — 24 ədəd",
          "🥓 Ev sosisi — 500 q",
          "🥣 Qatıq — 500 q"
        ], 
        extras: [
          "🍯 Ev mürəbbəsi — 500 q",
          "🍞 Gəncə kürə çörəyi — 4 ədəd",
          "🥗 Təzə göyərti dəstəsi — 2 ədəd",
          "☕ Premium çay — 100 q",
          "🧁 Ev şirniyyatı — 300 q"
        ] 
      },
    },
    highlights: ["Ailə üçün", "Zəngin tərkib", "Maksimum qənaət"],
    reviews: { count: 89, rating: 4.9 },
  },

  // RAMAZAN SAHUR - 2 nəfərlik
  {
    id: "ramazan-sahur-2",
    name: "Ramazan Sahur",
    tagline: "Oruca sağlam və bərəkətli başlanğıc",
    description: "2 nəfər üçün sahur vaxtı üçün xüsusi seçilmiş, toxluq verən və faydalı məhsullar. Uzun müddətli enerji təmin edir.",
    type: "ramazan",
    servings: "2 nəfər",
    unit: "səbət",
    lowStock: true,
    discount: 15,
    stock: 5,
    trending: true,
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1587411768250-7f9a5018b580?w=800" }],
    variants: {
      econom: { 
        price: 20, 
        contents: [
          "🌴 Acvə xurması — 150 q",
          "🥛 Kənd südü — 0.5 L",
          "🍞 Lavaş — 1 ədəd",
          "🧀 Pendir — 100 q"
        ] 
      },
      standard: { 
        price: 32, 
        contents: [
          "🌴 Acvə xurması — 250 q",
          "🍯 Təbii bal — 100 q",
          "🥛 Camış südü — 1 L",
          "🥚 Yumurta — 6 ədəd"
        ], 
        extras: [
          "🍎 Mövsümi meyvə — 0.5 kq",
          "🧀 Pendir — 150 q",
          "🍞 Təzə lavaş — 2 ədəd"
        ] 
      },
      premium: { 
        price: 45, 
        contents: [
          "🌴 Acvə xurması — 350 q",
          "🍯 Təbii bal — 200 q",
          "🥛 Camış südü — 1 L",
          "🥣 Qatıq — 1 L",
          "🥚 Yumurta — 10 ədəd"
        ], 
        extras: [
          "🍞 Gəncə lavaşı — 3 ədəd",
          "🍯 Mürəbbə — 300 q",
          "🥗 Göyərti mix",
          "🌰 Qoz-fındıq qarışığı — 200 q"
        ] 
      },
    },
    highlights: ["Enerji verən", "Təbii xurma", "Mübarək seçim"],
    reviews: { count: 156, rating: 4.9 },
  },

  // RAMAZAN SAHUR - 4 nəfərlik
  {
    id: "ramazan-sahur-4",
    name: "Ramazan Sahur (Ailə)",
    tagline: "Ailənin hər üzvü üçün bərəkətli sahur",
    description: "4 nəfər üçün sahur vaxtı üçün xüsusi seçilmiş, toxluq verən və faydalı məhsullar.",
    type: "ramazan",
    servings: "4 nəfər",
    unit: "səbət",
    stock: 7,
    trending: true,
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1610415017227-c0d56d229e3e?w=800" }],
    variants: {
      econom: { 
        price: 38, 
        contents: [
          "🌴 Acvə xurması — 300 q",
          "🥛 Kənd südü — 1 L",
          "🍞 Lavaş — 2 ədəd",
          "🧀 Pendir — 200 q",
          "🥚 Yumurta — 12 ədəd"
        ] 
      },
      standard: { 
        price: 58, 
        contents: [
          "🌴 Acvə xurması — 500 q",
          "🍯 Təbii bal — 200 q",
          "🥛 Camış südü — 2 L",
          "🥚 Yumurta — 18 ədəd",
          "🧀 Pendir — 300 q"
        ], 
        extras: [
          "🍎 Mövsümi meyvə — 1 kq",
          "🍞 Təzə lavaş — 4 ədəd",
          "🥣 Qatıq — 1 L"
        ] 
      },
      premium: { 
        price: 85, 
        contents: [
          "🌴 Acvə xurması — 700 q",
          "🍯 Təbii bal — 400 q",
          "🥛 Camış südü — 2 L",
          "🥣 Qatıq — 2 L",
          "🥚 Yumurta — 24 ədəd",
          "🧀 Pendir — 500 q"
        ], 
        extras: [
          "🍞 Gəncə lavaşı — 6 ədəd",
          "🍯 Mürəbbə — 500 q",
          "🥗 Göyərti mix — 2 dəstə",
          "🌰 Qoz-fındıq qarışığı — 400 q",
          "🥙 Xəmir — 1 kq"
        ] 
      },
    },
    highlights: ["Ailə üçün", "Uzun toxluq", "Maksimum bərəkət"],
    reviews: { count: 203, rating: 5.0 },
  },

  // RAMAZAN İFTAR - 2 nəfərlik
  {
    id: "ramazan-iftar-2",
    name: "Ramazan İftar",
    tagline: "Orucunuzu ləzzətlə açın",
    description: "2 nəfər üçün iftar vaxtı üçün xüsusi hazırlanmış təbii və lezzetli məhsullar dəsti.",
    type: "ramazan",
    servings: "2 nəfər",
    unit: "səbət",
    new: true,
    stock: 15,
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800" }],
    variants: {
      econom: { 
        price: 22, 
        contents: [
          "🌴 Xurma — 200 q",
          "🥛 Ayran — 1 L",
          "🍲 Şorba hazır qarışığı",
          "🍞 Pide — 1 ədəd"
        ] 
      },
      standard: { 
        price: 35, 
        contents: [
          "🌴 Premium xurma — 300 q",
          "🥛 Ayran — 2 L",
          "🍲 Ev şorbası — 1 L",
          "🍗 Kənd toyuğu — 1 ədəd",
          "🍞 Pide — 2 ədəd"
        ], 
        extras: [
          "🥗 Salat — 500 q",
          "🍰 Şirniyyat — 200 q"
        ] 
      },
      premium: { 
        price: 55, 
        contents: [
          "🌴 Premium xurma — 500 q",
          "🥛 Ayran — 3 L",
          "🍲 Ev şorbası — 2 L",
          "🍗 Kənd toyuğu — 1.5 kq",
          "🍞 Pide — 3 ədəd",
          "🍚 Plov — 1 kq"
        ], 
        extras: [
          "🥗 Premium salat — 800 q",
          "🍰 Şirniyyat dəsti — 400 q",
          "🍹 Təbii şirə — 1 L",
          "🌰 Quru meyvə qarışığı"
        ] 
      },
    },
    highlights: ["İftar üçün ideal", "Hazır yemək", "Ləzzətli seçim"],
    reviews: { count: 78, rating: 4.7 },
  },

  // RAMAZAN İFTAR - 4 nəfərlik
  {
    id: "ramazan-iftar-4",
    name: "Ramazan İftar (Ailə)",
    tagline: "Ailə süfrəsi üçün zəngin iftar",
    description: "4 nəfər üçün iftar vaxtı üçün xüsusi hazırlanmış təbii və lezzetli məhsullar dəsti.",
    type: "ramazan",
    servings: "4 nəfər",
    unit: "səbət",
    new: true,
    stock: 10,
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800" }],
    variants: {
      econom: { 
        price: 42, 
        contents: [
          "🌴 Xurma — 400 q",
          "🥛 Ayran — 2 L",
          "🍲 Şorba hazır qarışığı — 2 kq",
          "🍞 Pide — 2 ədəd",
          "🍗 Kənd toyuğu — 1 ədəd"
        ] 
      },
      standard: { 
        price: 65, 
        contents: [
          "🌴 Premium xurma — 600 q",
          "🥛 Ayran — 3 L",
          "🍲 Ev şorbası — 2 L",
          "🍗 Kənd toyuğu — 2 ədəd",
          "🍞 Pide — 4 ədəd",
          "🍚 Plov — 2 kq"
        ], 
        extras: [
          "🥗 Salat — 1 kq",
          "🍰 Şirniyyat — 400 q",
          "🌰 Quru meyvə — 300 q"
        ] 
      },
      premium: { 
        price: 95, 
        contents: [
          "🌴 Premium xurma — 1 kq",
          "🥛 Ayran — 5 L",
          "🍲 Ev şorbası — 3 L",
          "🍗 Kənd toyuğu — 3 ədəd",
          "🍞 Pide — 6 ədəd",
          "🍚 Plov — 3 kq",
          "🥩 Ət yemək — 2 kq"
        ], 
        extras: [
          "🥗 Premium salat — 1.5 kq",
          "🍰 Şirniyyat dəsti — 800 q",
          "🍹 Təbii şirə — 2 L",
          "🌰 Quru meyvə qarışığı — 500 q",
          "🍮 Desert — 4 porsiya"
        ] 
      },
    },
    highlights: ["Ailə süfrəsi", "Tam yemək dəsti", "Rahat həll"],
    reviews: { count: 92, rating: 4.8 },
  },

  // GƏDƏBƏY YAYLA
  {
    id: "gedebey",
    name: "Gədəbəy Yaylağı",
    tagline: "Dağ havasında hazırlanan süd məhsulları",
    description: "Gədəbəy yaylaqlarından birbaşa gətirilmiş camış məhsulları. 2200m hündürlükdən, təmiz dağ havasında hazırlanır. Heç bir konservant və qatqı yoxdur.",
    type: "gedebey",
    servings: "Ailə",
    unit: "səbət",
    bestseller: true,
    trending: true,
    stock: 18,
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800" }],
    variants: {
      econom: { 
        price: 30, 
        contents: [
          "🧀 Camış pendiri — 100 q",
          "🥛 Camış südü — 0.5 L",
          "🧈 Yağ — 50 q"
        ] 
      },
      standard: { 
        price: 45, 
        contents: [
          "🧀 Camış pendiri — 150 q",
          "🥛 Camış südü — 1 L",
          "🧈 Nehrə yağı — 100 q"
        ], 
        extras: [
          "🥣 Süzmə — 200 q"
        ] 
      },
      premium: { 
        price: 65, 
        contents: [
          "🧀 Camış pendiri — 300 q",
          "🥛 Camış südü — 1.5 L",
          "🧈 Nehrə yağı — 250 q",
          "🥣 Süzmə — 500 q"
        ], 
        extras: [
          "🍎 Meyvə dəstəsi",
          "🍯 Dağ balı — 200 q"
        ] 
      },
    },
    highlights: ["Yüksək dağlıq", "Ənənəvi üsul", "Qatqısız"],
    reviews: { count: 203, rating: 5.0 },
  },

  // NOVRUZ SƏBƏTİ
  {
    id: "novruz",
    name: "Novruz Səbəti",
    tagline: "Bayram süfrəniz üçün ən yaxşı seçim",
    description: "Novruz bayramı üçün xüsusi hazırlanmış zəngin məhsul səbəti. Ənənəvi Azərbaycan məhsulları ilə dolu.",
    type: "novruz",
    servings: "Ailə",
    unit: "səbət",
    new: true,
    bestseller: true,
    stock: 15,
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800" }],
    variants: {
      econom: { 
        price: 50, 
        contents: [
          "🧀 Pendir — 200 q",
          "🥛 Süd — 1 L",
          "🧈 Yağ — 100 q",
          "🍯 Bal — 150 q",
          "🌰 Qoz-fındıq — 200 q"
        ] 
      },
      standard: { 
        price: 80, 
        contents: [
          "🧀 Pendir — 2 növ (400 q)",
          "🥛 Süd — 2 L",
          "🍯 Bal — 300 q",
          "🌰 Qoz-fındıq qarışığı — 400 q",
          "🥚 Yumurta — 12 ədəd"
        ], 
        extras: [
          "🎨 Rəngli yumurta boyası",
          "🌱 Səməni toxumu",
          "🍰 Şəkərbura — 6 ədəd"
        ] 
      },
      premium: { 
        price: 120, 
        contents: [
          "🧀 Pendir — 4 növ (800 q)",
          "🥛 Süd — 3 L",
          "🍯 Bal — 500 q",
          "🧈 Yağ — 500 q",
          "🌰 Qoz-fındıq qarışığı — 800 q",
          "🥚 Kənd yumurtası — 24 ədəd",
          "🍗 Kənd çolpası — 1 ədəd"
        ], 
        extras: [
          "🎨 Premium yumurta boyası dəsti",
          "🌱 Səməni (hazır)",
          "🍰 Şəkərbura — 12 ədəd",
          "🥮 Paxlava — 8 dilim",
          "🍬 Şirniyyat qarışığı — 500 q",
          "🎁 Eksklüziv hədiyyə qabı"
        ] 
      },
    },
    highlights: ["Bayram süfrəsi", "Ənənəvi məhsullar", "Zəngin tərkib"],
    reviews: { count: 167, rating: 4.9 },
  },
];

/* -------------------------------------------------------------------------- */
/* ANIMATED COMPONENTS                                                        */
/* -------------------------------------------------------------------------- */

const FloatingOrnament = ({ emoji, delay, x, y, size = "text-5xl" }: any) => (
  <motion.div
    initial={{ y: 0, rotate: 0, opacity: 0 }}
    animate={{ 
      y: [0, -40, 0], 
      rotate: [0, 20, -20, 0],
      opacity: [0, 0.3, 0],
      x: [0, 15, -15, 0]
    }}
    transition={{ 
      duration: 10 + Math.random() * 5, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut" 
    }}
    className={`fixed pointer-events-none select-none z-0 ${size} blur-[1px]`}
    style={{ left: x, top: y }}
  >
    {emoji}
  </motion.div>
);

const TrustStat = ({ icon: Icon, label, value, color }: any) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      whileHover={{ y: -5, scale: 1.02 }}
      className="bg-white/60 backdrop-blur-md p-6 rounded-[2.5rem] border border-emerald-100 flex items-center gap-5 shadow-sm hover:shadow-xl transition-shadow"
    >
      <motion.div 
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.5 }}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}
      >
        <Icon className="w-7 h-7" />
      </motion.div>
      <div className="flex flex-col">
        <span className="text-xl font-black text-slate-800 tracking-tight">{value}</span>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      </div>
    </motion.div>
  );
};

const LiveViewCounter = () => {
  const [views, setViews] = useState(Math.floor(Math.random() * 20) + 15);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setViews(prev => prev + Math.floor(Math.random() * 3) - 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold"
    >
      <Eye className="w-3 h-3" />
      <span>{views} nəfər indi baxır</span>
    </motion.div>
  );
};

const StockTicker = ({ stock }: { stock: number }) => {
  const [currentStock, setCurrentStock] = useState(stock);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStock > 3 && Math.random() > 0.7) {
        setCurrentStock(prev => Math.max(3, prev - 1));
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [currentStock]);

  const color = currentStock <= 5 ? "text-red-600" : currentStock <= 10 ? "text-orange-600" : "text-green-600";
  
  return (
    <motion.div
      animate={currentStock <= 5 ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      className={`flex items-center gap-2 ${color} text-xs font-bold`}
    >
      <Package className="w-3 h-3" />
      <span>Stokda: {currentStock} ədəd</span>
    </motion.div>
  );
};

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 23, seconds: 45 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-5 py-3 rounded-2xl">
      <Timer className="w-4 h-4" />
      <div className="flex items-center gap-1 text-sm font-black">
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>:<span>{String(timeLeft.minutes).padStart(2, '0')}</span>:<span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] font-bold uppercase ml-2">Endirim Bitir</span>
    </div>
  );
};

const SocialProofTicker = () => {
  const proofs = [
    "Ali M. indicə sifariş etdi 🎉",
    "Leyla A. 5 ulduz qiymət verdi ⭐",
    "Rəşad K. təkrar sifariş etdi 🔄",
    "Aynur B. məhsulu bəyəndi ❤️",
  ];
  
  const [current, setCurrent] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % proofs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={current}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
      >
        <Users className="w-3 h-3" />
        {proofs[current]}
      </motion.div>
    </AnimatePresence>
  );
};

/* -------------------------------------------------------------------------- */
/* CART DRAWER COMPONENT                                                      */
/* -------------------------------------------------------------------------- */

const CartDrawer = ({ cart, onClose, onRemove, onUpdateQuantity, onClear }: any) => {
  const total = cart.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const shareCartWhatsApp = () => {
    let message = "🛒 *Kənd Məhsulları Səbətim:*\n\n";
    
    cart.forEach((item: any) => {
      message += `📦 *${item.name}*\n`;
      message += `   Miqdar: ${item.quantity} ədəd\n`;
      message += `   Qiymət: ${item.price} AZN\n`;
      message += `   Ara cəmi: ${(item.price * item.quantity).toFixed(2)} AZN\n\n`;
    });
    
    message += `💰 *CƏMİ:* ${total.toFixed(2)} AZN\n\n`;
    message += `🌿 Təbii və sağlam seçim!`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const downloadCart = () => {
    let content = "KƏND MƏHSULLARI SƏBƏTİM\n";
    content += "=".repeat(40) + "\n\n";
    
    cart.forEach((item: any, index: number) => {
      content += `${index + 1}. ${item.name}\n`;
      content += `   Miqdar: ${item.quantity} ədəd\n`;
      content += `   Vahid qiymət: ${item.price} AZN\n`;
      content += `   Ara cəmi: ${(item.price * item.quantity).toFixed(2)} AZN\n\n`;
    });
    
    content += "=".repeat(40) + "\n";
    content += `CƏMİ: ${total.toFixed(2)} AZN\n`;
    content += `Məhsul sayı: ${totalItems}\n`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sebetim.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCartToClipboard = () => {
    let text = "🛒 Kənd Məhsulları Səbətim:\n\n";
    
    cart.forEach((item: any) => {
      text += `${item.name} - ${item.quantity}x - ${(item.price * item.quantity).toFixed(2)} AZN\n`;
    });
    
    text += `\nCƏMİ: ${total.toFixed(2)} AZN`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Səbət məlumatları kopyalandı!');
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
      />
      
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-black text-slate-900">Səbətim</h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          <p className="text-sm text-slate-600 font-medium">{totalItems} məhsul</p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ShoppingCart className="w-20 h-20 text-slate-300 mb-4" />
              </motion.div>
              <p className="text-slate-500 font-medium">Səbətiniz boşdur</p>
              <p className="text-sm text-slate-400 mt-2">Məhsul əlavə edin</p>
            </div>
          ) : (
            cart.map((item: any) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-slate-50 rounded-2xl p-4 flex gap-4"
              >
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
                
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{item.name}</h3>
                  <p className="text-emerald-600 font-black text-lg mb-2">{item.price} AZN</p>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white rounded-lg p-1">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center text-slate-700 font-bold"
                      >
                        −
                      </motion.button>
                      <span className="text-sm font-black w-8 text-center">{item.quantity}</span>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-md bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold"
                      >
                        +
                      </motion.button>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onRemove(item.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-emerald-50 to-green-50 space-y-4">
            {/* Share Options */}
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={shareCartWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-3 rounded-xl text-xs font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyCartToClipboard}
                className="flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-xl text-xs font-bold"
              >
                <Copy className="w-4 h-4" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadCart}
                className="flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-xl text-xs font-bold"
              >
                <Download className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between bg-white rounded-2xl p-4">
              <span className="text-sm font-bold text-slate-600 uppercase">Cəmi:</span>
              <span className="text-2xl font-black text-slate-900">{total.toFixed(2)} AZN</span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClear}
                className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm"
              >
                Təmizlə
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-xl font-bold text-sm"
              >
                Sifariş Et
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

export default function BasketsPage() {
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, showToast, toastMessage } = useCart();
  const { scrollYProgress } = useScroll();
  const [filter, setFilter] = useState<string>("all");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showCart, setShowCart] = useState(false);
  
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const filteredBaskets = useMemo(() => {
    if (filter === "all") return BASKETS;
    if (filter === "trending") return BASKETS.filter(b => b.trending);
    if (filter === "new") return BASKETS.filter(b => b.new);
    if (filter === "bestseller") return BASKETS.filter(b => b.bestseller);
    if (filter === "sahar") return BASKETS.filter(b => b.type === "sahar");
    if (filter === "ramazan") return BASKETS.filter(b => b.type === "ramazan");
    if (filter === "gedebey") return BASKETS.filter(b => b.type === "gedebey");
    if (filter === "novruz") return BASKETS.filter(b => b.type === "novruz");
    return BASKETS;
  }, [filter]);

  const toggleWishlist = (id: string) => {
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fafcf9] via-emerald-50/30 to-[#fafcf9] overflow-x-hidden pt-20">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.8 }}
            className="fixed top-24 right-6 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <Check className="w-5 h-5" />
            <span className="font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {showCart && (
          <CartDrawer
            cart={cart}
            onClose={() => setShowCart(false)}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onClear={clearCart}
          />
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowCart(true)}
              className="relative bg-emerald-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center"
            >
              <ShoppingCart className="w-6 h-6" />
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
              >
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </motion.span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ornaments */}
      <div className="hidden lg:block">
        <FloatingOrnament emoji="🥛" delay={0} x="5%" y="20%" />
        <FloatingOrnament emoji="🍯" delay={2} x="90%" y="15%" size="text-7xl" />
        <FloatingOrnament emoji="🧀" delay={1} x="12%" y="70%" size="text-6xl" />
        <FloatingOrnament emoji="🥚" delay={3} x="85%" y="80%" />
        <FloatingOrnament emoji="🌿" delay={4} x="45%" y="10%" size="text-8xl" />
        <FloatingOrnament emoji="🍎" delay={1.5} x="92%" y="55%" />
        <FloatingOrnament emoji="🧈" delay={5} x="8%" y="45%" size="text-4xl" />
        <FloatingOrnament emoji="🍞" delay={3.5} x="75%" y="30%" />
      </div>

      {/* Hero Section */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative py-20 px-6 text-center z-10"
      >
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full text-[10px] font-black tracking-[0.2em] mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            EKSKLÜZİV REGIONAL SƏBƏTLƏR
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-[0.8] mb-10"
          >
            Kəndin <motion.span 
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 bg-[length:200%_auto] italic"
            >
              bərəkəti
            </motion.span> <br /> 
            bir qutuda.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed mb-8"
          >
            Gədəbəyin hündür yaylaqlarından və təmiz təbiətindən ilhamlanaraq yığılmış, 
            hər bir detalı düşünülmüş özəl hədiyyəlik və ailəvi səbətlər.
          </motion.p>

          {/* Live Stats */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <LiveViewCounter />
            <SocialProofTicker />
            <CountdownTimer />
          </div>
        </div>
      </motion.section>

      {/* Trust Stats */}
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative z-10">
        <TrustStat icon={Sunrise} value="Səhər Tezdən" label="Təzə Tədarük" color="bg-orange-100 text-orange-600" />
        <TrustStat icon={ShieldCheck} value="100% Organik" label="Sertifikatlı" color="bg-emerald-100 text-emerald-600" />
        <TrustStat icon={Truck} value="24 Saat" label="Çatdırılma" color="bg-blue-100 text-blue-600" />
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 mb-16 sticky top-24 z-20">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-200 rounded-[3rem] p-2 shadow-lg flex items-center gap-2 flex-wrap"
        >
          {[
            { key: "all", label: "Hamısı", icon: Package },
            { key: "sahar", label: "Səhər", icon: Sunrise },
            { key: "ramazan", label: "Ramazan", icon: Moon },
            { key: "gedebey", label: "Gədəbəy", icon: Award },
            { key: "novruz", label: "Novruz", icon: Sun },
            { key: "trending", label: "Trend", icon: TrendingUp },
            { key: "bestseller", label: "Populyar", icon: Flame },
          ].map(item => (
            <motion.button
              key={item.key}
              onClick={() => setFilter(item.key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-6 py-3 rounded-[2rem] text-sm font-bold transition-all ${
                filter === item.key
                  ? "bg-emerald-600 text-white shadow-lg"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Baskets Grid */}
      <div className="max-w-7xl mx-auto px-6 space-y-32 pb-40 relative z-10">
        <AnimatePresence mode="wait">
          {filteredBaskets.map((basket, idx) => (
            <BasketShowcase 
              key={basket.id} 
              item={basket} 
              index={idx} 
              onAdd={addToCart}
              isWishlisted={wishlist.includes(basket.id)}
              onToggleWishlist={() => toggleWishlist(basket.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 py-32 relative overflow-hidden">
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        
        <div className="max-w-4xl mx-auto text-center px-6 relative z-10">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            <Leaf className="w-16 h-16 text-emerald-400 mx-auto mb-8" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight"
          >
            Səbətinizi Özünüz Yığın?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-300 text-lg mb-12 leading-loose"
          >
            Hazır seçimlərimiz kifayət etmirsə, bizimlə əlaqə saxlayaraq öz büdcənizə və zövqünüzə 
            uyğun xüsusi tərkibli səbət sifariş edə bilərsiniz.
          </motion.p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(16, 185, 129, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-emerald-600 text-white px-12 py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              Məsləhətçi ilə Əlaqə
            </motion.button>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="border-2 border-white/30 text-white px-12 py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition flex items-center gap-3"
            >
              <Gift className="w-5 h-5" />
              Hədiyyə Səbəti
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* BASKET SHOWCASE                                                            */
/* -------------------------------------------------------------------------- */
/* BASKET SHOWCASE                                                            */
/* -------------------------------------------------------------------------- */

const BasketShowcase = ({
  item,
  index,
  onAdd,
  isWishlisted,
  onToggleWishlist,
}: {
  item: BasketItem;
  index: number;
  onAdd: (data: any) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
}) => {
  const [variant, setVariant] = useState<BasketVariant>("standard");
  const [qty, setQty] = useState(1);
  const [showInfo, setShowInfo] = useState(false);

  // BUG FIX: variant dəyişəndə quantity reset
  useEffect(() => {
    setQty(1);
  }, [variant]);

  const variantData = item.variants[variant];
  const price = variantData.price * qty;
  const hasDiscount = variantData.originalPrice && variantData.originalPrice > variantData.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: index * 0.05 }}
      viewport={{ once: true }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
    >
      {/* IMAGE SIDE */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative rounded-[3rem] overflow-hidden shadow-2xl"
      >
        <motion.img
          src={item.media[0].src}
          alt={item.name}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.8 }}
          className="w-full h-[420px] object-cover"
        />

        {/* BADGES */}
        <div className="absolute top-6 left-6 flex gap-2">
          {item.bestseller && (
            <span className="bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-black">
              Bestseller
            </span>
          )}
          {item.new && (
            <span className="bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-black">
              Yeni
            </span>
          )}
          {item.trending && (
            <span className="bg-red-500 text-white px-4 py-1 rounded-full text-xs font-black">
              Trend
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="absolute top-6 right-6 flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onToggleWishlist}
            className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md ${
              isWishlisted ? "bg-red-500 text-white" : "bg-white/80"
            }`}
          >
            <Heart className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowInfo(true)}
            className="w-11 h-11 rounded-full bg-white/80 flex items-center justify-center backdrop-blur-md"
          >
            <Info className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* CONTENT SIDE */}
      <div className="space-y-8">
        <div>
          <h3 className="text-4xl font-black text-slate-900 mb-3">
            {item.name}
          </h3>
          <p className="text-slate-500 text-lg leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* VARIANT SELECT */}
        <div className="flex bg-slate-100 rounded-full p-1 w-fit">
          {(["econom", "standard", "premium"] as BasketVariant[]).map(v => (
            <motion.button
              key={v}
              whileTap={{ scale: 0.95 }}
              onClick={() => setVariant(v)}
              className={`px-6 py-3 rounded-full text-xs font-black uppercase transition ${
                variant === v
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-500"
              }`}
            >
              {v}
            </motion.button>
          ))}
        </div>

        {/* CONTENTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {variantData.contents.map((c, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              {c}
            </div>
          ))}

          {variantData.extras?.map((e, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-emerald-700 font-semibold"
            >
              <Sparkles className="w-4 h-4" />
              {e}
            </div>
          ))}
        </div>

        {/* PRICE + QTY */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-4xl font-black text-emerald-600">
              {price} AZN
            </div>
            {hasDiscount && (
              <div className="text-sm text-slate-400 line-through">
                {variantData.originalPrice} AZN
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full bg-slate-200 font-black"
            >
              −
            </motion.button>
            <span className="font-black text-lg w-6 text-center">
              {qty}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setQty(q => q + 1)}
              className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 font-black"
            >
              +
            </motion.button>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            onAdd({
              id: `${item.id}-${variant}`,
              name: item.name,
              price: variantData.price,
              quantity: qty,
              image: item.media[0].src,
            })
          }
          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-5 rounded-3xl font-black text-lg flex items-center justify-center gap-3 shadow-xl"
        >
          <ShoppingCart className="w-5 h-5" />
          Səbətə əlavə et
        </motion.button>
      </div>

      {/* INFO MODAL */}
      <AnimatePresence>
        {showInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInfo(false)}
              className="fixed inset-0 bg-black/60 z-[80]"
            />

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="fixed inset-0 z-[90] flex items-center justify-center px-6"
            >
              <div className="bg-white rounded-[3rem] max-w-xl w-full p-10 space-y-6 relative">
                <button
                  onClick={() => setShowInfo(false)}
                  className="absolute top-6 right-6"
                >
                  <X />
                </button>

                <h4 className="text-3xl font-black">{item.name}</h4>
                <p className="text-slate-500">{item.description}</p>

                {item.reviews && (
                  <div className="flex items-center gap-3">
                    <Star className="text-amber-400" />
                    <span className="font-bold">
                      {item.reviews.rating} / 5 ({item.reviews.count} rəy)
                    </span>
                  </div>
                )}

                {item.stock && <StockTicker stock={item.stock} />}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
