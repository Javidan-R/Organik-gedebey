// src/lib/types.ts

import { Product, Variant as ProductVariant, Review as ProductReview, Category as ProductCategory } from "@/types/products";



export type ID = string;

export type DiscountType = 'percentage' | 'fixed';

// Re-export types from products.ts to avoid type conflicts
export type Variant = ProductVariant;
export type Review = ProductReview;
export type Category = ProductCategory;

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
  // Hero Section Advanced Settings
  heroTableEnabled?: boolean;
  heroTableProductIds?: string[]; // Featured products to show on the table
  heroSliderEnabled?: boolean;
  heroSliderProductCount?: number; // How many products to show in slider
  heroTimelineEnabled?: boolean;
  heroTimelineSteps?: Array<{ time: string; label: string; icon: string; color: string }>;
  heroRegions?: string[]; // Harvest regions for product cards
  heroHarvestTimes?: string[]; // Harvest times for product cards
  heroLiveActivityEnabled?: boolean;
  heroWeatherEnabled?: boolean;
  heroTrustBadges?: Array<{ icon: string; title: string; description: string }>;
  heroCategoryBadges?: Array<{ icon: string; label: string; color: string }>;
  // Statistikalar (saytın alt hissəsində göstərilə bilər)
  stats: Array<{ value: string; label: string; icon?: string }>;
  // Header Banner-ləri (promo carousel)
  headerBanners: Array<{ text: string; color: string; link?: string }>;
  // Header top bar məlumatları
  headerTopBar?: {
    tagline?: string;
    location?: string;
    hours?: string;
  };
  // Naviqasiya elementləri
  navItems?: Array<{ label: string; href: string; icon?: string }>;
  // Mobile dock elementləri
  mobileDockItems?: Array<{ key: string; label: string; href: string; icon: string }>;
  // Footer
  footerCopyright: string;
  footerAboutText: string;
  footerLinks?: Array<{ label: string; href: string }>;
  footerQuickLinks?: Array<{ label: string; href: string }>;
  // Sosial media
  socialInstagram?: string;
  socialFacebook?: string;
  socialWhatsapp?: string;
  socialTelegram?: string;
  socialYoutube?: string;
  socialTwitter?: string;
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
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  canonicalUrl?: string;
  robotsTxt?: string;
  sitemapEnabled?: boolean;
  structuredData?: string; // JSON-LD
  // Analitika
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  // Xüsusi
  customCss?: string;
  customJs?: string;
  // Etibar badge-ləri
  trustBadges: Array<{ icon: string; title: string; description: string; link?: string }>;
  // Maliyyə
  vatRate?: number;
  shippingFee?: number;
  // Layout & Spacing
  containerWidth?: 'narrow' | 'default' | 'wide' | 'full';
  spacingSize?: 'compact' | 'medium' | 'relaxed' | 'spacious';
  // Typography
  headingFont?: string;
  // Animations
  enablePageTransitions?: boolean;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  // UI Effects
  enableHoverEffects?: boolean;
  enableShadows?: boolean;
  enableRoundedCorners?: boolean;
  enableGradients?: boolean;
};



/** Məhsul brendi */
export type Brand = {
    id: ID;
    name: string;
    slug: string;
    logoUrl?: string;
    description?: string;
};

/** Məhsul istehsalçısı/təchizatçısı (Brenddən fərqli ola bilər) */
export type Manufacturer = {
    id: ID;
    name: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
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

