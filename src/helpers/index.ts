// src/lib/utils/shared.ts (PREMIUM UTILITY FUNCTIONS - ENHANCED)

import { ID } from "@/lib/types";
import { ProductImage } from "@/types/products";


// ====================================================================
// I. FORMATTING & DISPLAY UTILITIES
// ====================================================================

/**
 * Premium valyuta formatlaşdırıcısı.
 * Əlavə: Min/Max kəsr rəqəmləri və sıfır idarəetməsi.
 */
export const currency = (
  value?: number | null,
  minDecimals: number = 2,
  maxDecimals: number = 2,
): string => {
  if (value === undefined || value === null) return '0.00 ₼';
  
  const v = Number(value);

  // NaN yoxlaması
  if (isNaN(v)) return '0.00 ₼'; 

  return new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: 'AZN',
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }).format(v).replace('AZN', '₼'); // AZN simvolunu ₼ ilə əvəz et
};


/**
 * Məhsulun (və ya hər hansı bir obyektin) şəklini etibarlı şəkildə qaytarır.
 * Boş, null, və ya yanlış tipli məlumatları placeholder ilə əvəz edir.
 */
export function safeImageUrl(
  img?: ProductImage | string | null,
  placeholder: string = '/placeholder.jpg',
): string {
  if (!img) return placeholder;
  
  if (typeof img === 'string') {
    if (!img.trim() || img === 'null') return placeholder;
    return img;
  }
  
  // ProductImage tipindədirsə
  if (typeof img === 'object' && img !== null) {
    if (!img.url || !img.url.trim()) return placeholder;
    return img.url;
  }

  return placeholder;
}

/**
 * Müəyyən bir aralıqda olan rəqəmi məcbur edir (clamp).
 */
export const clamp = (
  value: number,
  min: number = 0,
  max: number = 100,
): number => {
  return Math.max(min, Math.min(value, max));
};

export const safeVal = (value: number): number => clamp(value, 0, 100);

/**
 * Endirim tipinə görə (faiz/sabit) formatlaşdırılmış endirim dəyərini qaytarır.
 */
export function formatDiscount(
  type: DiscountType,
  value: number,
): string {
  if (type === 'percentage') {
    return `-${value}%`;
  }
  if (type === 'fixed') {
    return `-${currency(value, 0)} (sabit)`;
  }
  return '';
}

/**
 * YENİ: Çəki məlumatını (kilogram) formatlaşdırır.
 * Məsələn: 1.545 -> 1.545 kq, 0.25 -> 250 q.
 */
export function formatWeight(weight: number | null | undefined): string {
  if (weight === null || weight === undefined || isNaN(weight)) return '0 kq';
  if (weight >= 1) {
    return `${weight.toFixed(3)} kq`;
  }
  const grams = Math.round(weight * 1000);
  return `${grams} q`;
}


// ====================================================================
// II. DATA HANDLING & MATH UTILITIES
// ====================================================================

/**
 * Məlumatları müəyyən bir key-ə görə qruplaşdırır (Admin cədvəlləri üçün faydalıdır).
 */
