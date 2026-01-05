import { Category, Product, Order, OrderItem } from "@/lib/types";

// Helper function for consistent ID generation
const cryptoId = () => Math.random().toString(36).slice(2, 9);
const daysAgo = (days: number) => new Date(Date.now() - 86400000 * days).toISOString();
const daysLater = (days: number) => new Date(Date.now() + 86400000 * days).toISOString();

// ——— 1. Kateqoriyalar ———
const seedCategories: Category[] = [
  { id: "cat-honey", slug: "bal", name: "Bal", featured: true, description: "Yüksək keyfiyyətli, təbii bal növləri", createdAt: daysAgo(500) },
  { id: "cat-dairy", slug: "sud-mehsullari", name: "Süd məhsulları", featured: true, description: "Təbii inək və keçi südü məhsulları", createdAt: daysAgo(450) },
  { id: "cat-fruit", slug: "meyve", name: "Meyvə", featured: true, description: "Mövsümi, tam yetişmiş və organik meyvələr", createdAt: daysAgo(300) },
  { id: "cat-spices", slug: "edviyyat", name: "Ədviyyat", featured: false, description: "Saf və ətirli ədviyyat yığıncağı", createdAt: daysAgo(200) },
  { id: "cat-oils", slug: "yaglar", name: "Yağlar", featured: true, description: "Soyuq sıxım, 100% təbii yağlar", createdAt: daysAgo(100) },
  { id: "cat-other", slug: "digər", name: "Digər Təbii Məhsullar", featured: false, description: "Ekstra məhsullar", createdAt: daysAgo(50) },
];

