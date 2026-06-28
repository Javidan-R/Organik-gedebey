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
  stock?: number;
  trending?: boolean;
  origin?: string;
  freshness?: string;
  nutrition?: string[];
  video?: string;
}

export  const BASKETS: BasketItem[] = [
  {
    id: "gence-2",
    name: "Səhər Süfrəsi",
    tagline: "Günə təbii və sağlam başlanğıc",
    description: "2 nəfər üçün təbii kənd məhsullarından hazırlanmış balanslı səhər süfrəsi.",
    type: "gence",
    servings: "2 nəfər",
    unit: "səbət",
    bestseller: true,
    trending: true,
    stock: 8,
    origin: "Gədəbəy yaylaqları, 2200m",
    freshness: "Səhər 05:00-da yığılır",
    nutrition: ["Protein: 45g", "Kalsium: 800mg", "Vitamin D: 15mcg"],
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=800" }],
    variants: {
      econom: { 
        price: 25, 
        originalPrice: 32, 
        contents: [
          "🥛 Kənd südü — 0.5 L", 
          "🥚 Yumurta — 6 ədəd", 
          "🧈 Qaymaq — 100 q", 
          "🍞 Çörək — 2 ədəd",
          "🧀 Ağ pendir — 150 q",
          "🥒 Xiyar — 300 q"
        ] 
      },
      standard: { 
        price: 42, 
        originalPrice: 52, 
        contents: [
          "🥛 Təzə kənd südü — 1 L", 
          "🧈 Camış qaymaği — 200 q", 
          "🥚 Kənd yumurtası — 10 ədəd", 
          "🧀 Pendir — 250 q",
          "🧀 Lor pendiri — 200 q",
          "🥒 Xiyar — 500 q",
          "🍅 Pomidor — 500 q",
          "🫒 Zeytun — 200 q"
        ], 
        extras: [
          "🎃 Mövsümi meyvə — 0.5 kq", 
          "🍞 Təzə çörək — 3 ədəd", 
          "🍯 Dağ balı — 150 q",
          "🥗 Təzə göyərti — 1 dəstə"
        ] 
      },
      premium: { 
        price: 68, 
        originalPrice: 85, 
        contents: [
          "🥛 Camış südü — 1.5 L", 
          "🧈 Camış qaymaği — 300 q", 
          "🧀 İnək pendiri — 300 q", 
          "🧀 Lor pendiri — 300 q",
          "🧀 Motal pendiri — 200 q",
          "🥚 Kənd yumurtası — 15 ədəd", 
          "🥓 Ev sosisi — 400 q",
          "🥒 Xiyar — 700 q",
          "🍅 Pomidor — 700 q",
          "🫒 Zeytun qarışığı — 300 q",
          "🌶️ Bibər — 300 q"
        ], 
        extras: [
          "🍯 Ev mürəbbəsi — 500 q", 
          "🍞 Gəncə kürə çörəyi — 4 ədəd", 
          "🥗 Təzə göyərti dəstəsi — 2 ədəd", 
          "☕ Premium çay — 100 q", 
          "🥜 Qoz-fındıq — 200 q",
          "🍇 Üzüm — 500 q",
          "🍎 Alma — 500 q"
        ] 
      },
    },
    highlights: ["100% təbii", "Sürətli çatdırılma", "Uşaqlar üçün uyğun"],
  },
  {
    id: "gence-4",
    name: "Səhər Süfrəsi Ailə",
    tagline: "Bütün ailə üçün enerji dolu səhər",
    description: "4 nəfərlik ailə üçün zəngin və sağlam səhər yeməyi səbəti.",
    type: "gence",
    servings: "4 nəfər",
    unit: "səbət",
    trending: true,
    stock: 10,
    origin: "Gədəbəy və Şəki regionları",
    freshness: "Hər səhər təzə",
    nutrition: ["Protein: 90g", "Kalsium: 1600mg", "Vitamin A: 800mcg"],
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800" }],
    variants: {
      econom: { 
        price: 45, 
        originalPrice: 55, 
        contents: [
          "🥛 Kənd südü — 1 L", 
          "🥚 Yumurta — 12 ədəd", 
          "🧈 Qaymaq — 200 q", 
          "🍞 Çörək — 4 ədəd",
          "🧀 Ağ pendir — 300 q",
          "🥒 Xiyar — 500 q",
          "🍅 Pomidor — 500 q"
        ] 
      },
      standard: { 
        price: 72, 
        originalPrice: 88, 
        contents: [
          "🥛 Təzə kənd südü — 2 L", 
          "🧈 Camış qaymaği — 350 q", 
          "🥚 Kənd yumurtası — 18 ədəd", 
          "🧀 Pendir — 400 q",
          "🧀 Lor pendiri — 300 q",
          "🥒 Xiyar — 800 q",
          "🍅 Pomidor — 800 q",
          "🫒 Zeytun — 300 q",
          "🌶️ Bibər — 400 q"
        ], 
        extras: [
          "🎃 Mövsümi meyvə — 1 kq", 
          "🍞 Təzə çörək — 5 ədəd", 
          "🍯 Dağ balı — 250 q",
          "🥗 Təzə göyərti — 2 dəstə",
          "🥜 Qoz — 150 q"
        ] 
      },
      premium: { 
        price: 115, 
        originalPrice: 140, 
        contents: [
          "🥛 Camış südü — 3 L", 
          "🧈 Camış qaymaği — 500 q", 
          "🧀 İnək pendiri — 500 q", 
          "🧀 Lor pendiri — 400 q",
          "🧀 Motal pendiri — 300 q",
          "🧀 Şor — 300 q",
          "🥚 Kənd yumurtası — 24 ədəd", 
          "🥓 Ev sosisi — 600 q",
          "🥒 Xiyar — 1 kq",
          "🍅 Pomidor — 1 kq",
          "🫒 Zeytun qarışığı — 400 q",
          "🌶️ Bibər — 600 q"
        ], 
        extras: [
          "🍯 Ev mürəbbəsi — 750 q", 
          "🍞 Gəncə kürə çörəyi — 6 ədəd", 
          "🥗 Təzə göyərti dəstəsi — 3 ədəd", 
          "☕ Premium çay — 200 q", 
          "🥜 Qoz-fındıq — 400 q",
          "🍇 Üzüm — 800 q",
          "🍎 Alma — 800 q",
          "🍊 Portağal — 500 q"
        ] 
      },
    },
    highlights: ["Ailə üçün ideal", "Zəngin tərkib", "Enerji qaynağı"],
  },
  {
    id: "gedebey-yayla",
    name: "Gədəbəy Yaylaq Səbəti",
    tagline: "2200m hündürlükdən dağ bərəkəti",
    description: "Gədəbəy yaylaqlarından birbaşa gətirilmiş camış məhsulları. Təmiz dağ havasında hazırlanır.",
    type: "gedebey",
    servings: "Ailə",
    unit: "səbət",
    bestseller: true,
    trending: true,
    new: true,
    stock: 12,
    origin: "Gədəbəy yaylaqları — Murovdağ",
    freshness: "Hər gün təzə — 24 saat ərzində",
    nutrition: ["Protein: 60g", "Kalsium: 2000mg", "Omega-3: 500mg"],
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800" }],
    variants: {
      econom: { 
        price: 52, 
        originalPrice: 65,
        contents: [
          "🧀 Camış pendiri — 250 q", 
          "🥛 Camış südü — 1.5 L", 
          "🧈 Yağ — 200 q",
          "🥣 Qatıq — 500 q",
          "🥚 Kənd yumurtası — 6 ədəd"
        ] 
      },
      standard: { 
        price: 85, 
        originalPrice: 105,
        contents: [
          "🧀 Camış pendiri — 500 q", 
          "🥛 Camış südü — 2.5 L", 
          "🧈 Nehrə yağı — 400 q",
          "🥣 Qatıq — 1 L",
          "🥣 Süzmə — 400 q",
          "🧀 Lor pendiri — 300 q",
          "🥚 Kənd yumurtası — 12 ədəd"
        ], 
        extras: [
          "🥣 Süzmə — 500 q", 
          "🍯 Dağ balı — 300 q",
          "🥗 Dağ göyərtisi — 2 dəstə",
          "🍞 Dağ çörəyi — 3 ədəd"
        ] 
      },
      premium: { 
        price: 145, 
        originalPrice: 175,
        contents: [
          "🧀 Camış pendiri — 1 kq", 
          "🥛 Camış südü — 4 L", 
          "🧈 Nehrə yağı — 750 q", 
          "🥣 Süzmə — 1.2 kq", 
          "🧀 Keçi pendiri — 400 q",
          "🧀 Motal pendiri — 400 q",
          "🧀 Lor pendiri — 500 q",
          "🥣 Qatıq — 2 L",
          "🥚 Kənd yumurtası — 20 ədəd"
        ], 
        extras: [
          "🎃 Meyvə dəstəsi — 2.5 kq", 
          "🍯 Dağ balı — 600 q", 
          "🌰 Qoz-fındıq — 600 q", 
          "🥗 Dağ göyərtisi — 3 dəstə", 
          "☕ Dağ çayı — 300 q",
          "🍞 Dağ çörəyi — 5 ədəd",
          "🫐 Meşə meyvələri — 500 q"
        ] 
      },
    },
    highlights: ["Yüksək dağlıq", "Ənənəvi üsul", "Qatqısız"],
  },
  {
    id: "sheki-ipek",
    name: "Şəki İpək Yolu Səbəti",
    tagline: "Tarixi Şəki dadları",
    description: "Şəki bölgəsinin ənənəvi məhsulları ilə zəngin səbət. Piti, halva və daha çoxu.",
    type: "sheki",
    servings: "Ailə",
    unit: "səbət",
    bestseller: true,
    stock: 10,
    origin: "Şəki şəhəri və kəndləri",
    freshness: "Sifarişə uyğun hazırlanır",
    nutrition: ["Protein: 55g", "Kalsium: 1200mg", "Dəmir: 18mg"],
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=800" }],
    variants: {
      econom: { 
        price: 48, 
        originalPrice: 60,
        contents: [
          "🧀 Şəki pendiri — 300 q", 
          "🍯 Şəki halası — 300 q", 
          "🥛 Kənd südü — 1 L",
          "🧈 Kərə yağı — 200 q",
          "🥚 Yumurta — 10 ədəd"
        ] 
      },
      standard: { 
        price: 78, 
        originalPrice: 95,
        contents: [
          "🧀 Şəki pendiri — 500 q", 
          "🍯 Şəki halası — 500 q", 
          "🥛 Kənd südü — 2 L",
          "🧈 Kərə yağı — 350 q",
          "🥚 Yumurta — 15 ədəd",
          "🧀 Motal pendiri — 300 q",
          "🥣 Qatıq — 1 L"
        ], 
        extras: [
          "🍬 Şəki şirniyyatı — 400 q", 
          "🌰 Fındıq — 300 q",
          "🍞 Şəki çörəyi — 3 ədəd",
          "🫒 Zeytun yağı — 250 ml"
        ] 
      },
      premium: { 
        price: 135, 
        originalPrice: 165,
        contents: [
          "🧀 Şəki pendiri — 800 q", 
          "🍯 Şəki halası — 800 q", 
          "🥛 Kənd südü — 3 L",
          "🧈 Kərə yağı — 600 q",
          "🥚 Yumurta — 24 ədəd",
          "🧀 Motal pendiri — 500 q",
          "🧀 Lor pendiri — 400 q",
          "🥣 Qatıq — 2 L",
          "🥣 Süzmə — 500 q"
        ], 
        extras: [
          "🍬 Şəki paxlavası — 1 kq", 
          "🍬 Şəki şirniyyatı — 700 q",
          "🌰 Fındıq — 500 q",
          "🌰 Qoz — 400 q",
          "🍞 Şəki çörəyi — 5 ədəd",
          "🫒 Zeytun yağı — 500 ml",
          "☕ Şəki çayı — 200 q",
          "🍯 Dağ balı — 400 q"
        ] 
      },
    },
    highlights: ["Şəki ənənəsi", "Xüsusi şirniyyat", "Tarixi dadlar"],
  },
  {
    id: "lenkaran-citrus",
    name: "Lənkəran Sitrus Səbəti",
    tagline: "Subtropik cənnətdən təravət",
    description: "Lənkəran bölgəsinin məşhur sitrus meyvələri və yerli məhsulları.",
    type: "lenkaran",
    servings: "Ailə",
    unit: "səbət",
    new: true,
    stock: 14,
    origin: "Lənkəran rayonu",
    freshness: "Bağdan süfrəyə",
    nutrition: ["Vitamin C: 500mg", "Fiber: 30g", "Antioksidantlar"],
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800" }],
    variants: {
      econom: { 
        price: 38, 
        originalPrice: 48,
        contents: [
          "🍊 Portağal — 2 kq", 
          "🍋 Limon — 1 kq", 
          "🥭 Feyxoa — 500 q",
          "🫒 Zeytun — 300 q",
          "🥚 Yumurta — 10 ədəd"
        ] 
      },
      standard: { 
        price: 62, 
        originalPrice: 78,
        contents: [
          "🍊 Portağal — 3.5 kq", 
          "🍋 Limon — 1.5 kq", 
          "🥭 Feyxoa — 1 kq",
          "🥝 Kivi — 500 q",
          "🫒 Zeytun — 500 q",
          "🧀 Pendir — 300 q",
          "🥚 Yumurta — 15 ədəd",
          "🥛 Süd — 1.5 L"
        ], 
        extras: [
          "🍯 Lənkəran balı — 300 q", 
          "☕ Lənkəran çayı — 200 q",
          "🥗 Göyərti — 2 dəstə",
          "🍞 Çörək — 3 ədəd"
        ] 
      },
      premium: { 
        price: 98, 
        originalPrice: 120,
        contents: [
          "🍊 Portağal — 5 kq", 
          "🍋 Limon — 2 kq", 
          "🥭 Feyxoa — 1.5 kq",
          "🥝 Kivi — 1 kq",
          "🍌 Banan — 1 kq",
          "🫒 Zeytun — 800 q",
          "🧀 Pendir — 500 q",
          "🧀 Lor — 400 q",
          "🥚 Yumurta — 20 ədəd",
          "🥛 Süd — 2.5 L"
        ], 
        extras: [
          "🍯 Lənkəran balı — 500 q", 
          "☕ Lənkəran çayı — 350 q",
          "🥗 Göyərti — 4 dəstə",
          "🍞 Çörək — 5 ədəd",
          "🫒 Zeytun yağı — 500 ml",
          "🍬 Lənkəran şirniyyatı — 500 q",
          "🌶️ Yerli bibər — 500 q"
        ] 
      },
    },
    highlights: ["Təzə sitrus", "Vitamin C zəngin", "Subtropik məhsullar"],
  },
  {
    id: "ramazan-sahur-2",
    name: "Ramazan Sahur",
    tagline: "Oruca sağlam başlanğıc",
    description: "2 nəfər üçün sahur vaxtı üçün xüsusi seçilmiş məhsullar.",
    type: "ramazan",
    servings: "2 nəfər",
    unit: "səbət",
    lowStock: true,
    discount: 18,
    stock: 4,
    trending: true,
    origin: "Ərəb ölkələrindən və Gədəbəy",
    freshness: "Ramazan üçün xüsusi",
    nutrition: ["Enerji: 1200 kcal", "Fiber: 25g", "Protein: 50g"],
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1587411768250-7f9a5018b580?w=800" }],
    variants: {
      econom: { 
        price: 32, 
        originalPrice: 40,
        contents: [
          "🌴 Acvə xurması — 300 q", 
          "🥛 Kənd südü — 1.5 L", 
          "🍞 Lavaş — 3 ədəd", 
          "🧀 Pendir — 250 q",
          "🥚 Yumurta — 6 ədəd",
          "🫒 Zeytun — 200 q"
        ] 
      },
      standard: { 
        price: 55, 
        originalPrice: 68,
        contents: [
          "🌴 Acvə xurması — 500 q", 
          "🍯 Təbii bal — 250 q", 
          "🥛 Camış südü — 2 L", 
          "🥚 Yumurta — 12 ədəd",
          "🧀 Pendir — 400 q",
          "🧀 Lor — 300 q",
          "🫒 Zeytun — 300 q",
          "🥣 Qatıq — 1 L"
        ], 
        extras: [
          "🎃 Mövsümi meyvə — 1.5 kq", 
          "🧀 Pendir — 300 q", 
          "🍞 Təzə lavaş — 5 ədəd", 
          "🥗 Göyərti mix — 2 dəstə",
          "🌰 Badam — 200 q"
        ] 
      },
      premium: { 
        price: 88, 
        originalPrice: 110,
        contents: [
          "🌴 Acvə xurması — 800 q", 
          "🌴 Mədinə xurması — 400 q",
          "🍯 Təbii bal — 500 q", 
          "🥛 Camış südü — 3 L", 
          "🥣 Qatıq — 2 L", 
          "🥚 Yumurta — 18 ədəd",
          "🧀 Pendir — 600 q",
          "🧀 Lor — 400 q",
          "🫒 Zeytun qarışığı — 500 q"
        ], 
        extras: [
          "🍞 Gəncə lavaşı — 8 ədəd", 
          "🍯 Mürəbbə — 600 q", 
          "🥗 Göyərti mix — 3 dəstə", 
          "🌰 Qoz-fındıq qarışığı — 500 q", 
          "🧀 Premium pendir — 500 q",
          "🌰 Badam — 300 q",
          "🥜 Püstə — 200 q",
          "🎃 Meyvə dəstəsi — 2 kq"
        ] 
      },
    },
    highlights: ["Enerji verən", "Təbii xurma", "Mübarək seçim"],
  },
  {
    id: "ramazan-iftar-4",
    name: "Ramazan İftar Ailə",
    tagline: "Ailə ilə birlikdə iftar süfrəsi",
    description: "4 nəfərlik ailə üçün zəngin iftar süfrəsi məhsulları.",
    type: "ramazan",
    servings: "4 nəfər",
    unit: "səbət",
    discount: 15,
    stock: 8,
    trending: true,
    origin: "Yerli və import məhsullar",
    freshness: "İftar üçün təzə",
    nutrition: ["Enerji: 2400 kcal", "Protein: 100g", "Fiber: 45g"],
    media: [{ type: "image", src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800" }],
    variants: {
      econom: { 
        price: 58, 
        originalPrice: 72,
        contents: [
          "🌴 Xurma — 500 q", 
          "🥛 Süd — 2 L", 
          "🍞 Çörək — 4 ədəd",
          "🧀 Pendir — 400 q",
          "🥚 Yumurta — 12 ədəd",
          "🫒 Zeytun — 300 q",
          "🥒 Xiyar — 500 q",
          "🍅 Pomidor — 500 q"
        ] 
      },
      standard: { 
        price: 95, 
        originalPrice: 115,
        contents: [
          "🌴 Xurma qarışığı — 800 q", 
          "🍯 Bal — 400 q",
          "🥛 Camış südü — 3 L", 
          "🥣 Qatıq — 1.5 L",
          "🧀 Pendir — 600 q",
          "🧀 Lor — 400 q",
          "🥚 Yumurta — 18 ədəd",
          "🫒 Zeytun — 500 q",
          "🥒 Xiyar — 1 kq",
          "🍅 Pomidor — 1 kq"
        ], 
        extras: [
          "🍗 Toyuq — 1.5 kq",
          "🥗 Göyərti — 3 dəstə",
          "🍞 Çörək — 6 ədəd",
          "🌰 Qoz-fındıq — 400 q",
          "🍬 Şirniyyat — 500 q"
        ] 
      },
      premium: { 
        price: 158, 
        originalPrice: 195,
        contents: [
          "🌴 Premium xurma — 1.2 kq", 
          "🍯 Dağ balı — 700 q",
          "🥛 Camış südü — 4 L", 
          "🥣 Qatıq — 2.5 L",
          "🥣 Süzmə — 600 q",
          "🧀 Pendir — 1 kq",
          "🧀 Lor — 600 q",
          "🧀 Motal — 400 q",
          "🥚 Yumurta — 24 ədəd",
          "🫒 Zeytun qarışığı — 700 q"
        ], 
        extras: [
          "🍗 Toyuq — 2.5 kq",
          "🥩 Quzu əti — 1 kq",
          "🥗 Göyərti — 5 dəstə",
          "🍞 Çörək növləri — 8 ədəd",
          "🌰 Qoz-fındıq — 700 q",
          "🍬 Şirniyyat dəstəsi — 1 kq",
          "🎃 Meyvə dəstəsi — 3 kq",
          "☕ Premium çay — 300 q"
        ] 
      },
    },
    highlights: ["İftar süfrəsi", "Ailə üçün", "Zəngin çeşid"],
  }
]