export function groupBy<T extends Record<string, unknown>, K extends keyof T>(
  list: T[],
  key: K,
): Record<string, T[]> {
  return list.reduce((acc, item) => {
    const group = String(item[key]);
    acc[group] = acc[group] ?? [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}


/**
 * Unikal ID massivini yoxlayır (variant ID-lərinin unikallığını yoxlamaq üçün).
 */
export function hasDuplicates(arr: ID[]): boolean {
  return new Set(arr).size !== arr.length;
}

/**
 * Rəng palitrası (Daha çox və müxtəlif rənglər).
 */
export const CHART_COLORS = [
  '#059669', // Emerald
  '#3b82f6', // Blue
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#facc15', // Yellow
  '#ef4444', // Red
  '#14b8a6', // Teal
  '#475569', // Slate
  '#d946ef', // Fuchsia
  '#65a30d', // Lime
];

/**
 * Rəng massivindən index-ə görə növbəti rəngi alır.
 */
export const getChartColor = (index: number): string => {
  return CHART_COLORS[index % CHART_COLORS.length];
};

/**
 * Maya dəyəri və satış qiymətindən mənfəəti hesablayır.
 */
export function calculateProfit(
  sellingPrice: number,
  costPrice: number,
  qty: number = 1,
): number {
  return (sellingPrice - costPrice) * qty;
}

/**
 * YENİ: Uzun ID-ni (UUID) cədvəllərdə göstərmək üçün qısaldır.
 * Məs: 1f2e3d4c... -> #1F2E3D
 */
export function shortId(id: ID, length: number = 6): string {
  if (!id) return "#000000";
  return `#${id.slice(0, length).toUpperCase()}`;
}

/**
 * YENİ: Azərbaycan hərflərini normalizə edərək URL dostu bir slug yaradır.
 */
export function slugify(text: string): string {
  const charMap: Record<string, string> = {
    ə: 'e', Ə: 'e',
    ö: 'o', Ö: 'o',
    ü: 'u', Ü: 'u',
    ğ: 'g', Ğ: 'g',
    ş: 's', Ş: 's',
    ç: 'c', Ç: 'c',
    ı: 'i', I: 'i',
  };

  return text
    .toLowerCase()
    .replace(/[əöüğşçı]/g, (m) => charMap[m] || m) // Azərbaycan hərflərini əvəz et
    .replace(/[^a-z0-9\s-]/g, '') // Hərf, rəqəm, boşluq və tire xaric hər şeyi sil
    .trim()
    .replace(/\s+/g, '-') // Boşluqları tire ilə əvəz et
    .replace(/-+/g, '-'); // Ardıcıl tireləri tək tire ilə əvəz et
}

// ====================================================================
// III. FINANCE & POS UTILITIES (ƏDV/Dəyişmə)
// ====================================================================

// Varsayılan ƏDV dərəcəsi (Azərbaycanda 18%)
const VAT_RATE = 0.18; 

/**
 * YENİ: Verilmiş qiymətdən ƏDV məbləğini hesablayır.
 */
export function calculateVAT(priceWithoutVAT: number, rate: number = VAT_RATE): number {
    // Rounding to 2 decimal places for accurate finance calculations
    return Number((priceWithoutVAT * rate).toFixed(2)); 
}

/**
 * YENİ: Qiymətə ƏDV-ni əlavə edərək yekun dəyəri tapır.
 */
export function getFinalPriceWithVAT(priceWithoutVAT: number, rate: number = VAT_RATE): number {
    const vat = calculateVAT(priceWithoutVAT, rate);
    return Number((priceWithoutVAT + vat).toFixed(2));
}

/**
 * YENİ: Kassada müştəriyə qaytarılacaq dəyişmə məbləğini hesablayır.
 */
export function calculateChange(totalAmount: number, cashReceived: number): number {
    if (cashReceived < totalAmount) {
        // Əgər ödəniş çatışmırsa, mənfi dəyişmə qaytaraq xəbərdarlıq edirik
        return Number((cashReceived - totalAmount).toFixed(2));
    }
    return Number((cashReceived - totalAmount).toFixed(2));
}


// ====================================================================
// IV. TIME & DATE UTILITIES
// ====================================================================

/**
 * Müəyyən bir tarixin keçib-keçmədiyini yoxlayır (kuponlar və aksiyalar üçün).
 */
export function isExpired(dateString: string | Date): boolean {
  const targetDate = new Date(dateString);
  const now = new Date();
  // 1 saniyəlik fərq buraxırıq
  return targetDate.getTime() < now.getTime() - 1000; 
}

/**
 * Tarixi Azərbaycan standartında formatlayır (Məs: 2025-01-01 -> 01 Yanvar 2025).
 */
export function formatDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString);
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: options?.hour ? '2-digit' : undefined,
    minute: options?.minute ? '2-digit' : undefined,
  };

  return date.toLocaleDateString('az-AZ', { ...defaultOptions, ...options });
}

/**
 * Günün ISO tarix açarını qaytarır (YYYY-MM-DD).
 */
export const todayKey = new Date().toISOString().slice(0, 10);

/**
 * 24 saatlıq qrafiklər üçün etiketlər yaradır.
 */
export const hourlyLabels = Array.from({ length: 24 }).map((_, h) =>
  h.toString().padStart(2, '0') + ':00',
);

// ====================================================================
// V. VALIDATION UTILITIES
// ====================================================================

/**
 * YENİ: Sadə Email formatı yoxlaması.
 */
export function basicEmailValidate(email: string): boolean {
  if (email.length > 255) return false;
  // Sadə REGEX yoxlaması
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 
  return emailRegex.test(email.toLowerCase());
}

/**
 * YENİ: Sadə telefon nömrəsi formatı yoxlaması (9 rəqəmli Azəri nömrələri üçün).
 */
export function basicPhoneValidate(phone: string): boolean {
  if (!phone) return false;
  // Bütün tire, boşluq və mötərizələri təmizlə
  const cleaned = phone.replace(/[()\s-]/g, '');
  // 9 rəqəmli nömrə yoxlaması (Məs: 50xxxxxxx)
  return /^\d{9}$/.test(cleaned) && ['50', '51', '55', '70', '77', '99', '40', '10'].some(prefix => cleaned.startsWith(prefix));
}


export function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

export const LOW_STOCK_THRESHOLD = 5; 

export const simulateTrend = (value: number): { percentage: number; isPositive: boolean } => {
    // Trendi 5% - 15% arasında simulyasiya edirik
    const trendPct = Math.random() * 10 + 5; 
    const isPositive = value > 0 ? (Math.random() > 0.5) : false; // Müsbət dəyərlər daha çox yüksəlir
    return {
        percentage: Number(trendPct.toFixed(1)),
        isPositive: isPositive,
    };
};