// ——— 2. Məhsullar (Ümumi 10 ədəd) ———
const seedProducts: Product[] = [
  // P1: Dağ balı (Endirimdə, Gədəbəy)
  {
    id: "p-1", name: "Dağ Balı", slug: "dag-bali", description: "Gədəbəy dağlarından 100% təbii bal.",
    categoryId: "cat-honey", tags: ["organik", "təbii", "premium"], images: ["/images/honey.jpg"], organic: true,
    featured: true, originRegion: "Gədəbəy", price: 28, minStock: 8,
    discountType: "percentage", discountValue: 10, discountStart: daysAgo(5), discountEnd: daysLater(10),
    reviews: [
      { id: cryptoId(), productId: "p-1", name: "Aysel", text: "Çox dadlıdır!", rating: 5, approved: true, createdAt: daysAgo(10) },
      { id: cryptoId(), productId: "p-1", name: "Rəşad", text: "Məsləhətlidir", rating: 4, approved: true, createdAt: daysAgo(7) },
    ],
    archived: false, createdAt: daysAgo(30),
    variants: [
      { id: "v-1", name: "1 kq", price: 28, stock: 14, costPrice: 16 },
      { id: "v-2", name: "500 q", price: 16, stock: 10, costPrice: 9.5 },
    ],
  },
  // P2: Təbii Qatıq (Şamaxı)
  {
    id: "p-2", name: "Təbii Kənd Qatığı", slug: "tebii-qatiq", description: "Tam yağlı, Şamaxı otlaqlarından. Ev sayağı.",
    categoryId: "cat-dairy", tags: ["süd", "qatıq", "təbii", "yeni"], images: ["/images/yogurt.jpg"], organic: true,
    featured: true, originRegion: "Şamaxı", price: 8, minStock: 5,
    reviews: [
      { id: cryptoId(), productId: "p-2", name: "Gülnar", text: "Əla dadı var, uşaqlar üçün ideal!", rating: 5, approved: true, createdAt: daysAgo(3) },
    ],
    archived: false, createdAt: daysAgo(15),
    variants: [
      { id: "v-3", name: "1 kq", price: 8, stock: 25, costPrice: 4.5 },
      { id: "v-4", name: "500 q", price: 4.5, stock: 15, costPrice: 2.5 },
    ],
  },
  // P3: Çiçək Balı (Quba)
  {
    id: "p-3", name: "Çiçək Balı", slug: "cicek-bali", description: "Müxtəlif çiçəklərin nektarından yığılmış, yüngül dadlı bal.",
    categoryId: "cat-honey", tags: ["yüngül", "çiçək", "mövsümi"], images: ["/images/flower-honey.jpg"], organic: true,
    featured: false, originRegion: "Quba", price: 20, minStock: 10,
    discountType: "fixed", discountValue: 2, discountStart: daysAgo(4), discountEnd: daysLater(3),
    reviews: [], archived: false, createdAt: daysAgo(20),
    variants: [
      { id: "v-5", name: "750 q", price: 20, stock: 30, costPrice: 12 },
    ],
  },
  // P4: Təzə Xiyar (Meyvə/Tərəvəz - YENİ KATEQORİYA)
  {
    id: "p-4", name: "Təzə Xiyar", slug: "teze-xiyar", description: "Gəncə ərazisindən gətirilmiş, çırtma xiyar.",
    categoryId: "cat-fruit", tags: ["tərəvəz", "yaz", "yeni"], images: ["/images/cucumber.jpg"], organic: true,
    featured: true, originRegion: "Gəncə", price: 3.5, minStock: 50,
    reviews: [
      { id: cryptoId(), productId: "p-4", name: "Nigar", text: "Çox təravətlidir", rating: 5, approved: true, createdAt: daysAgo(1) },
    ],
    archived: false, createdAt: daysAgo(1), // Çox yeni məhsul
    variants: [
      { id: "v-6", name: "1 kq", price: 3.5, stock: 120, costPrice: 1.8 },
    ],
  },
  // P5: Qara İstiot (Ədviyyat - YENİ KATEQORİYA)
  {
    id: "p-5", name: "Yaxşı Qara İstiot", slug: "qara-istiot", description: "Ən keyfiyyətli qara istiot dənələri.",
    categoryId: "cat-spices", tags: ["ədviyyat", "kəskin"], images: ["/images/pepper.jpg"], organic: false,
    featured: false, originRegion: "Digər", price: 8.9, minStock: 20,
    reviews: [], archived: false, createdAt: daysAgo(90),
    variants: [
      { id: "v-7", name: "100 q", price: 8.9, stock: 45, costPrice: 5.0 },
    ],
  },
  // P6: Zeytun Yağı (Yağlar - YENİ KATEQORİYA)
  {
    id: "p-6", name: "Soyuq Sıxım Zeytun Yağı", slug: "zeytun-yagi", description: "Ekstra virgin, ilk sıxım zeytun yağı.",
    categoryId: "cat-oils", tags: ["sağlam", "yağ"], images: ["/images/olive-oil.jpg"], organic: true,
    featured: true, originRegion: "Tovuz", price: 19.9, minStock: 15,
    reviews: [
      { id: cryptoId(), productId: "p-6", name: "Fidan", text: "Salatlar üçün ideal!", rating: 5, approved: true, createdAt: daysAgo(15) },
      { id: cryptoId(), productId: "p-6", name: "Sakit", text: "Qiyməti münasibdir.", rating: 4, approved: true, createdAt: daysAgo(12) },
    ],
    archived: false, createdAt: daysAgo(60),
    variants: [
      { id: "v-8", name: "500 ml", price: 19.9, stock: 18, costPrice: 12.0 },
    ],
  },
  // P7: Keçi Pendiri (Süd)
  {
    id: "p-7", name: "Keçi Pendiri", slug: "keci-pendiri", description: "Ənənəvi üsulla hazırlanmış keçi pendiri. Zəif laktalı.",
    categoryId: "cat-dairy", tags: ["pendir", "kənd", "sağlam"], images: ["/images/cheese.jpg"], organic: true,
    featured: false, originRegion: "Şəkir", price: 15.0, minStock: 7,
    reviews: [], archived: false, createdAt: daysAgo(25),
    variants: [
      { id: "v-9", name: "500 q", price: 15.0, stock: 8, costPrice: 8.5 },
    ],
  },
  // P8: Quru Əncir (Meyvə) - Stok azdır
  {
    id: "p-8", name: "Quru Əncir", slug: "quru-encir", description: "Günəşdə qurudulmuş, şəkərsiz əncir.",
    categoryId: "cat-fruit", tags: ["quru meyvə", "enerji"], images: ["/images/fig.jpg"], organic: true,
    featured: false, originRegion: "Gədəbəy", price: 12.0, minStock: 10,
    reviews: [], archived: false, createdAt: daysAgo(120),
    variants: [
      { id: "v-10", name: "250 q", price: 12.0, stock: 4, costPrice: 6.0 }, // Stok AZDIR (4 < 10)
    ],
  },
  // P9: Nanə (Ədviyyat) - Endirimdə
  {
    id: "p-9", name: "Təzə Nanə Dəstəsi", slug: "teze-nane", description: "Çay və xörəklər üçün əla ətirli nanə.",
    categoryId: "cat-spices", tags: ["təzə ot", "çay"], images: ["/images/mint.jpg"], organic: true,
    featured: false, originRegion: "Lənkəran", price: 0.8, minStock: 50,
    discountType: "fixed", discountValue: 0.1, discountStart: daysAgo(1), discountEnd: daysLater(5),
    reviews: [], archived: false, createdAt: daysAgo(10),
    variants: [
      { id: "v-11", name: "1 dəstə", price: 0.8, stock: 150, costPrice: 0.3 },
    ],
  },
  // P10: Çəltik (Digər) - Arxivə alınmış nümunə
  {
    id: "p-10", name: "Yerli Çəltik", slug: "yerli-celtik", description: "Yüksək keyfiyyətli, yerli çəltik.",
    categoryId: "cat-other", tags: ["tərəvəz", "taxıl"], images: ["/images/rice.jpg"], organic: false,
    featured: false, originRegion: "Tovuz", price: 4.5, minStock: 100,
    reviews: [], archived: true, createdAt: daysAgo(365), // Arxivə alınıb
    variants: [
      { id: "v-12", name: "1 kq", price: 4.5, stock: 0, costPrice: 2.5 },
    ],
  },
];

