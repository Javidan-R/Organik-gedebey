// src/lib/config.ts
// Application configuration – centralized, type-safe, environment-aware


/**
 * Application configuration object.
 * All values are derived from environment variables with sensible defaults.
 */
export const APP_CONFIG = {
  // ─── Core ──────────────────────────────────────────────────────────────
  /** Site name used in meta tags, headers, and footer */
  siteName: process.env.NEXT_PUBLIC_SITE_NAME || 'Yaylaq',

  /** Base URL of the application (for canonical URLs, sitemap, etc.) */
  url: process.env.NEXT_PUBLIC_URL || 'https://yaylaq.az',

  /** Default author name for meta tags */
  author: process.env.NEXT_PUBLIC_AUTHOR || 'Yaylaq',

  /** Twitter handle (without @) for Twitter Cards */
  twitterSite: process.env.NEXT_PUBLIC_TWITTER_SITE || '@yaylaq',

  /** Google Search Console verification code */
  googleVerification: process.env.GOOGLE_VERIFICATION || '',

  // ─── Locale & Currency ────────────────────────────────────────────────
  /** Default locale */
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'az',

  /** Supported locales */
  locales: (process.env.NEXT_PUBLIC_LOCALES || 'az,en').split(',').map(l => l.trim()),

  /** Default currency */
  defaultCurrency: process.env.NEXT_PUBLIC_CURRENCY || 'AZN',

  /** Supported currencies */
  currencies: (process.env.NEXT_PUBLIC_CURRENCIES || 'AZN,USD,EUR').split(',').map(c => c.trim()),

  // ─── Pagination ────────────────────────────────────────────────────────
  pagination: {
    defaultLimit: Number(process.env.NEXT_PUBLIC_DEFAULT_PAGE_LIMIT) || 20,
    maxLimit: Number(process.env.NEXT_PUBLIC_MAX_PAGE_LIMIT) || 100,
  },

  // ─── Images ────────────────────────────────────────────────────────────
  image: {
    defaultQuality: Number(process.env.NEXT_PUBLIC_IMAGE_QUALITY) || 80,
    placeholderBlur: '/images/placeholder-blur.jpg',
    defaultCategory: '/images/category-default.jpg',
    defaultProduct: '/images/product-placeholder.jpg',
  },

  // ─── Cache ─────────────────────────────────────────────────────────────
  cache: {
    categoriesStaleTime: 1000 * 60 * 5,   // 5 minutes
    productsStaleTime: 1000 * 60 * 2,     // 2 minutes
    treeStaleTime: 1000 * 60 * 10,        // 10 minutes
  },

  // ─── API ──────────────────────────────────────────────────────────────
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || '/api',
    timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  },

  // ─── Feature Flags ────────────────────────────────────────────────────
  features: {
    enableChat: process.env.NEXT_PUBLIC_ENABLE_CHAT === 'true',
    enableReviews: process.env.NEXT_PUBLIC_ENABLE_REVIEWS !== 'false',
    enableWishlist: process.env.NEXT_PUBLIC_ENABLE_WISHLIST !== 'false',
    enableCompare: process.env.NEXT_PUBLIC_ENABLE_COMPARE === 'true',
  },

  // ─── Analytics ────────────────────────────────────────────────────────
  analytics: {
    googleId: process.env.NEXT_PUBLIC_GA_ID || '',
    facebookPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID || '',
  },

  // ─── Contact ──────────────────────────────────────────────────────────
  contact: {
    phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || '+994 50 123 45 67',
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@yaylaq.az',
    address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || 'Bakı, Azərbaycan',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+994501234567',
  },

  // ─── Social Media ─────────────────────────────────────────────────────
  social: {
    facebook: process.env.NEXT_PUBLIC_SOCIAL_FACEBOOK || 'https://facebook.com/yaylaq',
    instagram: process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || 'https://instagram.com/yaylaq',
    twitter: process.env.NEXT_PUBLIC_SOCIAL_TWITTER || 'https://twitter.com/yaylaq',
    youtube: process.env.NEXT_PUBLIC_SOCIAL_YOUTUBE || 'https://youtube.com/@yaylaq',
    telegram: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM || 'https://t.me/yaylaq',
  },

  // ─── SEO ──────────────────────────────────────────────────────────────
  seo: {
    defaultTitle: process.env.NEXT_PUBLIC_DEFAULT_TITLE || 'Yaylaq – Təbii Məhsullar',
    defaultDescription:
      process.env.NEXT_PUBLIC_DEFAULT_DESCRIPTION ||
      'Gədəbəyin ən təzə və keyfiyyətli organik məhsulları – birbaşa təbiətdən süfrənizə.',
    defaultKeywords:
      process.env.NEXT_PUBLIC_DEFAULT_KEYWORDS ||
      'organik məhsullar, təbii qidalar, sağlam qidalanma, Gədəbəy, Azərbaycan',
    ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || '/images/og-image.jpg',
    twitterCard: process.env.NEXT_PUBLIC_TWITTER_CARD || 'summary_large_image',
  },

  // ─── Environment Helpers ──────────────────────────────────────────────
  /** Check if running in production mode */
  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  },

  /** Check if running in development mode */
  get isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  },

  /** Check if running in test mode */
  get isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  },
} as const;

// ─── Type Export ──────────────────────────────────────────────────────────────
export type AppConfig = typeof APP_CONFIG;

// ─── Helper: Get full URL for a path ────────────────────────────────────────
export function getFullUrl(path: string = ''): string {
  const base = APP_CONFIG.url.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return cleanPath ? `${base}/${cleanPath}` : base;
}

// ─── Helper: Get image URL with optional transformations ──────────────────
export function getImageUrl(
  path: string,
  options?: { width?: number; height?: number; quality?: number }
): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = APP_CONFIG.url.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  let url = `${base}/${cleanPath}`;
  if (options?.width || options?.height || options?.quality) {
    const params = new URLSearchParams();
    if (options.width) params.set('w', String(options.width));
    if (options.height) params.set('h', String(options.height));
    if (options.quality) params.set('q', String(options.quality));
    url += `?${params.toString()}`;
  }
  return url;
}

// ─── Helper: Format currency ────────────────────────────────────────────────
export function formatCurrency(
  amount: number,
  currency: string = APP_CONFIG.defaultCurrency,
  locale: string = APP_CONFIG.defaultLocale
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ─── Helper: Format date ────────────────────────────────────────────────────
export function formatDate(
  date: Date | string,
  locale: string = APP_CONFIG.defaultLocale,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(d);
}

// ─── Export default for convenience ────────────────────────────────────────
export default APP_CONFIG;