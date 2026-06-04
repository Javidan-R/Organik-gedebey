// src/lib/types.ts

import { NutritionalFact, Product, ProductGrade, ProductImage } from "@/types/products";



export type ID = string;

export type DiscountType = 'percentage' | 'fixed';

// ————————————————————————————————————————————————————————
// Yeni Tiplər (Admin/Finance/User)
// ————————————————————————————————————————————————————————

/** İstifadəçi (müştəri və ya Admin) tərəfi. */
export type User = {
    id: ID;
    email: string;
    role: 'customer' | 'admin' | 'staff';
    name: string;
    phone?: string;
    address?: string;
    isVerified: boolean;
    createdAt: string;
};

/** Kupon və Promosyon idarəetməsi. */
export type Coupon = {
    id: ID;
    code: string;
    discountType: 'percentage' | 'fixed'; // store.ts-də istifadə olunan tip
    value: number; // Məsələn: 15 (15%) və ya 5 (5 AZN)
    expiresAt: string;
    minCartValue?: number;
    isActive: boolean;
    usageLimit?: number;
    usedCount?: number;
};

/** Admin tərəfində xərc qeydiyyatı. */
export type Expense = {
    id: ID;
    name: string;
    amount: number;
    type: 'supplier' | 'shipping' | 'marketing' | 'utility' | 'other';
    date: string; // ISO format
    notes?: string;
};

/** Admin Panelinin fərdi UI vəziyyətini yadda saxlayır. */
export type AdminUIState = {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    lastVisited: string;
    activeTab?: string;
};

// ————————————————————————————————————————————————————————
// Mövcud Tiplərin Düzəlişi və Genişləndirilməsi
// ————————————————————————————————————————————————————————

export type StorefrontConfig = {
  // Əsas
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  currency: 'AZN' | 'USD' | 'EUR';
  locale: string;
  // Görünüş
  logoUrl: string;
  faviconUrl?: string;
  siteTitle: string;
  siteDescription: string;
  fontFamily?: string;
  // Ana səhifə
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  heroButtonLink: string;
  heroImageUrl?: string;
  topBannerText: string;
  topBannerLink?: string;
  topBannerEnabled: boolean;
  // Statistikalar (saytın alt hissəsində göstərilə bilər)
  stats: Array<{ value: string; label: string; icon?: string }>;
  // Footer
  footerCopyright: string;
  footerAboutText: string;
  footerLinks?: Array<{ label: string; href: string }>;
  // Sosial media
  socialInstagram?: string;
  socialFacebook?: string;
  socialWhatsapp?: string;
  socialTelegram?: string;
  socialYoutube?: string;
  // Kontakt
  contactEmail: string;
  contactPhone: string;
  contactAddress?: string;
  deliveryInfo?: string;
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  // Analitika
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  // Xüsusi
  customCss?: string;
  customJs?: string;
  // Etibar badge-ləri
  trustBadges: Array<{ icon: string; title: string; description: string; link?: string }>;
};



/** Məhsul brendi */
export type Brand = {
    id: ID;
    name: string;
    slug: string;
    logoUrl?: string;
    description?: string;
};
export type UnitType = 
  | 'ədəd'
  | 'kq'
  | 'qram'
  | 'litr'
  | 'ml'
  | 'qutu'
  | 'paket'
  | 'balon'
  | 'meşov'
  | 'paket'
  ;
/** Məhsul istehsalçısı/təchizatçısı (Brenddən fərqli ola bilər) */
export type Manufacturer = {
    id: ID;
    name: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
};
// --- Category ---
export type Category = {
    _count: any;
    image: string;
    id: ID;
    slug: string;
    name: string;
    description?: string;
    archived?: boolean;
    featured?: boolean;
    createdAt: string;
    parentId?: ID; // Hiyerarxik struktur üçün
};
// --- Məhsulun Çeşidi (Variant) ---
export type Variant = {
    label: string;
    id: ID;
    name: string;
    sku?: string;
    price: number;
    /** Çeşidin maya dəyəri – maliyyə hesabatı üçün əsas */
    costPrice : number; // Əvvəlki adı
    arrivalCost?: number; // Daşıma xərci daxil olmaqla ümumi maya dəyəri
    /** Bu çeşidin keyfiyyət dərəcəsi (Grade) */
    grade: ProductGrade; 
    createdAt: string;
    // Stok idarəetməsi
    stock: number;
    minStock: number;
    length?: number; // cm
    // Təzəlik İdarəetməsi (Batch/Lot)
    /** Bu stok partiyasının (lot) daxil olma/istehsal tarixi (FIFO üçün vacibdir) */
    batchDate: string; 
    // Əlavə Məlumat
    allergens?: string[]; // Məsələn: ['Fındıq', 'Qlüten']
    weight?: number; // Məsələn: 0.5 (kg)
    unit?: UnitType; // Məsələn: 'kg', 'ədəd', 'litr'
    nutritionalFacts?: NutritionalFact[];
    colorHex?: string; // Məsələn: '#FF5733' (rəngli məhsullar üçün)
};
// --- Review ---
export type Review = {
    id: ID;
    productId: ID;
    name: string;
    text: string;
    rating: number;
    approved: boolean;
    createdAt: string;
};


export type CartItem = {
    productId: ID;
    variantId?: ID;
    qty: number;
};

export type KPI = {
    totalProducts: number;
    totalOrders: number;
    
    // Statusa görə sifarişlər (kpis-dən gəlir)
    ordersByStatus: { 
        pending: number;
        delivered: number;
        cancelled: number;
    };
    
    // Faktiki Maliyyə (kpis-dən gəlir)
    totals: { 
        revenue: number;
        cost: number;
        profit: number;
    };

    // Keyfiyyət & Stok Metrikaları
    avgRating: number;
    lowStock: number;       // Kritik stokda olan variantların sayı
    activeDiscounts: number;
    topRated: Product[];    // Top reytinqli məhsullar
    
    // YENİ: Stok Vəziyyəti və Potensial Maliyyə
    totalStockCost: number;     // Bütün stokun cəmi maya dəyəri
    potentialRevenue: number;   // Bütün stok satılsa, əldə olunacaq gəlir
    potentialProfit: number;    // Potensial Gəlir - Stok Maya Dəyəri
    expiredSoon: number;        // Tezliklə vaxtı bitəcək partiyaların sayı
} & {
    [x: string]: number | { 
        pending: number;
        delivered: number;
        cancelled: number;
    };
};
export type Notification = {
    id: ID;
    type: 'order' | 'review' | 'low_stock' | 'chat';
    refId: ID; // Referans obyektin ID-si
    text: string;
    read: boolean;
    createdAt: string;
};

export type ChatMessage = {
    id: ID;
    userId: ID; // Məhsula rəy yox, canlı chat nəzərdə tutulur
    text: string;
    isCustomer: boolean; // True - müştəri, False - admin/staff
    createdAt: string;
};

export type { Product };