// ——— 3. Sifarişlər ———
const seedOrders: Order[] = [
  // O1: Köhnə sifariş
  {
    id: "o-1", createdAt: daysAgo(7), status: "delivered", channel: "system", customerName: "Elvin",
    items: [
      { productId: "p-1", variantId: "v-1", qty: 2, priceAtOrder: 25.2, costAtOrder: 16 } as OrderItem, // Dağ Balı (endirimli)
    ],
  },
  // O2: Yeni sifariş (Gözləyən)
  {
    id: "o-2", createdAt: daysAgo(1), status: "pending", channel: "whatsapp", customerName: "Səbinə",
    items: [
      { productId: "p-2", variantId: "v-3", qty: 3, priceAtOrder: 8, costAtOrder: 4.5 } as OrderItem, // Qatıq
      { productId: "p-3", variantId: "v-5", qty: 1, priceAtOrder: 18, costAtOrder: 12 } as OrderItem, // Çiçək Balı (endirimli)
    ],
  },
  // O3: İkinci sifariş (Çatdırılıb)
  {
    id: "o-3", createdAt: daysAgo(14), status: "delivered", channel: "system", customerName: "Fərid",
    items: [
      { productId: "p-6", variantId: "v-8", qty: 1, priceAtOrder: 19.9, costAtOrder: 12.0 } as OrderItem, // Zeytun Yağı
      { productId: "p-4", variantId: "v-6", qty: 5, priceAtOrder: 3.5, costAtOrder: 1.8 } as OrderItem,   // Xiyar
    ],
  },
  // O4: Ləğv olunmuş sifariş
  {
    id: "o-4", createdAt: daysAgo(2), status: "cancelled", channel: "whatsapp", customerName: "Lalə",
    items: [
      { productId: "p-7", variantId: "v-9", qty: 1, priceAtOrder: 15.0, costAtOrder: 8.5 } as OrderItem, // Keçi Pendiri
    ],
  },
];


// İxrac üçün
export const initialProducts = seedProducts;
export const initialCategories = seedCategories;
export const initialOrders = seedOrders;