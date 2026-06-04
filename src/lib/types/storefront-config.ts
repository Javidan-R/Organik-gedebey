// lib/types.ts

export interface PromoBanner {
  id: string;
  text: string;
  color: string; // Tailwind gradient class, məs: "from-emerald-600 to-teal-600"
  enabled: boolean;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  tiktok?: string;
  whatsapp?: string;
}

export interface FooterQuickLink {
  id: string;
  label: string;
  href: string;
}

export interface SeoConfig {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  keywords?: string;
}

export interface BusinessHours {
  open: string;      // "09:00"
  close: string;     // "21:00"
  label?: string;    // "Hər gün"
}

export interface ProductCardConfig {
  layout: 'grid' | 'list';
  showRating: boolean;
  showDiscountBadge: boolean;
  showStockIndicator: boolean;
  showAddToCartButton: boolean;
  cardStyle: 'default' | 'compact' | 'premium';
}

export interface RecentlyViewedConfig {
  enabled: boolean;
  maxItems: number;
}

export interface BackToTopConfig {
  enabled: boolean;
  showAfter: number; // piksel
}

export interface StockIndicatorConfig {
  enabled: boolean;
  type: 'bar' | 'text';
  threshold: number; // ədəd
}

export interface SocialSharingConfig {
  enabled: boolean;
  platforms: string[]; // facebook, twitter, whatsapp, telegram
}

export interface MinimumOrderConfig {
  enabled: boolean;
  amount: number;
  message: string;
}

export interface DeliveryDatePickerConfig {
  enabled: boolean;
  minDays: number;
  maxDays: number;
}

export interface CookieConsentConfig {
  enabled: boolean;
  message: string;
  policyLink: string;
}

export interface StorefrontConfig {
  // === Branding ===
  storeName: string;
  logoUrl?: string;
  logoShortName?: string;        // Sidebar üçün qısa ad
  primaryColor: string;          // Hex, məs: '#16a34a'
  secondaryColor?: string;       // Hex
  faviconUrl?: string;

  // === Əlaqə & Ərazi ===
  contactPhone: string;
  contactEmail: string;
  address?: string;
  mapUrl?: string;

  // === İş Saatları ===
  businessHours?: BusinessHours;

  // === Maliyyə ===
  currency: 'AZN' | 'USD' | 'EUR';
  locale: string;                // 'az-AZ', 'en-US'
  vatRate: number;
  shippingFee: number;
  freeShippingThreshold: number;

  // === Header elementləri ===
  announcementBar: {
    enabled: boolean;
    text: string;
    link?: string;
    dismissible: boolean;
  };
  promoBanners: PromoBanner[];   // Header-də fırlanan bannerlər

  // === Məhsul kartı ===
  productCardConfig: ProductCardConfig;

  // === Funksionallıq flag-ları ===
  enableReviews: boolean;
  enableWishlist: boolean;
  enableLiveChat: boolean;
  enableWhatsappButton: boolean;
  enableLowStockBadge: boolean;
  enableVatOnPrices: boolean;

  // === Dinamik elementlər ===
  recentlyViewed: RecentlyViewedConfig;
  backToTop: BackToTopConfig;
  stockIndicator: StockIndicatorConfig;
  socialSharing: SocialSharingConfig;
  minimumOrderAmount: MinimumOrderConfig;
  deliveryDatePicker: DeliveryDatePickerConfig;
  cookieConsent: CookieConsentConfig;

  // === Footer elementləri ===
  footerCopyright: string;
  footerAboutText: string;
  footerQuickLinks?: FooterQuickLink[];

  // === SEO ===
  seo?: SeoConfig;

  // === Sosial şəbəkələr ===
  socialLinks?: SocialLinks;

  // === Analitika & Xüsusi kodlar ===
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  facebookPixelId?: string;
  liveChatScript?: string;      // Tawk.to, Intercom və s.
  customCss?: string;
  customJs?: string;
}

// Default konfiqurasiya (yeni sahələr əlavə olunub)
export const DEFAULT_STOREFRONT_CONFIG: StorefrontConfig = {
  storeName: 'Organik Gədəbəy',
  logoUrl: '/organik_gedebey_logo.jpeg',
  logoShortName: 'OG',
  primaryColor: '#16a34a',
  secondaryColor: '#65a30d',
  faviconUrl: '/favicon.ico',

  contactPhone: '+994773676021',
  contactEmail: 'info@organikgedebey.az',
  address: 'Bakı, Azərbaycan',
  mapUrl: '',

  businessHours: {
    open: '09:00',
    close: '21:00',
    label: 'Hər gün',
  },

  currency: 'AZN',
  locale: 'az-AZ',
  vatRate: 0.18,
  shippingFee: 5,
  freeShippingThreshold: 30,

  announcementBar: {
    enabled: true,
    text: '🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!',
    link: '/products',
    dismissible: true,
  },
  promoBanners: [
    { id: 'b1', text: '🚀 30 AZN-dən yuxarı sifarişə PULSUZ çatdırılma!', color: 'from-emerald-600 to-teal-600', enabled: true },
    { id: 'b2', text: '🎁 İlk sifarişə 10% endirim! Kupon: XOSGELDIN10', color: 'from-orange-500 to-red-500', enabled: true },
  ],

  productCardConfig: {
    layout: 'grid',
    showRating: true,
    showDiscountBadge: true,
    showStockIndicator: true,
    showAddToCartButton: true,
    cardStyle: 'default',
  },

  enableReviews: true,
  enableWishlist: true,
  enableLiveChat: false,
  enableWhatsappButton: true,
  enableLowStockBadge: true,
  enableVatOnPrices: false,

  recentlyViewed: { enabled: true, maxItems: 8 },
  backToTop: { enabled: true, showAfter: 300 },
  stockIndicator: { enabled: true, type: 'bar', threshold: 10 },
  socialSharing: { enabled: true, platforms: ['facebook', 'twitter', 'whatsapp'] },
  minimumOrderAmount: { enabled: false, amount: 20, message: 'Minimum sifariş məbləği 20₼' },
  deliveryDatePicker: { enabled: false, minDays: 1, maxDays: 7 },
  cookieConsent: { enabled: true, message: 'Sayt təcrübənizi yaxşılaşdırmaq üçün çərəzlərdən istifadə edirik.', policyLink: '/privacy' },

  footerCopyright: '© 2025 Organik Gədəbəy. Bütün hüquqlar qorunur.',
  footerAboutText: 'Biz ən təzə kənd məhsullarını təqdim edirik...',
  footerQuickLinks: [
    { id: 'fl-1', label: 'Ana Səhifə', href: '/' },
    { id: 'fl-2', label: 'Haqqımızda', href: '/about' },
    { id: 'fl-3', label: 'FAQ', href: '/faq' },
  ],

  seo: {
    metaTitle: 'Organik Gədəbəy – Təzə & Organik Məhsullar',
    metaDescription: 'Gədəbəy dağ kəndlərindən birbaşa süfrənizə. 100% təbii, organik məhsullar.',
    ogImage: '/og-image.jpg',
    keywords: 'organik, təbii, Gədəbəy, kənd məhsulları',
  },
  socialLinks: {
    facebook: 'https://facebook.com/organikgedebey',
    instagram: 'https://instagram.com/organikgedebey',
    whatsapp: '+994773676021',
  },
  googleAnalyticsId: '',
  googleTagManagerId: '',
  facebookPixelId: '',
  liveChatScript: '',
  customCss: '',
  customJs: '',
};